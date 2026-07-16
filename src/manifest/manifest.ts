import manifestJson from "../../fixtures/manifest.sample.json";
import type { Manifest, ManifestAsset } from "../types/fixtures";

// Consumed as-is per handoff §5 F-A / F-B — never rewritten by the harness.
export const manifest = manifestJson as Manifest;

const byAssetId = new Map<string, ManifestAsset>(
  manifest.assets.map((asset) => [asset.asset_id, asset]),
);

export function getManifestAsset(assetId: string): ManifestAsset | undefined {
  return byAssetId.get(assetId);
}
