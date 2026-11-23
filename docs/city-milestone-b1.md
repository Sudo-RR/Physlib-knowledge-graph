# Milestone B.1 — rendering optimisation and review

22 November 2026. Implementation stops at the existing 25-file Units showcase.
**External artistic approval remains pending.** No boroughs, rivers or complete
Mathlib mirror world were implemented.

## Architecture and changed files

The implementation keeps canonical building bodies, collision targets, IDs,
source-derived dimensions and camera navigation. Only decorative presentation
changes. `site/city-district-lod.js` adds three screen-space tiers: city masses,
district shells and the existing full modular kit. Medium uses 145-pixel shell
and 440-pixel full-detail thresholds; selected buildings receive full detail
above 175 pixels. Low raises the shell threshold to 250 pixels and caps detail
at shells. Hysteresis and a 380 ms complementary screen-door dissolve replace
hard switches. These thresholds use projected building height, not taxonomy.

District facades use an original generated 256×128 ceramic/teal/copper atlas
with repeated fixed-height stories, plus real setbacks, crowns, fins and
entrances. Full kit instances remain available close to selected buildings.
Batch geometry shares source vertex/index attributes; per-instance attributes
and compacted instance matrices control active detail. Low actually removes
full facade geometry and small props. Signs fade with projected size; skywalk
rails, collars and arrows use distance thresholds. Static architectural shadow
maps refresh after LOD settles rather than every frame.

Changes for B.1:

- `site/city-district-lod.js`: tier selection, fades, atlas and shared batches.
- `site/city-render-profile.js`: diagnostic profiles and phase summaries.
- `site/city-scene.js`: LOD integration, shadow caching, skywalk detail, metrics;
  caches overlay dimensions once per frame to avoid repeated layout reads.
- `test/city-district.test.mjs`: hysteresis, fades, Low cap, real triangle
  reduction, resource sharing and profiling checks.
- `scripts/serve.mjs`: opt-in loopback-only benchmark JSON collector, excluded
  from the static package. `scripts/report-city-b1.mjs` archives and aggregates
  its records. Documentation, asset ledger and review evidence accompany them.

The existing JavaScript/Three.js codebase, module imports and deterministic
placements are preserved. No PaperView data or mathematical status was added.

## Comparable foreground performance

Chrome 157, Windows, ANGLE Microsoft Basic Render Driver D3D11 **software
rendering**, not representative GPU performance. Chrome GPU Internals reports
hardware acceleration unavailable; only Microsoft Basic adapters are exposed.
No hardware-accelerated result was obtainable in this environment.

Each comparison uses three foreground 12-second runs of the unchanged repeatable
20-step camera path. All sampled frames report visible document and focused
window. Viewport: 1536×791 CSS pixels; canvas: 956×505 Medium, 717×378 Low
(pixel ratios 1 and .75). Run statistics below are medians across three runs;
worst is the maximum observed frame. Initial Medium warmup/pre-layout-cache
records are retained but excluded. Runs are sequential, not a randomized study.

| Scene | FPS | P50 ms | P95 ms | P99 ms | Worst ms | Calls | Triangles | Geometries / textures |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Procedural Medium | 37.5 | 26.2 | 33.9 | 48.7 | 75.6 | 44 | 6,098 | 17 / 3 |
| Modular Medium | 28.5 | 34.7 | 48.1 | 52.6 | 78.1 | 68–92 | 21,888–35,774 | 48 / 9 |
| Modular Low | 41.4 | 23.1 | 34.5 | 42.6 | 59.3 | 55–58 | 8,994–10,262 | 48 / 9 |

Low is **3.29×** the historical 12.6 FPS software baseline (+229%). Medium's
peak path workload is **87.6% lower** than the previous ~288,000 triangles.
Low's peak is 71.3% below current Medium's peak. Draw calls and resident
geometry objects increased in Medium because tiers coexist and batches are
compacted independently; this optimisation reduces submitted geometry rather
than claiming fewer allocated resources. Triangle counts include shadow passes
when refreshed, so transition peaks are deliberately included.

First visible modular model and completed initial district were both observed
at **1,872 ms from page time origin** in the comparison page; the restored
packaged page took 2,392 ms. These are warm local observations, not cold-network
percentiles. Low was selected on the same loaded page and shares its load time.
Completion means the assembled district was submitted in its first visible
frame, not a separately measured GPU-completion fence.

Raw records and aggregation: [benchmarks.json](screenshots/milestone-b1/benchmarks.json)
and [runs](screenshots/milestone-b1/runs). Recreate aggregation with
`node scripts/report-city-b1.mjs` while collector output exists.

## Profiling checks

Single-run diagnostics use the same selected module and camera path, Medium.
They identify sensitivity, not independent additive budgets.

