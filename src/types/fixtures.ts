// Shapes mirrored from the SPIKE-04 / SPIKE-05 fixtures (fixtures/*.json).
// Mimic the shape only — never import SPIKE-04/05 code (isolated-spike rule).

export interface ManifestAsset {
  asset_id: string;
  asset_version: string;
  role: string;
  url: string;
  fallback_image_url: string;
  validation_status: string;
  mount: {
    orientation: { confirmed: boolean };
    declaredSides: string[];
    assetTypeKey: string;
  };
}

export interface Manifest {
  manifest_version: string;
  workspace_id: string;
  generated_at: string;
  assets: ManifestAsset[];
}

export interface VisualNode {
  visual_node_id: string;
  default_asset_id: string;
  default_material_id: string;
}

export interface MaterialDef {
  material_id: string;
  base_color: string;
  roughness: number;
  metalness: number;
}

export interface AssemblyRelationship {
  assembly_relation_id: string;
  parent_visual_node_id: string;
  child_visual_node_id: string;
  relationship_type: string;
  anchor_id: string | null;
  placement_preset_id: string | null;
  required: boolean;
  customer_controls: { can_move: boolean; can_rotate: boolean; can_remove: boolean };
}

export interface Anchor {
  anchor_id: string;
  scope: string;
  visual_node_id: string;
  declared_side: string;
  relative_position: number[]; // fractional bbox [x, y, z], 18.3 §7.9
  relative_rotation: number[];
  snap: boolean;
  movement_lock: boolean;
}

export interface PlacementPreset {
  placement_preset_id: string;
  label: string;
  relative_position: number[]; // fractional bbox [x, y, z], 18.3 §7.9
  relative_rotation: number[];
  allowed_parent_types: string[];
}

export interface PayloadSlice {
  published: { published_configurator_id: string; published_version_id: string };
  visual_nodes: VisualNode[];
  materials: MaterialDef[];
  assembly_relationships: AssemblyRelationship[];
  anchors: Anchor[];
  placement_presets: PlacementPreset[];
}

export interface ResolvedState {
  status: string;
  selected_option_value_ids: string[];
  required_option_value_ids: string[];
  disabled_option_value_ids: string[];
  violations: unknown[];
  visual_state: { visual_node_id: string; material_id: string }[];
  visibility_state: { visual_node_id: string; visible: boolean }[];
  asset_state: { visual_node_id: string; asset_id: string }[];
  assembly_plan: string[];
}

export interface ResolvedStateSample {
  label: string;
  selection: string[];
  resolved: ResolvedState;
}

export interface ResolvedStateFixture {
  samples: ResolvedStateSample[];
}
