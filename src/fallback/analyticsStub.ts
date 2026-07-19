// Local analytics stub only (18 §17.2 real ingestion is explicitly out of
// scope for this spike — handoff P5). Tracks emitted-once-per-name events
// so the "webgl_unsupported emitted exactly once" acceptance criterion is
// directly inspectable from report/ evidence capture.
export interface AnalyticsEvent {
  name: string;
  props: Record<string, unknown>;
  timestamp: number;
}

const emitted: AnalyticsEvent[] = [];
const emittedNames = new Set<string>();

export function emitOnce(name: string, props: Record<string, unknown>): void {
  if (emittedNames.has(name)) {
    console.warn(`[analytics-stub] ${name} already emitted this session — suppressing duplicate`);
    return;
  }
  emittedNames.add(name);
  const event: AnalyticsEvent = { name, props, timestamp: Date.now() };
  emitted.push(event);
  console.log(`[analytics-stub] emitted:`, event);
  // Debug-only introspection hook for evidence capture (report/), not a
  // runtime API.
  (window as unknown as { __spike03AnalyticsEvents: AnalyticsEvent[] }).__spike03AnalyticsEvents = emitted;
}

export function getEmittedEvents(): AnalyticsEvent[] {
  return emitted;
}
