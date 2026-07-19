// SPIKE-03 A4: measure-only — shipped bundle size + GLB payload weight
// (18 §4 #7 "fast runtime"). Run after `npm run build`. Prints JSON to
// stdout; the caller (or a shell redirect) persists it into report/.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const publicAssetsDir = path.join(repoRoot, "public", "assets");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function sizeReport(files, repoRelativeRoot) {
  return files.map((f) => {
    const raw = fs.readFileSync(f);
    return {
      file: path.relative(repoRelativeRoot, f),
      rawBytes: raw.length,
      gzipBytes: zlib.gzipSync(raw).length,
    };
  });
}

const jsCssFiles = walk(path.join(distDir, "assets")).filter((f) => /\.(js|css)$/.test(f));
const bundleReport = sizeReport(jsCssFiles, distDir);
const bundleRawTotal = bundleReport.reduce((a, b) => a + b.rawBytes, 0);
const bundleGzipTotal = bundleReport.reduce((a, b) => a + b.gzipBytes, 0);

const glbFiles = walk(publicAssetsDir).filter((f) => f.endsWith(".glb"));
const glbReport = sizeReport(glbFiles, publicAssetsDir);
const glbRawTotal = glbReport.reduce((a, b) => a + b.rawBytes, 0);

const report = {
  bundle: { files: bundleReport, rawTotalBytes: bundleRawTotal, gzipTotalBytes: bundleGzipTotal },
  glbPayload: { files: glbReport, rawTotalBytes: glbRawTotal, note: "GLBs are not gzip-compressed over the wire in practice (binary, already dense); raw size is the relevant number." },
  totalInitialTransferBytesEstimate: bundleGzipTotal + glbRawTotal,
};

console.log(JSON.stringify(report, null, 2));
