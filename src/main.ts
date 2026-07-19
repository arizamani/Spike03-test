import { createScene } from "./scene/createScene";
import { mountPanelStub } from "./panel/panelStub";
import { mountDefaultAssembly, mountLoaderGallery } from "./loader/mountAssembly";
import { loadManifestAsset } from "./loader/loadAsset";
import { applyResolvedState } from "./switch/applyResolvedState";
import { runSwapLoop } from "./switch/swapLoopHarness";
import { resolvedStateFixture } from "./manifest/payload";
import { runResolvePlacementSelfTest } from "./assembly/resolvePlacementSelfTest";
import { isWebGLAvailable } from "./fallback/detectWebgl";
import { renderFallback } from "./fallback/renderFallback";
import { emitOnce } from "./fallback/analyticsStub";

const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;
const panelContainer = document.getElementById("panel") as HTMLElement;
const fallbackContainer = document.getElementById("fallback") as HTMLElement;

// ?forceNoWebgl=1 forces the fallback path for testing/QA without needing
// to physically disable WebGL in the browser (handoff P5 TESTING).
const forcedNoWebgl = new URLSearchParams(location.search).has("forceNoWebgl");

function enterFallback(reason: string): void {
  canvas.style.display = "none";
  panelContainer.style.display = "none";
  renderFallback(fallbackContainer);
  emitOnce("webgl_unsupported", { reason, userAgent: navigator.userAgent, at: location.href });
}

if (forcedNoWebgl || !isWebGLAvailable()) {
  enterFallback(forcedNoWebgl ? "forced-for-testing" : "no-webgl-context");
} else {
  runMainExperience();
}

function runMainExperience(): void {
  const sceneHandle = createScene(canvas);
  sceneHandle.start();
  (window as unknown as { __spike03Scene: unknown }).__spike03Scene = sceneHandle;

  // A5 TESTING: "context-lost mid-session" — WebGL can die after boot too;
  // must degrade to the same fallback, not a frozen/blank canvas.
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      sceneHandle.dispose();
      enterFallback("context-lost");
    },
    false,
  );

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
  runResolvePlacementSelfTest();

  // Debug-only: trigger a real context-lost event from devtools to verify
  // the fallback path without a physical GPU-driver crash.
  (window as unknown as { __spike03LoseContext: () => void }).__spike03LoseContext = () => {
    const ext = sceneHandle.renderer.getContext().getExtension("WEBGL_lose_context");
    ext?.loseContext();
  };
}
