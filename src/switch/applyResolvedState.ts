import * as THREE from "three";
import type { ResolvedState } from "../types/fixtures";
import { getNode } from "../scene/nodeRegistry";
import { getMaterial, isCachedMaterial } from "./materialCache";
import { disposeMaterial, disposeObject3D } from "./dispose";
import { loadManifestAsset } from "../loader/loadAsset";
import { createErrorPlaceholder } from "../loader/errorPlaceholder";
import { applyAssemblyPlan } from "../assembly/attachAccessory";

// visual_node_id is looked up via getNode (never ensureNode) — an unknown
// or not-yet-mounted node_id is a no-op + warning, never a fabricated node
// (handoff P2 TESTING).
function applyMaterial(visualNodeId: string, materialId: string): void {
  const node = getNode(visualNodeId);
  if (!node) {
    console.warn(`[A2 apply-material] unknown/unmounted visual_node_id: ${visualNodeId} (no-op)`);
    return;
  }
  const material = getMaterial(materialId);
  node.group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const current = mesh.material as THREE.Material;
    if (current && current !== material && !isCachedMaterial(current)) {
      disposeMaterial(current);
    }
    mesh.material = material;
  });
}

function applyVisibility(visualNodeId: string, visible: boolean): void {
  const node = getNode(visualNodeId);
  if (!node) {
    console.warn(`[A2 show/hide] unknown/unmounted visual_node_id: ${visualNodeId} (no-op)`);
    return;
  }
  node.group.visible = visible;
}

async function applyAssetSwitch(visualNodeId: string, assetId: string): Promise<void> {
  const node = getNode(visualNodeId);
  if (!node) {
    console.warn(`[A2 switch-asset] unknown/unmounted visual_node_id: ${visualNodeId} (no-op)`);
    return;
  }
  if (node.currentAssetId === assetId) return; // no-op, nothing to swap

  const result = await loadManifestAsset(assetId);
  const old = [...node.group.children];

  if (result.ok && result.object3D) {
    node.group.add(result.object3D);
    node.currentAssetId = assetId;
  } else {
    node.group.add(createErrorPlaceholder(assetId));
    node.currentAssetId = undefined;
    console.warn(`[A2 switch-asset] load failed for ${assetId}:`, result.error);
  }

  // Dispose the replaced content only after the new content is mounted —
  // geometry + any non-cached (freshly-loaded) materials/textures.
  for (const child of old) {
    node.group.remove(child);
    disposeObject3D(child, isCachedMaterial);
  }
}

// Order matters: asset switches first (mounts new geometry on existing
// nodes), then assembly_plan (attaches/mounts any accessory nodes, e.g.
// node-headrest, that visual_state/visibility_state below may target),
// then material (paints whatever geometry is now current), then visibility.
export async function applyResolvedState(resolved: ResolvedState): Promise<void> {
  for (const entry of resolved.asset_state) {
    await applyAssetSwitch(entry.visual_node_id, entry.asset_id);
  }
  if (resolved.assembly_plan.length > 0) {
    await applyAssemblyPlan(resolved.assembly_plan);
  }
  for (const entry of resolved.visual_state) {
    applyMaterial(entry.visual_node_id, entry.material_id);
  }
  for (const entry of resolved.visibility_state) {
    applyVisibility(entry.visual_node_id, entry.visible);
  }
}
