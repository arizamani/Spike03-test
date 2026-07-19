import * as THREE from "three";
import { payload } from "../manifest/payload";

// Materials are created once per material_id and reused across every
// switch — apply-material never allocates a fresh THREE.Material, so
// there is nothing of this kind to leak across repeated swaps.
const cache = new Map<string, THREE.MeshStandardMaterial>();

export function getMaterial(materialId: string): THREE.MeshStandardMaterial {
  let mat = cache.get(materialId);
  if (!mat) {
    const def = payload.materials.find((m) => m.material_id === materialId);
    if (!def) {
      throw new Error(`unknown material_id (not in payload-slice fixture): ${materialId}`);
    }
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(def.base_color),
      roughness: def.roughness,
      metalness: def.metalness,
    });
    cache.set(materialId, mat);
  }
  return mat;
}

export function isCachedMaterial(mat: THREE.Material): boolean {
  for (const cached of cache.values()) {
    if (cached === mat) return true;
  }
  return false;
}
