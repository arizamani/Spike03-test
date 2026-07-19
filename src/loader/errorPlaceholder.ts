import * as THREE from "three";

// A visible failure marker — handoff §4: "must fail into a friendly
// fallback, never a blank page." A missing/malformed asset must not crash
// the scene; it renders this instead.
export function createErrorPlaceholder(label: string): THREE.Object3D {
  const group = new THREE.Group();
  group.name = `error:${label}`;
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xff3333, wireframe: true }),
  );
  box.position.y = 0.15;
  group.add(box);
  group.userData.errorLabel = label;
  return group;
}
