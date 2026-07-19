import { createScene } from "./scene/createScene";
import { mountPanelStub } from "./panel/panelStub";
import { mountDefaultAssembly, mountLoaderGallery } from "./loader/mountAssembly";
import { loadManifestAsset } from "./loader/loadAsset";

const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;
const panelContainer = document.getElementById("panel") as HTMLElement;

const sceneHandle = createScene(canvas);
sceneHandle.start();
(window as unknown as { __spike03Scene: unknown }).__spike03Scene = sceneHandle;

const panel = mountPanelStub(panelContainer, (sample) => {
  console.log("[panel] emitted resolved-state sample:", sample.label, sample.resolved);
  panel.setStatus(`Selected: ${sample.label}\n(P0 stub — no apply logic yet)`);
});

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

runA1();
