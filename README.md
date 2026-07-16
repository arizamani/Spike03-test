# configurator-spike-03

Throwaway spike proving the **3D runtime engine**: load a published multi-part GLB assembly, switch
materials/assets/visibility live as options change, place assemblies from anchor/preset data, hold up on
mid-range mobile, and fall back gracefully when WebGL is unavailable. The make-or-break output is an
**engine decision** (Three.js confirmed, or a named alternative) backed by evidence.

Source of truth: `handoff/SPIKE-03_execution-handoff_2026-07-12.md` (+ the companion prompts file) — both
gitignored, reference-only, never edited by the harness. Generated evidence lands in `report/` (gitignored).

## Consistency with SPIKE-04 and SPIKE-05 (read this first)
This spike does **not** import SPIKE-04/05 code. It consumes their contracts as tracked fixtures:
- `fixtures/manifest.sample.json` — asset seam, shape copied from SPIKE-04's produced manifest
  (`mount` = orientation + declaredSides + assetTypeKey only; anchors are payload-side, per AD-007a §12).
- `fixtures/resolved-state.samples.json` — the exact object SPIKE-05's evaluator returns
  (`visual_state`/`visibility_state`/`asset_state`/`assembly_plan`). The panel emits it; the renderer applies it.
- `fixtures/payload-slice.sample.json` — the runtime-payload side: node→asset/material map + assembly
  relationships + anchors/presets (placement geometry, fractional coords per 18.3 §7.9).

If a fixture looks wrong, **stop and flag** — do not redesign the shape.

## Running the harness
1. Copy `.env.local.example` → `.env.local` (no credentials needed).
2. `npm install`
3. `npm run gen:glb` to emit placeholder GLBs (P0), then `npm run dev`.
4. Run experiments in order (A1→A2→A3→A4→A5→B), one at a time, per the prompts file. Evidence → `report/`.
5. `report/results.md` (from `report/results-template.md`) holds the pass/fail summary + engine recommendation.

## Ownership
Poorya runs it (front-end execution). The **CTO** makes the final engine lock. Results go to the CTO, who
forwards a proposal to Maziyar to apply to `18 §26 #5`. Nobody here edits ClickUp.
