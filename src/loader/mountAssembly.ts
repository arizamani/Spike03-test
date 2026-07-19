import * as THREE from "three";
import { manifest } from "../manifest/manifest";
import { payload } from "../manifest/payload";
import { loadManifestAsset } from "./loadAsset";
import { createErrorPlaceholder } from "./errorPlaceholder";
import { ensureNode } from "../scene/nodeRegistry";

export interface LoadLogEntry {
  assetId: string;
  visualNodeId: string;
  ok: boolean;
  loadMs: number;
  error?: string;
}

// node-headrest is an optional accessory (assembly_relationships
// required:false) — it is not part of the default assembly; A3 attaches
// it only when a resolved-state entry's assembly_plan includes it.
const DEFAULT_VISIBLE_NODES = ["node-shell", "node-base", "node-seat-cover"];

// A1: mount every default-visible node's default_asset_id at correct
// orientation/scale. mount.orientation.confirmed=true (18 §13.5) means the
// asset's authored transform is trusted as-is — no correction applied here.
export async function mountDefaultAssembly(assemblyRoot: THREE.Object3D): Promise<LoadLogEntry[]> {
  const log: LoadLogEntry[] = [];
  for (const nodeId of DEFAULT_VISIBLE_NODES) {
    const visualNode = payload.visual_nodes.find((n) => n.visual_node_id === nodeId);
    if (!visualNode) continue;
    const node = ensureNode(nodeId, assemblyRoot);
    const result = await loadManifestAsset(visualNode.default_asset_id);
    if (result.ok && result.object3D) {
      node.group.add(result.object3D);
      node.currentAssetId = visualNode.default_asset_id;
    } else {
      node.group.add(createErrorPlaceholder(visualNode.default_asset_id));
      console.warn(`[A1] load failed for ${visualNode.default_asset_id}:`, result.error);
    }
    log.push({
      assetId: visualNode.default_asset_id,
      visualNodeId: nodeId,
      ok: result.ok,
      loadMs: result.loadMs,
      error: result.error,
    });
  }
  return log;
}

// A1 acceptance requires proving ALL 5 manifest assets load + render — two
// of them (asset-base-alloy-finish, asset-headrest-01) are not in the
// default assembly (alternate finish / optional accessory), so they're
// shown in a side-by-side gallery row rather than the default composition.
export async function mountLoaderGallery(root: THREE.Object3D): Promise<LoadLogEntry[]> {
  const log: LoadLogEntry[] = [];
  const gallery = new THREE.Group();
  gallery.name = "loader-gallery";
  gallery.position.set(0, 0, -1.6);
  root.add(gallery);

  let i = 0;
  for (const asset of manifest.assets) {
    const result = await loadManifestAsset(asset.asset_id);
    const holder = new THREE.Group();
    holder.name = `gallery:${asset.asset_id}`;
    holder.position.set((i - 2) * 0.55, 0, 0);
    if (result.ok && result.object3D) {
      holder.add(result.object3D);
    } else {
      holder.add(createErrorPlaceholder(asset.asset_id));
      console.warn(`[A1 gallery] load failed for ${asset.asset_id}:`, result.error);
    }
    gallery.add(holder);
    log.push({
      assetId: asset.asset_id,
      visualNodeId: "(gallery)",
      ok: result.ok,
      loadMs: result.loadMs,
      error: result.error,
    });
    i++;
  }
  return log;
}
