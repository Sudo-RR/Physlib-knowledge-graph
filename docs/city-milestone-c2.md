# Milestone C.2 — Chromatic boroughs

Implemented C.2a–C.2d against the existing C.1 working tree. **Opt-in only:** open `?visual=c2`; `?visual=c1` remains the comparison and the default Milestone C surface is unchanged. Visual approval is pending. No Milestone D work, Mathlib rebuild, PaperView ingestion or invented dependency edges was undertaken.

## C.2a: persistent colour addresses

[`site/city-colors.js`](../site/city-colors.js) is the version-1 persisted registry: 39 actual first-level directories and three explicitly synthetic Root Modules territories. Physlib, PhyslibAlpha and QuantumInfo retain separate borough families. Nested directories inherit bounded tints; module roofs, selected borders, source breadcrumbs, search results and the geographic map use their actual directory address. Colour describes geography, never mathematical importance or formalisation status.

Existing colours never change when a new key appears. `node scripts/sync-city-colors.mjs` inventories missing addresses; `--write` explicitly persists new adjacency-aware palette choices. Current inventory has no missing keys. New choices maximise minimum OKLab distance from neighbouring districts. Tests require adjacent colour distance of at least .075 or a different landmark pattern signature, and label contrast of at least 4.5:1. This is a practical heuristic, not a certified colour-vision accessibility assessment. Directory names and civic shapes provide redundant cues.

## C.2b: two rendered alternatives

Both alternatives were rendered in the actual Three.js application, using matching cameras, viewport and quality settings. These are pre-refinement concept captures, not generated illustrations.

| Alternative | World | Units | Classical Mechanics |
| --- | --- | --- | --- |
| A: vivid territories, curved civic grammar | [image](screenshots/milestone-c2/concept-a-world.png) | [image](screenshots/milestone-c2/concept-a-units.png) | [image](screenshots/milestone-c2/concept-a-mechanics.png) |
| B: porcelain institutes, quieter fields | [image](screenshots/milestone-c2/concept-b-world.png) | [image](screenshots/milestone-c2/concept-b-units.png) | [image](screenshots/milestone-c2/concept-b-mechanics.png) |

An independent manual design critique preferred A: world and district colour 4/5 versus B's 3/5; geography 4/5 for both; architecture 3/5 and landmark legibility 2/5 for both. It found recognisable fields within Physlib, but weak civic silhouettes. One bounded correction batch widened landmarks, improved focused directory labels, unified park green, removed paving seams and tightened the world camera. A remains the chosen opt-in composition; B is available through `composition=porcelain`.

Used the installed Impeccable colour/craft and design-review playbooks. Its previously documented unavailable engine was not repeatedly retried or installed. These are manual playbook checks, not claimed automated Impeccable detector results. Human artistic approval remains required.

## C.2c: composition and implementation

District-wide coloured wedge-inspired parcels replace roof-only colour. Civic motifs vary with actual district size: small squares, crescent courts, terraces and promenades. These are presentation motifs, not new repository categories. Four shared civic landmark classes identify directory territories without becoming modules: portico, observatory, fin array and orbital gate. Shared instanced components, medium-distance shells and existing screen-space LOD preserve bounded rendering cost. Low still reduces near architectural geometry, as verified by tests.

Civic forecourts are reserved before packing, with wider conservative rotated decorative bounds and inspection clearance. Districts expand instead of shrinking their buildings. Source-derived raw heights, footprints and floor ranges remain metadata; C.1's logarithmic display-height formula is retained. Streets, bridges and service reservations precede greenery. Selected skywalks use recorded imports only; routes clear civic obstructions, docks inherit address colour, and their sampled collision boxes join the camera grid. Civic crossings are infrastructure rather than dependency edges. No illuminated ground circles are introduced.

The audit records **42 landmarks, 112 trees, 155 parks, 247 courts and 2,350 connected street segments**, one connected street component, minimum tested clearance **12.02 units**, and no reported spatial errors. A memory-only appended Units file moved **0 of 1,579 existing surface modules**. See [layout audit](screenshots/milestone-c2/layout-audit.json) and [infrastructure export](screenshots/milestone-c2/infrastructure.json).

Explore mode hides technical panels while retaining Files and Inspector drawers, search, selection, history and an always-visible exit. The standard source browser remains available. No UI framework replacement was made.

### Files changed for C.2

