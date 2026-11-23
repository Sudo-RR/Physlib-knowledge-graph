# Milestone C — repository geography

23 November 2026. C0–C4 implementation of the three-borough surface geography.
This is a geographic/layout milestone, not final artistic approval. No Mathlib
architectural redesign, PaperView ingestion, formalisation status or new edge
semantics were implemented.

## Source inventory and identity

| Surface borough | Real modules |
| --- | ---: |
| Physlib | 669 |
| PhyslibAlpha | 828 |
| QuantumInfo | 82 |

The city retains 2,256 exact module IDs: 1,579 surface files and the existing
677 directly imported Mathlib files, with 6,598 recorded import edges. Physlib
revision is `4e2182f2b6f0a54207a2fa62002c264217f875d6`; Mathlib is
`56a005855ea17e0b0958f73ec801ae140b0a1679`, Lean `v4.35.0`. Snapshot files were
not regenerated or edited. Their hashes and the full-data audit are recorded
in [layout-audit.json](screenshots/milestone-c/layout-audit.json).

All three roots are present. Actual root aggregators `Physlib.lean`,
`PhyslibAlpha.lean`, `QuantumInfo.lean` and direct root files occupy explicitly
labelled Root Modules parcels. These are planning parcels, not invented source
directories. Exact source paths remain separate from synthetic parcel IDs.
Observed paths reach seven components; arbitrary directory depth is retained.

## C0–C3 architecture and decisions

C0 baseline: 71 tests passed, data/assets validated and bundle built. Historical
B.1 matched captures and measured 28.5/41.4 FPS fixture results are retained in
the [B.1 report](city-milestone-b1.md). `?layout=legacy` preserves the old layout;
`district=units` and `district=procedural` remain available in both layouts.

The version-3 serialisable manifest is the sole surface placement authority.
Three bounded west-to-east boroughs are separated by two continuous segmented
water ribbons, each with a distinct ordinary civic bridge. Rivers are 100 units
wide with 12-unit reserved bank margins and mild deterministic shoreline curves.
Water is deliberately static and inexpensive; there are no reflections or new
water libraries. Civic crossings and service reserves are never import edges.

First-level source directories occupy broad trapezoidal, wedge-inspired
district envelopes. Recursive street/courtyard shelf packing supplies their
interiors. This was chosen over narrow radial sectors so mixed-depth directory
trees and tall buildings can retain rectangular collision-safe inspection
space. Nested local files and child parcels are separate; deeper levels remain
in the hierarchy and breadcrumbs without drawing a border at every depth.
Area derives from real buildings and space reservations, not scientific merit.

Named planning parameters include a 4-unit minimum gap, at least one neighbouring
semantic footprint width, 5-unit streets, 3-unit orbit clearance, height-based
setbacks, 2-unit skywalk bands, 1.5-unit service bands, 12-unit parcel/bank
margins and small deterministic courtyard offsets. Each building carries exact
semantic dimensions, a conservative decorative envelope covering roofs,
entrances and planting, and roof docking bounds. Oversized inputs expand their
parcels; semantic geometry is never compressed.

The full-data audit measures a **15.9-unit minimum decorative gap**, no reported
building/corridor/bank/obstruction collisions, 420 directory chunks and a stable
hierarchy. An in-memory appended Units-file perturbation moved **0 of 1,579**
existing surface anchors. This is one measured perturbation, not a guarantee
that future directory growth never causes shelf/borough reflow. The audit also
exports [Units reservations](screenshots/milestone-c/units-reservations.json).

All legacy surface topic discs, circular neighbourhood foundations, radial
boundary rings and radial landscape allocation are guarded behind the explicit
legacy route. They are not allocated in normal surface rendering. The obsolete
global ground plane is also disabled there. Normal selection uses the semantic
outline, file label and inspector. Architectural roof collars and genuine
dependency markers are distinct from the removed ground motif.

Rendering pools distant silhouettes into borough instance buffers after chunk
frustum filtering. Nearby shells retain shared box/roof geometry. Full modular
facades are bounded to the 25-file Units fixture plus one inspected building;
unvisited districts never receive full GLB assemblies. Canonical hitboxes stay
raycastable separately from decorative draw geometry. Low caps modular detail,
suppresses small props and shadows, and lowers resolution. B.1 hysteresis and
dither transitions are retained for modular detail.

