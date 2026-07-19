import { createScene } from "./scene/createScene";
import { mountPanelStub } from "./panel/panelStub";
import { mountDefaultAssembly, mountLoaderGallery } from "./loader/mountAssembly";
import { loadManifestAsset } from "./loader/loadAsset";
import { applyResolvedState } from "./switch/applyResolvedState";
import { runSwapLoop } from "./switch/swapLoopHarness";
import { resolvedStateFixture } from "./manifest/payload";

const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;
const panelContainer = document.getElementById("panel") as HTMLElement;

const sceneHandle = createScene(canvas);
sceneHandle.start();
(window as unknown as { __spike03Scene: unknown }).__spike03Scene = sceneHandle;

let panel: ReturnType<typeof mountPanelStub>;

async function runA1(): Promise<void> {
  panel.setStatus("A1: loading default assembly + gallery…");
  const assemblyLog = await mountDefaultAssembly(sceneHandle.assemblyRoot);
  const galleryLog = await mountLoaderGallery(sceneHandle.assemblyRoot);

  // Missing-asset smoke test (handoff P1 TESTING: "one missing url ->
  // visible error, not a crash"). asset_id isn't in the manifest fixture,
  // which we never rewrite — this proves the not-found path is graceful.
  const missing = await loadManifestAsset("asset-does-not-exist-99");

  const fullLog = [...assemblyLog, ...galleryLog, { ...missing, visualNodeId: "(missing-asset smoke test)" }];
  console.table(fullLog.map(({ assetId, visualNodeId, ok, loadMs, error }) => ({
    assetId,
    visualNodeId,
    ok,
    loadMs: Math.round(loadMs * 100) / 100,
    error: error ?? "",
  })));

  const failCount = fullLog.filter((e) => !e.ok).length;
  panel.setStatus(
    `A1 load complete: ${fullLog.length} attempts, ${failCount} failed (see console.table)`,
  );
  // Debug-only introspection hook for evidence capture (report/), not
  // a runtime API.
  (window as unknown as { __spike03LoadLog: unknown }).__spike03LoadLog = fullLog;
}

async function runA2SwapLoop(): Promise<void> {
  // baseline + alloy samples exercise apply-material, switch-asset (node-base
  // nylon<->alloy) and show/hide (node-seat-cover) without touching
  // node-headrest, which isn't mounted until A3 attaches it.
  const cyclingSamples = resolvedStateFixture.samples.slice(0, 2);
  panel.setStatus("A2: running 60-cycle swap loop…");
  const results = await runSwapLoop(sceneHandle.renderer, cyclingSamples, 60);
  const first = results[0];
  const last = results[results.length - 1];
  console.table(results.filter((_, i) => i % 10 === 0 || i === results.length - 1));
  panel.setStatus(
    `A2 swap loop done (N=60).\n` +
      `geometries ${first.rendererGeometries} -> ${last.rendererGeometries}\n` +
      `textures ${first.rendererTextures} -> ${last.rendererTextures}\n` +
      `jsHeapMB ${first.jsHeapUsedMB ?? "n/a"} -> ${last.jsHeapUsedMB ?? "n/a"}`,
  );
  (window as unknown as { __spike03SwapLoop: unknown }).__spike03SwapLoop = results;
}

panel = mountPanelStub(
  panelContainer,
  async (sample) => {
    console.log("[panel] emitted resolved-state sample:", sample.label, sample.resolved);
    panel.setStatus(`Applying: ${sample.label}…`);
    await applyResolvedState(sample.resolved);
    panel.setStatus(`Applied: ${sample.label}`);
  },
  runA2SwapLoop,
);

runA1();
