import * as THREE from "three";

// A stable THREE.Group per visual_node_id — the attachment point that A2's
// switch logic mounts/unmounts loaded GLB content under, and A3's assembly
// logic reparents for child->parent attachment.
export interface SceneNode {
  visualNodeId: string;
  group: THREE.Group;
  currentAssetId?: string;
}

const nodes = new Map<string, SceneNode>();

export function ensureNode(visualNodeId: string, parent: THREE.Object3D): SceneNode {
  let node = nodes.get(visualNodeId);
  if (!node) {
    const group = new THREE.Group();
    group.name = visualNodeId;
    parent.add(group);
    node = { visualNodeId, group };
    nodes.set(visualNodeId, node);
  }
  return node;
}

export function getNode(visualNodeId: string): SceneNode | undefined {
  return nodes.get(visualNodeId);
}

export function allNodes(): SceneNode[] {
  return [...nodes.values()];
}
