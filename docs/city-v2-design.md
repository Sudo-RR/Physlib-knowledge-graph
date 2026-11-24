# PhysLib City v2 — Design constitution

Status: approved design direction (24 November 2026). This document specifies the intended City v2 architecture, not features already implemented in C.4.

## Purpose

PhysLib City is a surface-only, navigable **three-dimensional dependency graph presented as a physics metropolis**. Buildings express formalisation content; infrastructure expresses recorded dependencies. The city should be genuinely attractive, with readable aerial geography and graph relationships. The emphasis is **physics** rather than a second, equally prominent Mathlib city.

Visual direction: **golden-hour, retro-futurist, colourful, expressive skyscrapers**. Use continuous surrounding terrain / atmospheric horizon; avoid an isolated floating rectangular island. Architecture, street planning, lighting, materials, colours, public space, and the camera are art-directed, subject to preserving graph truth and navigability. No photorealistic shadows, physics engine, or full interior simulation is required.

### Canonical graph vs visual representation

The current canonical sources remain `graph.json`, `mathlib.json`, and `mathlib-bridge.json`, optionally supplemented by version-matched declaration snapshots. **Do not corrupt or replace the source graph to make the city visually attractive.** Create a separate City view model describing hierarchy, building memberships, aggregated visible edges, and evidence/coverage; keep scene coordinates and materials in the renderer.

