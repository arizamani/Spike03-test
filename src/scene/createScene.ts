import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  assemblyRoot: THREE.Group;
  start(): void;
  dispose(): void;
}

export function createScene(canvas: HTMLCanvasElement): SceneHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.01,
    100,
  );
  camera.position.set(2.0, 1.7, 2.6);

  // preserveDrawingBuffer: true so evidence capture (canvas.toDataURL, report/
  // screenshots) can reliably read back the framebuffer — a real product
  // build would drop this for the perf win (SPIKE-03 §8 gotcha).
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.4, -0.6);
  controls.enableDamping = true;
  controls.update();

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  const dir = new THREE.DirectionalLight(0xffffff, 1.8);
  dir.position.set(2, 3, 2);
  scene.add(hemi, dir);

  const grid = new THREE.GridHelper(4, 8, 0x444444, 0x2a2a2a);
  scene.add(grid);

  const assemblyRoot = new THREE.Group();
  assemblyRoot.name = "assembly-root";
  scene.add(assemblyRoot);

  let frameId = 0;
  function tick() {
    controls.update();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(tick);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);

  return {
    scene,
    camera,
    renderer,
    controls,
    assemblyRoot,
    start() {
      tick();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
    },
  };
}
