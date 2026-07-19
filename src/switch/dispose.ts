import * as THREE from "three";

const TEXTURE_SLOTS = ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"] as const;

function disposeTextures(mat: THREE.Material): void {
  for (const slot of TEXTURE_SLOTS) {
    const tex = (mat as unknown as Record<string, THREE.Texture | undefined>)[slot];
    tex?.dispose();
  }
}

// Disposes a non-cached material's textures + itself. Never call this on a
// materialCache instance — those are reused for the lifetime of the app.
export function disposeMaterial(mat: THREE.Material): void {
  disposeTextures(mat);
  mat.dispose();
}

// Fully disposes a subtree being removed for good (an old asset's GLB
// content after a switch-asset swap) — geometry, and any non-cached
// materials/textures found on it. handoff SPIKE-03 §8: explicit dispose of
// replaced geometries/materials/textures, no full reload, no GPU leak.
export function disposeObject3D(root: THREE.Object3D, isCached: (m: THREE.Material) => boolean): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) {
      if (!mat || isCached(mat)) continue;
      disposeMaterial(mat);
    }
  });
}
