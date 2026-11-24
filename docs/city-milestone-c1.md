# Milestone C.1 — atomic courtyard campus

23 November 2026. **Opt-in review release; visual approval pending.** Open
`?visual=c1&node=Physlib.Units.ISQDimensionBase`. C remains the default because
the controlled Medium performance budget was not met. No Milestone D work,
Mathlib rebuilding, PaperView records or new mathematical edges are included.

## Critique and concept choice

The installed Impeccable `context --target site/city-scene.js` and `detect
--json site/index.html` commands were attempted. Both failed: engine 0.1.5
is absent and its cache requires network/write access. No detector findings,
injected overlay or successful automated Impeccable command is claimed.
Its local critique, bolder, colorize, layout, craft-floor, polish, audit and
documentation playbooks informed the work. Two independent critique agents
ran after explicit user approval. Questions skipped: the supplied art brief
resolved the remaining direction choices.

Baseline findings: pole silhouettes; empty parcels rather than public space;
weak roof/massing hierarchy; a fixed selected camera; competing canvas overlays;
awkward exact-name wrapping; indistinct paving and service space. The independent
baseline heuristic review scored 25/40; this is design judgment, not a test.

Two actual Three.js variants use the same 25 Units modules:

- **A, campus:** cylindrical institutes, stepped laboratories, broad pavilions,
  coral crowns and amber/turquoise roofs around paired entrance courts.
- **B, metropolis:** rectilinear institute bodies, extra vertical wings and
  larger amber roof assemblies. B is a lightweight alternative, not a second
  production city engine or fully developed civic-landmark system.

Matched concept captures use identical C.1 anchors and `[35,30,7]` camera
offsets: [A](screenshots/milestone-c1/concept-a-selected.png),
[B](screenshots/milestone-c1/concept-b-selected.png). District experiments:
[A](screenshots/milestone-c1/concept-a-campus.png),
[B](screenshots/milestone-c1/concept-b-metropolis.png). These earlier district
experiments predate the final court widening; the final district is below.

| Rubric, 1–5 | A | B |
| --- | ---: | ---: |
| Silhouette | 3 | 3 |
| Colour | 4 | 3 |
| Spatial legibility | 2 | 2 |
| Selected framing | 4 | 4 |
| LOD cost | Unmeasured separately | Unmeasured separately |

**A chosen:** clearer archetypes and a calmer roof rhythm. Independent final
review found archetype distinction and tree wrapping resolved; district framing
and courts only partially resolved; distant paving/park banding remains visible.
The release is not presented as final artistic acceptance.

## Measurement and implementation contract

Raw source height and source floors remain canonical. Surface display height is
`min(20, 5 + 3 * log2(1 + sourceLines / 80))`. It is monotone, calibrated against
the pinned file distribution, and expressly decorative. Minimum archetype
widths are 14 / 9 / 7.5 / 12 units, with modest source-size growth and a maximum
height/width ratio of 1.85. The inspector reports display size/type separately;
architectural storeys never replace source ranges.

| Full surface measurement | C min / median / P90 / P99 / max | C.1 |
| --- | --- | --- |
| Display height | 10.58 / 18.14 / 21.26 / 23.81 / 25.64 | 5.79 / 10.50 / 14.10 / 17.43 / 19.95 |
| Width | 1.50 / 1.85 / 2.20 / 2.20 / 2.20 | 7.57 / 10.54 / 15.22 / 16.53 / 17.51 |
| Height/width | 4.81 / 9.92 / 12.60 / 14.77 / 16.23 | 0.42 / 0.95 / 1.39 / 1.73 / 1.85 |

Units median display height changes from 16.45 to 8.90 and median width from
1.85 to 9.46. `ISQDimensionBase` still has 102 source lines and the same two
source floors. The preferred camera projects its conservative decorative box
to **59.0%** of canvas height, versus approximately 40% for C's narrow shaft in
the baseline review. These are different measurements: projected box versus
reviewer-estimated visible object, not a precise causal size comparison.

Manifest v4 packs up to six same-directory modules in paired rows with facing
entrances, wider green courts and explicit row street/service/skywalk bands.
Synthetic visual blocks are labelled as such; they create no Lean directories.
All 503 visual blocks, 187 landscaped courts and 204 unused-space park strips
are deterministic. Boroughs expand to approximately 5,531 × 2,878 world units
including margins; the source hierarchy, three roots and two rivers persist.

