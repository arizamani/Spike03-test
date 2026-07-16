// SPIKE-03 P0 fixture generator (throwaway, disposable).
// Emits placeholder multi-part GLBs + preview images into public/assets/,
// at the exact local paths the manifest's ${CLOUDFRONT_DOMAIN} URLs resolve
// to once substituted with LOCAL_ASSET_BASE_URL (handoff §7).
//
// Consumes fixtures/manifest.sample.json read-only — never rewrites it
// (isolated-spike rule; manifest is the SPIKE-04 consistency contract).

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import * as THREE from "three";

// GLTFExporter's binary path uses browser FileReader over a Blob; Node has
// global Blob (18+) but not FileReader — minimal polyfill for this one call.
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          this.onloadend?.();
        })
        .catch((err) => this.onerror?.(err));
    }
  };
}

const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const publicDir = path.join(repoRoot, "public");
const TEMPLATE_TOKEN = "${CLOUDFRONT_DOMAIN}";

// Vite serves public/ at the site root, so the local file for a resolved URL
// http://localhost:5173/assets/workspaces/... is public/assets/workspaces/...
// — read LOCAL_ASSET_BASE_URL's own pathname rather than hardcoding "/assets"
// so this stays correct if .env.local changes the base.
function readLocalAssetBasePathname() {
  const envPath = fs.existsSync(path.join(repoRoot, ".env.local"))
    ? path.join(repoRoot, ".env.local")
    : path.join(repoRoot, ".env.local.example");
  const envText = fs.readFileSync(envPath, "utf-8");
  const match = envText.match(/^LOCAL_ASSET_BASE_URL=(.+)$/m);
  if (!match) {
    throw new Error(`LOCAL_ASSET_BASE_URL not found in ${envPath}`);
  }
  return new URL(match[1].trim()).pathname; // e.g. "/assets"
}

const localAssetBasePathname = readLocalAssetBasePathname();

function localPathFromTemplatedUrl(templatedUrl) {
  if (!templatedUrl.startsWith(TEMPLATE_TOKEN)) {
    throw new Error(`Unexpected URL shape (no ${TEMPLATE_TOKEN} prefix): ${templatedUrl}`);
  }
  const relative = templatedUrl.slice(TEMPLATE_TOKEN.length); // e.g. /workspaces/.../model.glb
  return path.join(publicDir, localAssetBasePathname, relative);
}

// --- tiny dependency-free PNG encoder (solid-color placeholder previews) ---
// Manifest fallback_image_url paths end in .webp; browsers sniff image bytes
// by signature rather than trusting the extension, so a real PNG here still
// decodes and renders — avoids hand-rolling a VP8/VP8L encoder for a
// throwaway placeholder. Flagged in report/results.md gotchas.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodeSolidColorPng(width, height, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = pngChunk("IHDR", ihdrData);

  const rowLen = width * 3;
  const raw = Buffer.alloc((rowLen + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowLen + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const idat = pngChunk("IDAT", zlib.deflateSync(raw));
  const iend = pngChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

// --- placeholder GLB geometry per assetTypeKey ---
function buildObjectForAsset(assetId) {
  const group = new THREE.Group();
  const mat = (hex) =>
    new THREE.MeshStandardMaterial({ color: hex, roughness: 0.7, metalness: 0.05 });

  switch (assetId) {
    case "asset-shell-01": {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), mat(0x8a8a8a));
      seat.position.set(0, 0.45, 0);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.08), mat(0x8a8a8a));
      back.position.set(0, 0.75, -0.28);
      back.rotation.x = -0.12;
      group.add(seat, back);
      break;
    }
    case "asset-base-nylon-finish":
    case "asset-base-alloy-finish": {
      const color = assetId.includes("alloy") ? 0xc9ced4 : 0x2b2b2b;
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.3, 0.05, 24),
        mat(color),
      );
      disc.position.set(0, 0.025, 0);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.4, 16), mat(color));
      post.position.set(0, 0.25, 0);
      group.add(disc, post);
      break;
    }
    case "asset-seat-cover-01": {
      const cover = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.03, 0.64), mat(0x9a7b53));
      cover.position.set(0, 0.495, 0);
      group.add(cover);
      break;
    }
    case "asset-headrest-01": {
      // pivot at local origin = bottom-center, so A3 anchor placement
      // (top-of-parent-bbox) puts the headrest's base exactly at the anchor.
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.1), mat(0x7a7a7a));
      headrest.position.set(0, 0.11, 0);
      group.add(headrest);
      break;
    }
    default:
      throw new Error(`No placeholder geometry defined for asset_id: ${assetId}`);
  }
  return group;
}

function exportGLB(object) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(object, (result) => resolve(result), reject, { binary: true });
  });
}

async function main() {
  const manifestPath = path.join(repoRoot, "fixtures", "manifest.sample.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  for (const asset of manifest.assets) {
    const glbPath = localPathFromTemplatedUrl(asset.url);
    const previewPath = localPathFromTemplatedUrl(asset.fallback_image_url);

    fs.mkdirSync(path.dirname(glbPath), { recursive: true });
    fs.mkdirSync(path.dirname(previewPath), { recursive: true });

    const object = buildObjectForAsset(asset.asset_id);
    const glbArrayBuffer = await exportGLB(object);
    fs.writeFileSync(glbPath, Buffer.from(glbArrayBuffer));

    const previewColor = [
      Math.floor(80 + Math.random() * 100),
      Math.floor(80 + Math.random() * 100),
      Math.floor(80 + Math.random() * 100),
    ];
    fs.writeFileSync(previewPath, encodeSolidColorPng(256, 256, previewColor));

    console.log(
      `[gen:glb] ${asset.asset_id} -> ${path.relative(repoRoot, glbPath)} (${glbArrayBuffer.byteLength} bytes) + preview`,
    );
  }

  console.log(`[gen:glb] done — ${manifest.assets.length} assets generated into public/assets/`);
}

main().catch((err) => {
  console.error("[gen:glb] failed:", err);
  process.exit(1);
});
