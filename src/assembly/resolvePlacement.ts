import type { AssemblyRelationship, Anchor, PlacementPreset } from "../types/fixtures";

export interface ResolvedPlacement {
  relative_position: number[];
  relative_rotation: number[];
  source: "anchor" | "preset";
}

// Resolver order per handoff §5 F-A / P3: anchor (instance_override) wins
// over placement_preset (type default). Coords are fractional bounding-box
// relative_position (18.3 §7.9) — the held AD-006 §20.3 scaled-integer
// encoding is deliberately not depended on. Missing BOTH anchor and preset
// is a validation error, never a silent fallback to some invented position.
export function resolvePlacement(
  rel: AssemblyRelationship,
  anchor: Anchor | undefined,
  preset: PlacementPreset | undefined,
): ResolvedPlacement {
  if (anchor) {
    return { relative_position: anchor.relative_position, relative_rotation: anchor.relative_rotation, source: "anchor" };
  }
  if (preset) {
    return { relative_position: preset.relative_position, relative_rotation: preset.relative_rotation, source: "preset" };
  }
  throw new Error(
    `No anchor and no placement_preset for assembly_relation_id=${rel.assembly_relation_id} — cannot place deterministically`,
  );
}