Minimum measured decorative gap is **8.02 units**, above the C.1 four-unit
floor and configured footprint/orbit reservations. Zero audited envelope,
bank, street or infrastructure overlaps; all 2,227 civic segments connect.
Every rendered architectural instance is tested against its exported AABB.
An appended in-memory Units file moves **0/1,579** existing anchors. Future
large source growth may still reflow parcels. See [audit](screenshots/milestone-c1/layout-audit.json)
and [exported service/skywalk/docking reserves](screenshots/milestone-c1/infrastructure.json).

Source counts remain 669 Physlib, 828 PhyslibAlpha, 82 QuantumInfo, 677 imported
Mathlib modules and 6,598 recorded edges. Snapshot SHA-256 values are unchanged
and exported in the audit. Mathlib anchors are compared exactly to the original
layout. No mathematical status, scientific rank or theorem relation is inferred
from archetype, display size, parks or civic bridges.

One Three.js renderer uses bounded shared primitive/instanced batches. City
tiers retain broad bodies and cheap roofs; district/inspection add domes,
canopies, entrance planting and fixed-scale facade bands. Low omits that detail
geometrically. Hysteresis and the existing screen-door shader support detail
transitions. Terrain planting/paving use flat quads where depth is unnecessary.
No new asset downloads or runtime dependencies. C.1 original geometry does not
require the optional Kenney GLB; the C fallback/cache pipeline remains intact.

Selected skywalks use only recorded imports, actual new footprint offsets and
roof docking zones. Dense, extreme-height and deeply nested fixtures test
sampled candidate clearance. Long Mathlib pipes are inspector-accessible rather
than drawn through C.1 surface buildings. Existing underground routes remain.
The candidate azimuth search scores nearby decorative envelopes in the view
direction; this is a geometric approximation, not a GPU occlusion query.

Normal C.1 hides diagnostic controls, duplicate selected/status overlays and
the movement pad. Search, history, breadcrumbs, map/help, inspector and toolbar
remain. Home restores the camera, and source floors remain selectable in 3D.

## Evidence and checks

- **85/85 tests pass**, data/assets validate, bundle builds and packaging passes.
  [Tests](screenshots/milestone-c1/tests.txt), [data](screenshots/milestone-c1/data-validation.txt),
  [assets](screenshots/milestone-c1/asset-validation.txt).
- Actual browser checks: direct selected deep link; source-floor button;
  canvas click opens exact Floor 2, lines 52–102; Mathlib Card/Back round trip;
  zoom, Home and Focus selected recovery; three quality changes; nested/borough
  focus. Physical trackpad, touch and right-drag remain unverified.
- Pages-style `/qa-c1/index.html` check: deliberately absent kit triggers C's
  documented fallback. C.1 renders without it and exact source-floor inspection
  still works. No C.1 per-module GLB fetch is needed. Packaging stays static.
- 640×900 responsive capture: 625×520 canvas, no document horizontal overflow,
  zero visible debug/status/movement overlays in normal mode. Explorer can
  scroll horizontally for exact long names. Inspector remains below the scene.
- UI audit: accessibility 3/4, performance 2/4, theming 3/4, responsive 3/4,
  integrity 3/4, manually assessed. Not a WCAG certification or detector pass.
  Inherited small labels and some desktop targets still need accessibility review.

| View | Before | After |
| --- | --- | --- |
| Selected, fixed relative pose/canvas | [C](screenshots/milestone-c1/before-selected-matched.png) | [C.1](screenshots/milestone-c1/after-selected-matched.png) |
| Preferred selected framing | [C reference](screenshots/milestone-c/units-selected-spacing.png) | [C.1](screenshots/milestone-c1/units-selected.png) |
| Units district | [C](screenshots/milestone-c1/before-units-district.png) | [C.1](screenshots/milestone-c1/units-district.png) |
| Nested WithDim | [C](screenshots/milestone-c1/before-withdim.png) | [C.1](screenshots/milestone-c1/withdim.png) |
| Physlib borough | [C](screenshots/milestone-c1/before-physlib-borough.png) | [C.1](screenshots/milestone-c1/physlib-borough.png) |
| Whole surface | [C](screenshots/milestone-c1/before-surface-overview.png) | [C.1](screenshots/milestone-c1/surface-overview.png) |

