// SPIKE-03 §8 gotcha: measure SUSTAINED FPS, not peak — thermal throttling
// on real hardware only shows up over time, not in the first second.
//
// This preview browser's tab reports document.hidden === true (an
// automation-pane artifact) and Chrome throttles requestAnimationFrame AND
// setTimeout hard on hidden tabs — measured empirically: a rAF loop and a
// setTimeout(fn, 0) loop both dropped to single-digit callbacks/sec here,
// regardless of app code (confirmed independently: the scene needed a
// forced renderer.render() call for every evidence screenshot in this
// spike because its own rAF tick loop wasn't running). Neither would
// measure engine performance — they'd measure this harness's tab-visibility
// throttling. Each measurement WINDOW below is a tight synchronous loop
// (no scheduler yield inside the window), which bypasses that throttling;
// a brief setTimeout yields only *between* windows so other async work
// (asset loads, switch-loop concurrency) can interleave. Real vsync-gated
// FPS still requires a visible tab / real device — see report/a4 notes.
export interface FpsWindowSample {
  windowStartMs: number;
  fps: number;
  frameCount: number;
}

export function sampleFps(durationMs: number, renderTick: () => void, windowMs = 500): Promise<FpsWindowSample[]> {
  return new Promise((resolve) => {
    const samples: FpsWindowSample[] = [];
    const overallStart = performance.now();

    function runWindow() {
      const windowStart = performance.now();
      let frameCount = 0;
      while (performance.now() - windowStart < windowMs) {
        renderTick();
        frameCount++;
      }
      const now = performance.now();
      samples.push({
        windowStartMs: Math.round(windowStart - overallStart),
        fps: Math.round(((frameCount * 1000) / (now - windowStart)) * 10) / 10,
        frameCount,
      });
      if (now - overallStart < durationMs) {
        setTimeout(runWindow, 0);
      } else {
        resolve(samples);
      }
    }
    runWindow();
  });
}