- New: `site/city-colors.js`, `site/city-chromatic-layout.js`, `site/city-chromatic-art.js`, `test/city-chromatic.test.mjs`.
- Extended: `site/city-borough-layout.js`, `site/city-atomic-art.js`, `site/city-rivers.js`, `site/city-scene.js`, `site/city-skywalks.js`, `site/city-geography-map.js`, `site/city.js`, `site/city.css`, `site/index.html`.
- Evidence/tools: `scripts/sync-city-colors.mjs`, `scripts/audit-city-c2.mjs`, `scripts/report-city-c2.mjs`, `scripts/capture-plan-city-c2.mjs`, this report and `docs/screenshots/milestone-c2/`.
- Context/provenance: `README.md`, `THIRD_PARTY_ASSETS.md`, `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`.

Pre-existing uncommitted C.1 files and artifacts were preserved. No new external models, textures or fonts were imported. The new civic/terrain geometry and colour materials are original repository code. Existing Kenney assets remain under their documented CC0 licence and existing provenance limitations; see [asset ledger](../THIRD_PARTY_ASSETS.md).

## C.2d: validation

**91/91 tests pass**, with no skipped tests. [Full output](screenshots/milestone-c2/final-tests.txt). Data validation, asset validation, city bundling and static-site packaging pass. Packaging needed the existing elevated packaging permission after Windows denied removing the old disposable staging directory. `git diff --check` passes.

Six C.2 tests cover registry stability/contrast and adjacency cues; exact source identities and anchors; both compositions' architectural and civic geometry bounds; dense, irregular, deep, missing-root and extreme-height fixtures; actual Low geometry reduction and disposal; and sampled real dependency skywalk clearance/dock colours. Existing cache, model-loading, navigation, fallback and graph tests remain passing.

Browser checks confirmed the exact `Physlib.Units.ISQDimensionBase` deep link, Floor 2 source lines 52–102, pinned GitHub source links, Mathlib.Data.Fintype.Card navigation and previous-selection return, Explore Inspector, Explore file search to QuantumInfo.States.Pure.Qubit, and return to technical mode. The mini-map reports Units colour `#efbc29`, matching its registry and inspector address. At a 640×900 viewport the document width was 625, with no horizontal page overflow.

The packaged site was served from `/qa-c2/` to check relative paths. Temporarily removing only its copied optional Kenney kit produced **“Modular kit unavailable · procedural Units retained · source inspection available.”** C.2 rendered and its exact source floor worked without that kit. C.2's original geometry does not require the GLB; this is not a claim that C.2 itself fetched a missing model. The disposable QA copy was removed afterwards.

All **2,256 IDs and 6,598 recorded edges** remain intact: 669 Physlib, 828 PhyslibAlpha, 82 QuantumInfo and 677 imported Mathlib modules. Source JSON hashes are unchanged and recorded in the audit. The Mathlib underground anchors remain unchanged. No dependency or declaration-use claims were inferred from colour or civic geometry.

## Controlled performance

Three valid 12-second foreground runs per configuration, 27 runs total, using the preserved 20-step camera path. The whole-world C, C.1 and C.2 comparisons use identical absolute path coordinates, viewport 1536×791 and CSS canvas 956×476. Medium physical canvas is 956×476; Low is 717×357; High is 1195×595 (actual pixel ratio 1.25). Explore/cinematic uses a larger 1536×626 canvas and must not be compared as equal pixel workload.

**Renderer: ANGLE / Microsoft Basic Render Driver, D3D11, software WARP. These are not representative hardware-GPU measurements.** No hardware-accelerated result was obtained. Values below are medians of three run statistics; calls and triangles are frame ranges. Raw runs and renderer/foreground details are preserved in [benchmarks.json](screenshots/milestone-c2/benchmarks.json) and its referenced run files.

| Configuration | FPS | P50 / P95 / P99 ms | Calls | Triangles |
| --- | ---: | --- | --- | --- |
| C Medium | 42.6 | 21.9 / 46.9 / 65.2 | 59–70 | 52,232–56,788 |
| C.1 Medium | 36.6 | 26.1 / 34.2 / 49.4 | 58–69 | 67,112–79,416 |
| C.2 Medium | 38.3 | 25.1 / 33.1 / 37.5 | 25 | 58,554–67,250 |
| C.2 Low | 46.8 | 20.0 / 28.8 / 35.7 | 25 | 58,554–67,250 |
| C.2 High | 31.8 | 30.4 / 39.2 / 49.2 | 25 | 58,554–67,250 |
| C.2 dense Medium | 45.9 | 21.3 / 26.5 / 33.5 | 24–26 | 19,214–21,506 |
| C.2 sparse Medium | 46.5 | 20.6 / 30.0 / 35.0 | 23–30 | 18,974–19,586 |
| C.2 selected orbit Medium | 40.5 | 24.2 / 28.8 / 36.6 | 35–44 | 20,070–22,110 |
| C.2 full-canvas Explore Medium | 28.2 | 34.5 / 43.0 / 52.1 | 25 | 58,602–67,250 |