Additional actual captures: [street](screenshots/milestone-c1/units-street.png),
[Alpha](screenshots/milestone-c1/alpha-borough.png), [QuantumInfo](screenshots/milestone-c1/quantum-borough.png),
[mobile](screenshots/milestone-c1/mobile-selected.png), [source floor](screenshots/milestone-c1/source-floor.png).
All desktop review captures use 1536×791, Medium. The matched selected pair uses
956×476 canvas, the same target-relative `[35,30,7]` offset and FOV; world anchors
necessarily differ between layout versions. Other scope pairs use the same
scope/fit policy, not identical absolute world cameras or canvas dimensions.
That literal all-view same-pose criterion is **not fully met**. Camera metadata
is retained in [qa-views.json](screenshots/milestone-c1/qa-views.json).

[Sampled camera animation](screenshots/milestone-c1/camera-motion-sampled.gif)
uses 12 real application frames at roughly one-second intervals. It demonstrates
camera travel, not continuous-frame LOD shimmer acceptance. Original frames and
timestamps are retained under `screenshots/milestone-c1/motion/`.

## Controlled performance

Native Chrome, 1536×791 viewport; fixed 956×476 CSS canvas for both versions,
same quality ratios and 20-step/12-second path at target `[2400,14,1360]`,
radius 3350. Last three valid foreground runs per row; other valid/warmup runs
remain archived. Medians of run statistics, not pooled-frame percentiles.
Renderer: **ANGLE / Microsoft Basic Render Driver / D3D11 software**, not GPU
performance. No other QA renderer ran during timing. Geometry differs because
the displayed architecture differs; known modules were not filtered out.

| Visual / quality | FPS | P50 / P95 / P99 ms | Calls | Triangles |
| --- | ---: | --- | --- | --- |
| C Medium | 45.3 | 21.8 / 26.9 / 31.2 | 57–70 | 53,264–56,788 |
| C Low | 56.5 | 17.4 / 21.7 / 24.6 | 57–70 | 53,180–56,788 |
| C High | 36.5 | 27.2 / 31.5 / 37.7 | 57–70 | 53,264–56,788 |
| C.1 Medium | 35.6 | 27.1 / 37.0 / 45.7 | 57–69 | 70,420–79,416 |
| C.1 Low | 46.7 | 21.0 / 26.8 / 30.7 | 57–69 | 70,476–79,416 |
| C.1 High | 31.2 | 31.6 / 37.6 / 45.6 | 57–69 | 70,372–79,416 |

C.1 Medium regresses about **21%** against this baseline. Low is about **31%**
faster than C.1 Medium; the near-view test independently verifies substantial
actual geometry reduction. At this distant path both qualities use mostly
silhouettes, so resolution/shadows account for most of the FPS difference.
Resource counts: C 58 geometries/7 textures, C.1 67/4; these are not byte sizes.
Navigation-origin first-visible/completed markers were 1,323 ms for C and
1,162 ms for C.1 on these page loads; same-valued completion means first static
assembly frame, not GPU warm-up completion. See [complete table](screenshots/milestone-c1/performance.md)
and [raw runs/renderer/path/percentiles](screenshots/milestone-c1/benchmarks.json).

## Changed files and remaining gates

New `city-atomic-plan.js` separates display encoding/camera math;
`city-atomic-art.js` owns original shared geometry and LOD batches.
`city-borough-layout.js` exports v4 blocks/courts/parks/reserves;
`city-rivers.js` renders the civic ground palette;
`city-scene.js`, `city-skywalks.js`, `city.js`, `city.css`, `index.html` integrate
interaction, bounds, decluttering and the opt-in route. `test/city-atomic.test.mjs`
adds semantic, full-art AABB, determinism, Low-detail, routing and review-URL parsing checks. A comma-separated review-offset capture defect was found in the contact sheet, fixed, regression-tested and the affected images recaptured.
Two audit/report scripts export evidence. PRODUCT.md, DESIGN.md and
`.impeccable/design.json` record the implemented system. Existing tests were
retained; raw-height assertions were not silently removed.

No new redistributed assets. Original parametric geometry and palette are
repository code; the existing Kenney CC0 ledger/provenance caveat is unchanged.

Open gates: human artistic approval, performance regression, district composition
still grid-like, schematic park/court landscaping, visible distant paving/park
banding and unverified motion shimmer, representative GPU/hardware/input testing,
literal same-world-pose matching for every changed-layout overview. B's civic
landmark system is exploratory. Static water remains. These are explicit limits,
not proof of completion from passing tests. **Stop after C.1; no D implementation.**
