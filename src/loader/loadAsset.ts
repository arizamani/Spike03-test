import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getManifestAsset } from "../manifest/manifest";
import { resolveAssetUrl } from "../manifest/resolveUrl";

const loader = new GLTFLoader();

export interface LoadResult {
  assetId: string;
  ok: boolean;
  loadMs: number;
  object3D?: THREE.Object3D;
  error?: string;
}

// Loads one manifest asset by asset_id via the P0 URL resolver. Never
// throws — a missing asset_id or a load/parse failure resolves to
// ok:false with a message, so callers can render a visible error instead
// of crashing (handoff §4).
export async function loadManifestAsset(assetId: string): Promise<LoadResult> {
  const start = performance.now();
  const asset = getManifestAsset(assetId);
  if (!asset) {
    return {
      assetId,
      ok: false,
      loadMs: performance.now() - start,
      error: `asset_id not found in manifest: ${assetId}`,
    };
  }
  const url = resolveAssetUrl(asset.url);
  try {
    const gltf = await loader.loadAsync(url);
    return { assetId, ok: true, loadMs: performance.now() - start, object3D: gltf.scene };
  } catch (err) {
    return {
      assetId,
      ok: false,
      loadMs: performance.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