The kit loads once per page and its template resources are reused. Selected
short recorded imports are re-anchored through reserved row bands with elevated
clearance above decorative heights. Long links remain exact inspector
destinations with an explicit omission notice; civic bridges do not fabricate
cross-river imports. Mathlib coordinates are compared exactly against the
legacy layout and remain unchanged in the negative-Y subsystem.

## Files changed for C

- `city-hierarchy.js`, `city-borough-layout.js`: pure source hierarchy,
  deterministic plots/envelopes/reservations and validation.
- `city-spatial-index.js`, `city-chunk-art.js`: chunk queries, activation and
  pooled silhouettes/shells.
- `city-rivers.js`, `city-geography-map.js`: batched land, streets, water,
  civic crossings and the matching geographic map.
- `city-layout.js`, `city-scene.js`: legacy adapter, geographic rendering,
  selection/collision integration, metrics and bounded local detail.
- `city.js`, `city.css`, `index.html`: hierarchy breadcrumbs, map controls,
  surface overview, layer-aware navigation and legend.
- `city-navigation.js`: whole-world soft bounds and reduced-motion flights.
- `city-district.js`, `city-district-lod.js`, `city-skywalks.js`: spacious Units
  framing, local shadow costs and geographic endpoint routing.
- `test/city-borough.test.mjs`: real-data and adversarial geometry/navigation
  checks. Existing radial tests explicitly cover the retained legacy route.
- `scripts/audit-city-c.mjs`, `scripts/report-city-c.mjs`: reproducible evidence.
  README and asset ledger link this report. No new runtime dependency was added.

## C4 tests and browser QA

Final checks: **81/81 tests pass**, data/assets validate, bundle builds and the
static site packages successfully. The 2,147 civic street/crossing segments
form one connected component. Streets use merged flat geometry. Shared-resource
cleanup and canonical floor-picking precedence have dedicated regression tests.
Working-tree base: `24356645c5a4db54acbe0a0d5b7f7bd399749780`; earlier milestone
changes were already uncommitted.

The regression suite covers exact identities/edges, deterministic generation,
Physlib versus PhyslibAlpha assignment, mixed-depth/duplicate basenames, missing
and unknown roots, zero-line and extremely tall files, dense single-directory
expansion, actual street/orbit clearance, chunk queries/offscreen activation,
riverbed visibility, canonical picking and a sampled real selected skywalk.
Existing source-range, loader caching/retry, provenance and subpath checks remain.
See [test output](screenshots/milestone-c/tests.txt),
[asset validation](screenshots/milestone-c/asset-validation.txt) and
[data validation](screenshots/milestone-c/data-validation.txt).

Actual browser checks cover overview, geographic map focus, borough/district/
WithDim focus, remote Qubit search, exact Units source inspection (Floor 2,
lines 52–102), Medium/Low/High changes without selection loss, and the recorded
Mathlib Fintype Card selection/Back round-trip. A 640-pixel viewport capture
checks the selected building and its surroundings.

The static package was opened at `/Physlib-knowledge-graph/index.html`, with
the kit deliberately missing: procedural fallback, the exact module and source
floor inspector remained usable. Restoring the kit/reloading recovered modular
architecture. No authentication, publication or upstream repository changes
were performed.

## Performance and the regression found during QA

Native Chrome 157, 1536×791 viewport, Microsoft Basic Render Driver through
ANGLE/D3D11: **software rendering, not representative GPU performance**.
Medium canvas is 956×476; Low uses pixel ratio .75, High up to 1.5. Breadcrumbs
make this canvas slightly shorter than B.1's 956×505, so the historical fixture
comparison is not an identical-pixel benchmark. Exact paths, dimensions,
renderer and raw samples are exported per run.

Each published final row uses three 12-second foreground runs, 20 steps at 600 ms, with
the same target/radius retained across quality changes. FPS and percentiles are
medians of run statistics; ranges include all sampled frames. Borough paths
are centred on their actual geography and may see neighbouring boroughs.
The extra QA renderer is closed during the isolated final series. Older
exploratory runs are retained separately, not silently mixed into final rows.

QA initially found a ~15 FPS local regression. A flat-material diagnostic
reached 33.7 FPS with similar geometry, identifying substantial shading cost.
Terrain/streets now use inexpensive map-colour materials; real building plots
and detailed architecture retain lighting and shadow reception. District/city
shells avoid detailed shadow sampling. Closing the extra QA renderer also
removes contention, so these changes are not presented as an isolated causal
GPU-time experiment. GPU timer queries are unavailable.