Sources:
- [Upstream PhysLib organisational principle #2074](https://github.com/leanprover-community/physlib/issues/2074), a proposal rather than an adopted complete machine-readable ontology.
- [Current module graph contract](graph-data-contract.md).
- [Declaration extraction limitations](declaration-browser-proposal.md).
- [Current city screenshot/visual QA](city-visual-qa.md).

## Hierarchy

0. **Source-library sector → bank.** Geneva-inspired artistic geography: Rive Droite / PhyslibAlpha north of the Rhône; Rive Gauche / Physlib south of the Rhône and on the inner bank of the Arve; Outre-Arve / QuantumInfo south of the Arve. These are stylised city districts, not a geographic reconstruction. Rivers, quays and civic bridges convey no graph edges.
1. **Physics area → borough.** Examples: ClassicalMechanics, QuantumMechanics, Relativity. Subject neighbourhoods are nested within the three source-library sectors; subject colours are consistent across banks. Preserve originating source-library provenance for every entity. Explicit mappings are needed for Mathematics, Units, Meta, QuantumInfo and cross-area content; do not silently infer physics classifications when ambiguous.
2. **Directory / sub-area → district or complex.** E.g., `Physlib/ClassicalMechanics/HamiltonianMechanics`. Nested directories may represent nested complexes; the urban renderer may aggregate/deaggregate by zoom.
3. **Functional declaration group → skyscraper.** Do not equate each `.lean` file with a building. Buildings have stable IDs and retain the exact qualified declaration IDs and source-module IDs they represent. Multiple groups may be placed in the same complex; not all four are required.
4. **Uncovered/unclassified content → construction site.** This is a visual **classification state**, not a fifth mathematical role. It does **not** mean the underlying Lean mathematics is unfinished or incorrect. Construction sites are navigable, selectable, and may have known dependency links.
5. **Foundational monument (optional).** `Basic.lean` can suggest a central foundation landmark, but its filename alone does not prove a foundational role. A landmark is created only when the role is justified, or explicitly marked a provisional decorative interpretation.

## Four architectural roles

The four functions are drawn from upstream issue #2074. The mapping from Lean syntax to these conceptual roles is not automatic or always unambiguous:

| Role ID | Mathematical role | Architectural language |
| --- | --- | --- |
| `data-structure` | Key data structures | Geometric, structural, foundational tower |
| `relations-instances` | Structural relations and instances | Layered/modular/interconnected tower |
| `interface-definition` | Interface definitions | Sleek, precise tower |
| `lemmas-properties` | Lemmas and properties | Articulated tower with distinctive detail |

Every archetype may be tall; no hierarchy of mathematical prestige is implied. **Height/mass reflects amount of source content represented**, using an explicit, tested monotone scale with visual bounds. The four roles select silhouette/style independently of height. Mixed-role or partial-classification groups must not be falsely presented as verified.

## Dependency semantics: three channels, not three individual graph edges

For a selected PhysLib visual building:
- **Uses PhysLib-family entities**: directed prerequisite edges, sky-level pipeline.
- **Used by PhysLib-family entities**: reverse view of recorded edges, distinct sky-level pipeline.
- **Uses Mathlib**: dependencies on Mathlib, **ground-level conduits to the local Math Power Station**.

A logical channel may carry multiple recorded dependencies. There is **at most one category/port per channel per selected building**, but it can fan out, bundle, or open a drilldown. No fabricated dependency edges. Clearly distinguish module **imports** from verified declaration-level **uses**; they are different evidence classes. An import is not evidence that a declaration actually appears in a proof.

World/district views aggregate recorded edges and suppress clutter. Selection exposes a bounded, directional neighbourhood and exact evidence/counts. Source IDs and all original exact edges remain queryable in the inspector.

### Mathlib: local stations, not underground city

- **Exactly one Math Power Station per eligible complex** (every complex can reserve a station site; stations with no recorded dependencies must be labelled or omitted according to an explicit rule).
- A ground-level cyan/teal utility network routes from the complex's relevant buildings to its local station. No Mathlib underground layer, Mathlib surface skyscraper world, or per-Mathlib-module endpoints in the main City.
- The station represents a **local aggregate**, not one unique mathematical node. The same Mathlib module imported from multiple complexes intentionally appears independently in those complexes' station lists; its cross-complex reuse is preserved in data/list view rather than shown as converging graph arrows.
- Selecting the station lists exact recorded Mathlib modules (deduplicated), which PhysLib source modules import them, links to source, and the extraction evidence/coverage. Declaration-specific uses appear only when supported by extracted declaration edges.
- Do not confuse the *one station per complex* rule with *one exact graph edge*: visible conduits are aggregations.

## City and navigation art direction

- Golden-hour amber directional lighting, readable ambient fill, peach/pink horizon, restrained haze, coherent colour/material palette, continuous world backdrop. Avoid purely unlit flat-colour terrain and huge empty space.
- Continuous neutral civic ground with shared streets, paving and landscaping. Stable physics-subject colours belong to building facades and accents, not filled ground parcels. Wide overhead views identify the three banks and rivers; closer views identify subject neighbourhoods. Avoid drawn rectangular subject borders. Architecture role remains encoded by silhouette; street and plot geometry may be irregular but must avoid overlaps and retain usable access corridors.
- Roads and civic architecture are decorative, **not** dependency edges. Elevated sky channels and ground-level Mathlib conduits must remain visually distinct and directionally understandable.
- Keyboard-first exploration: WASD movement; arrows for view direction; focus, inspect, channel toggles, map/overview and escape shortcuts. Mouse for global map selection and optional interaction. Clamp zoom and camera bounds to keep users within meaningful reading scales. Maintain accessible keyboard focus and avoid hijacking typing in inputs.
- At wide zoom, visual grouping and edge bundling are allowed, but the view must state the aggregation level and preserve drilldown.

## Data and honesty invariants

- Canonical source identity and revision remain attached to every building/station/drilldown.
- The declaration dataset is **optional and currently partial**. A partial extractor cannot prove that a declaration or dependency is absent. Do not generate fake `verified` roles or proof links.
- A classified building must record its constituent declaration IDs and provenance; no declaration should silently vanish because it is unknown. A declaration belongs to one primary architectural building (allow cross-references).
- Unknown metadata displays a construction site, with source-module fallback and a clear coverage indicator. Existing files remain navigable.
- Power stations and aggregator edges are marked as *visual aggregates*, never passed off as source declarations.
- C.4 remains the stable default until the v2 preview meets visual, fidelity, performance and navigation acceptance checks.

## Initial pilot and acceptance

Pilot: `Physlib/ClassicalMechanics/HamiltonianMechanics`, with real module IDs and the presently available declaration evidence. It is fine to render **visually representative synthetic examples**, but they must be explicitly marked DEMO and kept distinct from live PhysLib claims. Include the four tower archetypes, construction treatment, one station, ground Math conduits, both sky PhysLib channels, coherent golden-hour terrain, top-down and street-level camera presets, keyboard navigation, and a source inspector.

Acceptance requires: convincing surface metropolis (no floating-board effect), recognizable archetypes without height implying importance, correct directed and typed source-backed relationships or clearly labelled mock links, drilldown with exact Mathlib modules, bounded navigation, and a build that does not regress current C.4 deployment.

See [City v2 roadmap](city-v2-roadmap.md) for incremental implementation and exit criteria.

### Organic neighbourhood generation

Within the three river-defined sectors, use deterministic seeded spatial sampling with minimum plot clearance, then assign contiguous nearby sites to subject clusters. Streets connect nearby plots using a spanning network with short additional loops; quays and bridges connect banks. Do not fill rectangular borough polygons. The fixed seed makes a given source snapshot reproducible; changing it produces an alternative artistic layout. Site locations may change when the source population changes. The current street routing is a first geometric approximation, not a road/parcel collision solver.