C.2 Medium passes the specified 90%-of-C.1 gate: **38.3 ≥ 32.94 FPS**, about 4.6% above C.1. It remains about 10% below C. C control runs varied, including a 31.8 FPS outlier, so the small C.2/C.1 advantage should not be overinterpreted. Low is about 22% faster than Medium on this world path; at that scale both already use the same silhouette geometry and resolution drives the improvement. The near-building Low geometry reduction is separately tested.

World renderer geometry/texture counts: C 58/7, C.1 65/4, C.2 33/4. [Full table](screenshots/milestone-c2/performance.md) also includes worst frames, chunks and local counts. C.2's single measured page load reached first submitted geometry at 1,249 ms and the settled district marker at 2,159 ms; C.1 recorded 876/2,291 ms. These are single navigation-origin observations, not repeated cold-cache loading trials. Optional legacy-kit readiness is a separate marker.

## Actual screenshots and motion

All images are application screenshots. [Capture plan](screenshots/milestone-c2/capture-plan.json) and [observed camera metadata](screenshots/milestone-c2/capture-metadata.json) preserve poses. Matched comparisons use viewport 1536×791, Medium and 956×476 physical canvases. World pairs share identical absolute positions and targets. District/selected pairs share identical target-relative offsets and distance, recentered on their actual changed directory placement; they are not falsely described as identical absolute world coordinates.

| View | C.1 before | C.2 after |
| --- | --- | --- |
| World | [before](screenshots/milestone-c2/before-world-matched.png) | [after](screenshots/milestone-c2/after-world-matched.png) |
| Physlib | [before](screenshots/milestone-c2/before-physlib-matched.png) | [after](screenshots/milestone-c2/after-physlib-matched.png) |
| Units | [before](screenshots/milestone-c2/before-units-matched.png) | [after](screenshots/milestone-c2/after-units-matched.png) |
| Classical Mechanics | [before](screenshots/milestone-c2/before-mechanics-matched.png) | [after](screenshots/milestone-c2/after-mechanics-matched.png) |
| Nested WithDim | [before](screenshots/milestone-c2/before-withdim-matched.png) | [after](screenshots/milestone-c2/after-withdim-matched.png) |
| Selected building | [before](screenshots/milestone-c2/before-selected-matched.png) | [after](screenshots/milestone-c2/after-selected-matched.png) |

Normal auto-framed review captures: [surface](screenshots/milestone-c2/surface-overview.png), [Physlib](screenshots/milestone-c2/physlib-borough.png), [PhyslibAlpha](screenshots/milestone-c2/physlibalpha-borough.png), [QuantumInfo](screenshots/milestone-c2/quantuminfo-borough.png), [Units](screenshots/milestone-c2/units-district.png), [Classical Mechanics](screenshots/milestone-c2/classical-mechanics.png), [Thermodynamics](screenshots/milestone-c2/thermodynamics.png), [Electromagnetism](screenshots/milestone-c2/electromagnetism.png), [WithDim](screenshots/milestone-c2/nested-withdim.png), [selected](screenshots/milestone-c2/units-selected.png), [river crossing](screenshots/milestone-c2/river-crossing.png), [Mathlib](screenshots/milestone-c2/mathlib-roundtrip.png), [Explore](screenshots/milestone-c2/explore-selected.png), [mobile](screenshots/milestone-c2/mobile-selected.png), [map](screenshots/milestone-c2/registry-map.png), [source floor](screenshots/milestone-c2/floor-source.png), [packaged fallback](screenshots/milestone-c2/packaged-404.png).

[Actual camera-motion GIF](screenshots/milestone-c2/camera-motion.gif): 20 sampled browser frames over 3.186 seconds, with capture timestamps in `motion/frames.json`. It is a short sampled motion record, not a 60 FPS recording or proof of absence of shimmer/LOD popping on all hardware.

## Remaining acceptance and known limitations

- **Visual acceptance is pending external screenshot review. Do not promote C.2 to the default.** District colour is much more visible, but the whole-world view can still read as a coloured planning model: individual buildings and civic silhouettes remain small at that scale. Some open borough land and subdued facade massing remain artistic concerns.
- The heuristic adjacency/pattern checks do not replace human colour-vision review. Landmarks are deliberately non-selectable and some are weak at distant views.
- No representative hardware GPU, Firefox, touch or physical trackpad session was validated. Mobile captures verify layout, not device performance.
- Automated clearance and navigation tests pass; they do not establish every possible free-camera trajectory. The short motion sample cannot certify universal absence of popping.
- Existing imported-asset provenance limitations remain documented; no new third-party asset provenance is claimed.

Stop point: C.2 implementation and evidence are complete for review; artistic approval and the limitations above remain open. No Milestone D work follows automatically.