The final connected-street revision (`C4-final-3`) whole-surface flyover reaches
**42.1 FPS Medium**, **53.9 FPS Low**, **28.8 FPS High**. Across those runs:
57–70 draw calls, 53,084–56,788 triangles, 58 geometries, 7 textures. Medium
P50/P95/P99 is 23.4/28.0/36.1 ms; Low 18.4/21.8/24.8; High 33.0/49.6/56.4.

The previous isolated series (`C4-final-2`) Units fixture reached 41.8 FPS Medium
and 55.6 FPS Low; its whole-city flyover reached 40.2/51.1 FPS. That series
predates the final connected-street/flat-street batching change. Its complete
[borough/quality table](screenshots/milestone-c/benchmarks-C4-final-2.md) and
[raw summary](screenshots/milestone-c/benchmarks-C4-final-2.json) remain separate.

**Not met:** final-revision borough/Units retiming. The native QA window closed
before these repetitions; the remaining Chrome window was minimized and could
not be restored through the available controls. One interrupted final Physlib
run is explicitly excluded in the JSON. No background result substitutes for
foreground measurements. Hardware-accelerated performance remains unverified.
Consult the complete [performance table](screenshots/milestone-c/performance-table.md)
and [raw summary](screenshots/milestone-c/benchmarks.json) for High, each borough,
P50/P95/P99, worst frame, calls, triangles, chunks, LOD and resident geometry/
texture counts. Renderer object counts are memory proxies, not GPU byte usage.

## Actual screenshots for review

| Check | Capture |
| --- | --- |
| All three boroughs; two rivers; no circles | [Overview](screenshots/milestone-c/overview-no-circles.png) |
| River and ordinary civic bridges | [River 1](screenshots/milestone-c/river-1-civic-crossing.png), [River 2](screenshots/milestone-c/river-2-civic-crossing.png) |
| Physlib and Units | [Borough](screenshots/milestone-c/physlib-borough.png), [district](screenshots/milestone-c/units-district.png) |
| PhyslibAlpha / QuantumInfo | [Alpha](screenshots/milestone-c/physlib-alpha-borough.png), [QuantumInfo](screenshots/milestone-c/quantuminfo-borough.png) |
| Nested hierarchy and street/service capacity | [WithDim](screenshots/milestone-c/nested-withdim-spacing.png) |
| Exact selected building; recorded import notice | [Units](screenshots/milestone-c/units-selected-spacing.png) |
| Small canvas | [640-pixel view](screenshots/milestone-c/small-viewport-selected.png) |
| Mathlib round-trip | [Below](screenshots/milestone-c/mathlib-underground.png), [returned](screenshots/milestone-c/mathlib-return.png) |
| Packaged failure recovery | [404 fallback](screenshots/milestone-c/packaged-404-fallback.png), [floor](screenshots/milestone-c/packaged-fallback-floor.png) |

Overview, river, borough, district, selected building, packaged fallback/recovery
and source-inspector captures were refreshed against the final connected-street
revision at 1536×791. The small-viewport capture is retained from earlier C QA.
These are application captures, not concepts. Geographic coordinates changed
intentionally, so the old/new city compositions are not claimed to be a
pixel-matched camera comparison. B.1's matched original comparisons remain
available in its report. Static screenshots cannot establish motion quality.

## Provenance and remaining limits

No new external art was imported. The existing Kenney five-part CC0 kit, its
hashes and accepted mirror-provenance limitation remain documented in the
[asset ledger](../THIRD_PARTY_ASSETS.md). Terrain, river ribbons, map and layout
are original repository code; no PaperView records or statuses were fabricated.

Manual 3D floor-click confirmation and right-drag interaction remain unverified;
floor picking has a raycast regression test and inspector buttons were tested.
External artistic approval, representative hardware acceleration, real touch/
trackpad testing and perceptual LOD/motion acceptance remain pending. There is
no new motion-capture artifact. Long dependency links are inspector-only rather
than detailed railings across kilometres. Water is static in all qualities.
The chunk index is a coarse AABB scan, and shared terrain batches remain
resident; this is not a demonstration of unlimited-city scaling. Shelf growth
can eventually reflow neighbouring parcels. The Mathlib architecture remains
the existing imported-subset implementation.

Milestone D handoff: redesign the underground architecture only after review;
later art polish and scientific taxonomy integration remain separate work.
No Milestone D implementation is included.
