import { resolvedStateFixture } from "../manifest/payload";
import type { ResolvedStateSample } from "../types/fixtures";

export interface PanelHandle {
  setStatus(text: string): void;
}

// Buttons hand a resolved-state sample to onSelect verbatim — the panel
// EMITS, the renderer APPLIES (handoff §5 F-B). onRunSwapLoop is optional
// (wired from P2 onward for the A2 no-reload/no-leak harness).
export function mountPanelStub(
  container: HTMLElement,
  onSelect: (sample: ResolvedStateSample) => void,
  onRunSwapLoop?: () => void,
): PanelHandle {
  container.innerHTML = "";

  const heading = document.createElement("h1");
  heading.textContent = "SPIKE-03 — resolved-state samples";
  container.appendChild(heading);

  for (const sample of resolvedStateFixture.samples) {
    const button = document.createElement("button");
    button.textContent = sample.label;
    button.addEventListener("click", () => onSelect(sample));
    container.appendChild(button);
  }

  if (onRunSwapLoop) {
    const runButton = document.createElement("button");
    runButton.textContent = "A2: run 60-cycle swap loop";
    runButton.addEventListener("click", onRunSwapLoop);
    container.appendChild(runButton);
  }

  const status = document.createElement("div");
  status.className = "status";
  container.appendChild(status);

  return {
    setStatus(text: string) {
      status.textContent = text;
    },
  };
}
