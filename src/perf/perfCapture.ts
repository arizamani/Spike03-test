import * as THREE from "three";
import type { ResolvedStateSample } from "../types/fixtures";
import { applyResolvedState } from "../switch/applyResolvedState";
import { sampleFps } from "./fpsSampler";

export interface PerfReport {
  coldTtiMs: number;
  fps: { windowStartMs: number; fps: number; frameCount: number }[];
  sustainedFpsMin: number;
  sustainedFpsAvg: number;
  switchesCompleted: number;
  memory: {
    jsHeapPeakMB: number | null;
    jsHeapSteadyMB: number | null;
    rendererGeometries: number;
    rendererTextures: number;
  };
  device: {
    userAgent: string;
    viewport: { width: number; height: number; devicePixelRatio: number };
    hardwareConcurrency: number | null;
    deviceMemoryGB: number | null;
  };
}

interface PerformanceMemory {
  usedJSHeapSize: number;
}

export function captureDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemoryGB: (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null,
  };
}

// coldTtiMs is supplied by the caller — measured from navigation start
// (performance.now() baseline) to the moment the default assembly is
// mounted and first rendered (main.ts's runA1() completion).
export async function runPerfCapture(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  cyclingSamples: ResolvedStateSample[],
  coldTtiMs: number,
  fpsWindowDurationMs = 5000,
): Promise<PerfReport> {
  let peakHeap = 0;
  let switchesCompleted = 0;
  const perfMemory = () => (performance as unknown as { memory?: PerformanceMemory }).memory;

  // Drive rapid option-change interaction concurrently with FPS sampling —
  // this is the "sustained FPS during rapid switching" scenario, not idle
  // FPS. This loop is genuinely async (asset loads are real fetch/parse
  // work) so it's subject to this harness's background-tab timer
  // throttling too — switchesCompleted reports how many actually completed
  // in wall-clock terms, whatever that number turns out to be.
  let stop = false;
  const switchLoop = (async () => {
    let i = 0;
    while (!stop) {
      await applyResolvedState(cyclingSamples[i % cyclingSamples.length].resolved);
      switchesCompleted++;
      const mem = perfMemory();
      if (mem) peakHeap = Math.max(peakHeap, mem.usedJSHeapSize);
      i++;
      await new Promise((r) => setTimeout(r, 0));
    }
  })();

  const fps = await sampleFps(fpsWindowDurationMs, () => renderer.render(scene, camera));
  stop = true;
  await switchLoop;

  const steadyMem = perfMemory();
  const fpsValues = fps.map((s) => s.fps);
  const sustainedFpsMin = fpsValues.length ? Math.min(...fpsValues) : 0;
  const sustainedFpsAvg = fpsValues.length ? Math.round((fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length) * 10) / 10 : 0;

  return {
    coldTtiMs: Math.round(coldTtiMs),
    fps,
    sustainedFpsMin,
    sustainedFpsAvg,
    switchesCompleted,
    memory: {
      jsHeapPeakMB: peakHeap ? Math.round((peakHeap / (1024 * 1024)) * 100) / 100 : null,
      jsHeapSteadyMB: steadyMem ? Math.round((steadyMem.usedJSHeapSize / (1024 * 1024)) * 100) / 100 : null,
      rendererGeometries: renderer.info.memory.geometries,
      rendererTextures: renderer.info.memory.textures,
    },
    device: captureDeviceInfo(),
  };
}
