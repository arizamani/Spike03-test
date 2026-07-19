import * as THREE from "three";
import type { ResolvedStateSample } from "../types/fixtures";
import { applyResolvedState } from "./applyResolvedState";

export interface SwapMemorySample {
  cycle: number;
  label: string;
  jsHeapUsedMB: number | null;
  rendererGeometries: number;
  rendererTextures: number;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
}

// GPU-leak signal for three.js: renderer.info.memory tracks live GPU
// geometry/texture allocations. If dispose() is correct these counts stay
// flat across cycles instead of growing — the actual "no GPU leak" proof
// for G3, more reliable than JS heap size alone.
export async function runSwapLoop(
  renderer: THREE.WebGLRenderer,
  samples: ResolvedStateSample[],
  cycles: number,
  onSample?: (s: SwapMemorySample) => void,
): Promise<SwapMemorySample[]> {
  const results: SwapMemorySample[] = [];
  for (let i = 0; i < cycles; i++) {
    const sample = samples[i % samples.length];
    await applyResolvedState(sample.resolved);

    const mem = (performance as unknown as { memory?: PerformanceMemory }).memory;
    const entry: SwapMemorySample = {
      cycle: i,
      label: sample.label,
      jsHeapUsedMB: mem ? Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 100) / 100 : null,
      rendererGeometries: renderer.info.memory.geometries,
      rendererTextures: renderer.info.memory.textures,
    };
    results.push(entry);
    onSample?.(entry);
  }
  return results;
}
