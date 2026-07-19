import { resolvePlacement } from "./resolvePlacement";
import type { AssemblyRelationship, Anchor, PlacementPreset } from "../types/fixtures";

// Synthetic (not fixture) inputs — resolvePlacement is a pure function, so
// this exercises the resolver's 3 required cases (handoff P3 TESTING)
// without ever touching the tracked fixtures.
const rel: AssemblyRelationship = {
  assembly_relation_id: "self-test-rel",
  parent_visual_node_id: "node-x",
  child_visual_node_id: "node-y",
  relationship_type: "attached",
  anchor_id: "anc-x",
  placement_preset_id: "place-x",
  required: false,
  customer_controls: { can_move: false, can_rotate: false, can_remove: true },
};
const anchor: Anchor = {
  anchor_id: "anc-x",
  scope: "instance_override",
  visual_node_id: "node-x",
  declared_side: "top",
  relative_position: [0.1, 0.2, 0.3],
  relative_rotation: [0, 0, 0],
  snap: true,
  movement_lock: true,
};
const preset: PlacementPreset = {
  placement_preset_id: "place-x",
  label: "self-test preset",
  relative_position: [0.9, 0.8, 0.7],
  relative_rotation: [0, 0, 0],
  allowed_parent_types: ["chair"],
};

export function runResolvePlacementSelfTest(): void {
  const results: { case: string; pass: boolean; detail: string }[] = [];

  try {
    const r = resolvePlacement(rel, anchor, preset);
    results.push({
      case: "anchor present (instance_override wins)",
      pass: r.source === "anchor" && r.relative_position === anchor.relative_position,
      detail: JSON.stringify(r),
    });
  } catch (err) {
    results.push({ case: "anchor present", pass: false, detail: String(err) });
  }

  try {
    const r = resolvePlacement(rel, undefined, preset);
    results.push({
      case: "anchor removed -> falls back to placement_preset",
      pass: r.source === "preset" && r.relative_position === preset.relative_position,
      detail: JSON.stringify(r),
    });
  } catch (err) {
    results.push({ case: "anchor removed -> preset fallback", pass: false, detail: String(err) });
  }

  try {
    resolvePlacement(rel, undefined, undefined);
    results.push({ case: "both missing -> should throw", pass: false, detail: "did not throw" });
  } catch (err) {
    results.push({ case: "both missing -> should throw", pass: true, detail: String(err) });
  }

  console.table(results);
  (window as unknown as { __spike03PlacementSelfTest: unknown }).__spike03PlacementSelfTest = results;
}
