import * as THREE from "three";
import { payload, getAssemblyRelationship, getAnchor, getPlacementPreset } from "../manifest/payload";
import { ensureNode, getNode } from "../scene/nodeRegistry";
import { loadManifestAsset } from "../loader/loadAsset";
import { createErrorPlaceholder } from "../loader/errorPlaceholder";
import { resolvePlacement } from "./resolvePlacement";

export interface AttachResult {
  relationshipId: string;
  ok: boolean;
  detail: string;
}

// A3: for each relationship_id in a resolved entry's assembly_plan, resolve
// it (assembly_relationships -> anchor/preset) and attach the child node to
// the parent at that placement (18.3 §7.8-7.10). Child is reparented under
// the parent's stable group so it follows the parent; position is derived
// from the parent's local bounding box at the resolved fractional coords.
export async function attachAccessory(relationshipId: string): Promise<AttachResult> {
  const rel = getAssemblyRelationship(relationshipId);
  if (!rel) {
    const detail = `assembly_relation_id not found in payload-slice fixture: ${relationshipId}`;
    console.error(`[A3] ${detail}`);
    return { relationshipId, ok: false, detail };
  }

  const parentNode = getNode(rel.parent_visual_node_id);
  if (!parentNode) {
    const detail = `parent visual_node_id not mounted: ${rel.parent_visual_node_id}`;
    console.error(`[A3] ${detail}`);
    return { relationshipId, ok: false, detail };
  }

  let placement;
  try {
    placement = resolvePlacement(rel, getAnchor(rel.anchor_id), getPlacementPreset(rel.placement_preset_id));
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[A3] placement resolution failed:`, detail);
    return { relationshipId, ok: false, detail };
  }

  const childNode = ensureNode(rel.child_visual_node_id, parentNode.group);
  if (!childNode.currentAssetId) {
    const visualNode = payload.visual_nodes.find((n) => n.visual_node_id === rel.child_visual_node_id);
    if (visualNode) {
      const result = await loadManifestAsset(visualNode.default_asset_id);
      if (result.ok && result.object3D) {
        childNode.group.add(result.object3D);
        childNode.currentAssetId = visualNode.default_asset_id;
      } else {
        childNode.group.add(createErrorPlaceholder(visualNode.default_asset_id));
        console.warn(`[A3] child asset load failed for ${visualNode.default_asset_id}:`, result.error);
      }
    }
  }

  // Fractional bounding-box coords (18.3 §7.9) resolved against the
  // parent's own local bounding box — parentNode.group sits at identity
  // transform under assemblyRoot, so world-space Box3 == parent-local here.
  const parentBox = new THREE.Box3().setFromObject(parentNode.group);
  const [fx, fy, fz] = placement.relative_position;
  const [rx, ry, rz] = placement.relative_rotation;
  const targetPosition = new THREE.Vector3(
    THREE.MathUtils.lerp(parentBox.min.x, parentBox.max.x, fx),
    THREE.MathUtils.lerp(parentBox.min.y, parentBox.max.y, fy),
    THREE.MathUtils.lerp(parentBox.min.z, parentBox.max.z, fz),
  );
  childNode.group.position.copy(targetPosition);
  childNode.group.rotation.set(rx, ry, rz);

  // Visual-compare overlay (prompt P3: "overlay/print the expected target")
  // — a marker at the exact resolved coordinate; the attached child's own
  // origin (its base-center pivot, per generate-glb.mjs) should coincide
  // with it exactly.
  const existingMarker = parentNode.group.getObjectByName(`placement-target:${relationshipId}`);
  existingMarker?.removeFromParent();
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffee00, wireframe: true }),
  );
  marker.name = `placement-target:${relationshipId}`;
  marker.position.copy(targetPosition);
  parentNode.group.add(marker);

  const detail = `attached ${rel.child_visual_node_id} to ${rel.parent_visual_node_id} via ${placement.source} at [${placement.relative_position.join(", ")}]`;
  console.log(`[A3] ${detail}`);
  return { relationshipId, ok: true, detail };
}

export async function applyAssemblyPlan(assemblyPlan: string[]): Promise<AttachResult[]> {
  const results: AttachResult[] = [];
  for (const relationshipId of assemblyPlan) {
    results.push(await attachAccessory(relationshipId));
  }
  return results;
}
