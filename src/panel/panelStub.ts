import { resolvedStateFixture } from "../manifest/payload";
import type { ResolvedStateSample } from "../types/fixtures";

export interface PanelHandle {
  setStatus(text: string): void;
}

// P0: buttons only — selecting a sample hands its resolved-state object to
// onSelect verbatim (no rule logic here; the panel EMITS, the renderer APPLIES — handoff §5 F-B).
export function mountPanelStub(
  container: HTMLElement,
  onSelect: (sample: ResolvedStateSample) => void,
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

  const status = document.createElement("div");
  status.className = "status";
  container.appendChild(status);

  return {
    setStatus(text: string) {
      status.textContent = text;
    },
  };
}
