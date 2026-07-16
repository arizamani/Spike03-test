import { createScene } from "./scene/createScene";
import { mountPanelStub } from "./panel/panelStub";

const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;
const panelContainer = document.getElementById("panel") as HTMLElement;

const sceneHandle = createScene(canvas);
sceneHandle.start();

const panel = mountPanelStub(panelContainer, (sample) => {
  console.log("[panel] emitted resolved-state sample:", sample.label, sample.resolved);
  panel.setStatus(`Selected: ${sample.label}\n(P0 stub — no apply logic yet)`);
});