| Profile | FPS | P95 ms | Interpretation |
| --- | ---: | ---: | --- |
| Legacy full kit | 11.1 | 117.6 | 286,520–287,384 triangles: heavy geometry remains expensive |
| Quarter pixel count | 47.4 | 27.5 | Same geometry; strong rasterisation/pixel-work sensitivity |
| Clear only | 54.9 | 25.6 | Updates and overlays retained; scene drawing omitted |
| No overlays | 32.6 | 36.0 | DOM labels/diagnostics and associated composition have measurable cost |
| Live shadows | 26.4 | 53.8 | Refreshing detailed shadow maps each frame adds work |
| Synchronous finish | 28.4 | 49.0 | `gl.finish()` adds little exposed wait on this software backend |

Normal scene updates take roughly 0.3 ms median, render submission ~3 ms.
Overlay caching reduced an initial measured median 21.7 ms to ~4–5 ms.
These CPU intervals can include browser/driver blocking. No GPU timer extension
is available; geometry processing and rasterisation cannot be assigned exact
GPU milliseconds here. The no-overlay comparison combines DOM update, layout
and compositing effects; it does not independently isolate OS composition.
Legacy keeps current skywalk distance handling, so it is a diagnostic recreation
rather than a byte-identical historical B build.

To repeat: `npm run build:city`, `npm run serve`, open
`/?district=units&districtView=selected&node=Physlib.Units.ISQDimensionBase&metrics=1&collect=1`.
Use the visible quality selector and Benchmark camera motion button, keeping
the separate native browser window foreground throughout. Change district to
`procedural` for control. Diagnostic query `profile` accepts `legacy`, `city`,
`district`, `building`, `quarter`, `flat`, `clear`, `no-overlay`, `live-shadows`
and `sync`. Collector output is written to ignored `dist/city-benchmarks`.

## Tests, loading, navigation and packaging

- **71/71 tests pass**, including shared loader caching/retry, repository-subpath
  URLs, graph/placement invariance, canonical dimensions and source-range floors.
- `npm run validate:assets`, `npm run validate:data`, `npm run build:city` and
  `npm run package:site` pass. Asset hashes remain unchanged.
- Browser checks retain exact selected `Physlib.Units.ISQDimensionBase`, its
  revision-bound source links and 102 source lines. Floor 2 opens source lines
  52–102, explicitly marked as a source range. Mathlib selection and return
  navigation were checked; no invented declaration dependency is shown.
- Packaged site tested under a repository subpath with the kit deliberately
  missing: visible procedural fallback and working floor inspector. Restoring
  the kit and reloading restores all 25 modular files. Screenshots record both.
- Tests check continuous normalized LOD weights, hysteresis and Low's detail
  cap. Foreground camera runs traverse 24 tier transitions without runtime
  failure. Absence of perceptible popping still requires motion review; static
  screenshots and automated weights cannot establish that artistic criterion.

## Asset provenance

The same five-part Kenney Modular Buildings kit remains CC0-1.0; see
[asset ledger](../THIRD_PARTY_ASSETS.md), including the existing mirror-provenance
limitation. No new external model or texture was imported. The facade atlas,
shells and LOD shader are original repository code. Imported decorative meshes
remain separate from canonical selection/collision meshes.

## Matched screenshots and outstanding acceptance

All three pairs are actual application captures, Medium, identical viewport,
camera position, target and renderer settings within each pair. The camera
records confirm exact matches. Captures use the in-app browser for visual QA;
its throttled frame rate is excluded from performance results.

| Pose | Procedural | Modular |
| --- | --- | --- |
| Overview | [image](screenshots/milestone-b1/procedural-overview.jpg) | [image](screenshots/milestone-b1/modular-overview.jpg) |
| Medium distance | [image](screenshots/milestone-b1/procedural-medium.jpg) | [image](screenshots/milestone-b1/modular-medium.jpg) |
| Selected building | [image](screenshots/milestone-b1/procedural-selected.jpg) | [image](screenshots/milestone-b1/modular-selected.jpg) |

[Camera matches](screenshots/milestone-b1/camera-matches.json),
[404 fallback](screenshots/milestone-b1/packaged-404-fallback.png),
[fallback floor inspector](screenshots/milestone-b1/fallback-floor-inspector.png),
[restored packaged district](screenshots/milestone-b1/packaged-restored.png).

Known limitations: Medium remains slower than the procedural control; shell
facades are flatter than close-detail architecture. Cached shadows may change
when a tier settles; small skywalk details use thresholds rather than fades.
Screen-door transitions may shimmer on software rendering. Resident geometry
counts are higher, and off-screen instances are not spatially partitioned.
Hardware GPU performance, perceptual motion/no-popping acceptance, and external
artistic approval remain **unmet/pending**. This is not the completed artistic
redesign, and no work proceeds to Milestone C.
