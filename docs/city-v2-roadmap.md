# PhysLib City v2 — Historical roadmap and issue breakdown

**Current roadmap:** [Geneva programme](geneva/README.md). The initial v2 renderer was promoted to production on 24 November 2026; the following records the original implementation plan, not the current release requirements. New geography proceeds through G1–G5 (#59–#63).

This document is the implementation plan for the [City v2 design constitution](city-v2-design.md). **Do not rewrite production C.4 in one pass.** Build and test an opt-in v2 preview while leaving canonical module/Mathlib ingestion and inspection operational.

## Working principles

- Keep plans, decisions, implementation status, and QA evidence in this repository; GitHub issues are the task tracker.
- Limit each change to one deliverable and corresponding tests. Avoid milestone-driven visual rewrites.
- Source graph / classification / geometry / interaction must have explicit ownership and boundaries.
- Commit usable code and/or screenshots after each small milestone; record source revisions and whether visual fixtures are synthetic.
- Existing related issues: declaration coverage #32, graph data contract #4, typed relationships #10, dependency filter #25, navigation #44 and #45, modular assets #46, visual QA/performance #47. Do not duplicate their original scope.

## Ordered implementation phases

### 0. Establish the v2 reference and review fixtures

- Add a dedicated `?visual=v2` route or independent preview entrypoint, **without changing the C.4 default**.
- Pick a fixed real `HamiltonianMechanics` source sample and a separate labeled synthetic fixture sufficient to demonstrate four classes and incomplete data.
- Add reference camera poses (overhead, district and building), screenshots and a repeatable manual QA checklist.
- Exit: v2 can be iterated and compared to C.4 without altering released behaviour.

### 1. Canonical-to-visual City model

- Add pure functions to map source libraries and directory paths to physics boroughs and nested complexes, preserving provenance and unmapped/ambiguous categories.
- Model visual building membership and stable IDs independently from Lean module IDs.
- Four roles: data-structure, relations-instances, interface-definition, lemmas-properties. Record confidence and extracted source evidence. Never classify wholly by name/hash.
- For every uncovered or unclassified source entity, create an explicit construction-site group rather than dropping it.
- Optional monument for `Basic.lean` only where verified as foundational, otherwise absent or explicitly provisional.
- Model a Math station per complex (depending on stated eligibility), with no duplicate Mathlib station node as a literal canonical graph node.
- Exit: deterministic pure tests for membership completeness, no double assignment, provenance, reproducibility, absent declaration coverage, mixed roles and stable IDs.

### 2. One golden-hour retro-futurist district

- Use the HamiltonianMechanics pilot and render a continuous surrounding ground, sunset gradient/sky, atmosphere, coherent materials, and camera framing.
- Four identifiable scalable skyscraper archetypes and an attractive scaffold/crane construction site.
- Buildings are art assets/visual assemblies, **not** direct source `.lean` file meshes. Height varies monotonically with content volume within bounded architectural limits, independent of category.
- One local Math Power Station. Irregular complex footprint, attractive street/plaza arrangement, no overlap.
- Exit: committed screenshots at identical overhead, district and street-level poses; no island in space; categories distinguishable in silhouette; fallback representation works with missing data.

### 3. Three dependency channels

- Aggregate exact module-import edges onto visual-building memberships, with provenance and counts. Later integrate supported declaration edges separately—never recast imports as verified declaration use.
- Two **sky** PhysLib-family networks: uses and used by, visually distinct directional channels, bounded/selected only.
- One **ground** network: local Mathlib dependencies aggregated per complex into its Math Power Station; station drilldown lists exact deduplicated Mathlib targets, supplying PhysLib modules, source links and evidence.
- Mathlib reused by several complexes yields **separate local station summaries**. Shared target remains accurate in the list but is not represented as a shared endpoint in the 3D world.
- Distinguish no recorded edges from proved absence, especially with partial declaration coverage.
- Exit: graph tests for direction, grouping, deduplication, cross-complex reuse and missing data; visual inspection of uncluttered pipes.

### 4. Physics borough geography

- Expand from one pilot to top-level subject areas with explicit Physlib/PhyslibAlpha/QuantumInfo mapping and provenance.
- Compose irregular borough boundaries, roads, rivers/landmarks as artistic scenery, not mathematical edges.
- Provide zoom-dependent grouping / edge bundling and visual LOD for the full set.
- Exit: all source modules mapped or explicitly surfaced as unmapped; no overlap; acceptable interaction latency and render budget compared with C.4.

### 5. Keyboard-first navigation, inspector and launch

- WASD movement; arrow-based camera; shortcuts for search, focus, inspector, map and three pipeline channels; avoid input focus conflicts and preserve accessibility.
- Bound camera distance, elevation and geographic movement.
- Render station and building inspection through existing source inspector with exact source links, provenance and coverage.
- Remove underground *presentation* from v2; keep Mathlib source data and inspector features.
- Exit: keyboard-only scripted user journey; GitHub Pages preview works; build/test/screenshot QA passes; C.4 remains available for rollback.
- Only after explicit review: switch default to v2, consolidate obsolete rendering branches and update documentation.

## First deliverable (minimal vertical slice)

Use **one real HamiltonianMechanics complex** with physically plausible count, classified buildings where direct evidence exists, provisional construction sites for all other material, one station, sky import connections and ground Mathlib conduits. Add a clearly marked **DEMO fixture** if real data cannot yet exhibit all four classes. Do not overpromise current declaration extraction coverage.

## Guardrails

- No mass refactor of `city-scene.js` as a prerequisite for the pilot.
- No full Mathlib underground scene.
- No claim that module imports prove actual declaration-level use.
- No five-category mathematical ontology: construction is a coverage state only.
- No assumption that `Basic.lean` is invariably foundational.
- No extra building types or height-based mathematical prestige ranking.
- No runtime requirement for Lean builds in the ordinary GitHub Pages preview.
- Each issue must identify changed files, tests and exit criteria, and reference this roadmap.
