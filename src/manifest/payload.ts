import payloadJson from "../../fixtures/payload-slice.sample.json";
import resolvedStateJson from "../../fixtures/resolved-state.samples.json";
import type {
  PayloadSlice,
  ResolvedStateFixture,
  VisualNode,
  AssemblyRelationship,
  Anchor,
  PlacementPreset,
} from "../types/fixtures";

// Consumed as-is per handoff §5 F-A / F-B — never rewritten by the harness.
export const payload = payloadJson as PayloadSlice;
export const resolvedStateFixture = resolvedStateJson as ResolvedStateFixture;

const nodeById = new Map<string, VisualNode>(
  payload.visual_nodes.map((n) => [n.visual_node_id, n]),
);
const relationshipById = new Map<string, AssemblyRelationship>(
  payload.assembly_relationships.map((r) => [r.assembly_relation_id, r]),
);
const anchorById = new Map<string, Anchor>(
  payload.anchors.map((a) => [a.anchor_id, a]),
);
const presetById = new Map<string, PlacementPreset>(
  payload.placement_presets.map((p) => [p.placement_preset_id, p]),
);

export function getVisualNode(id: string): VisualNode | undefined {
  return nodeById.get(id);
}
export function getAssemblyRelationship(id: string): AssemblyRelationship | undefined {
  return relationshipById.get(id);
}
export function getAnchor(id: string | null): Anchor | undefined {
  return id ? anchorById.get(id) : undefined;
}
export function getPlacementPreset(id: string | null): PlacementPreset | undefined {
  return id ? presetById.get(id) : undefined;
}
