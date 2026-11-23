# Milestone B — Units modular district

22 November 2026. Implemented one opt-in showcase for the **25 actual files
under `Physlib/Units/`**, including `WithDim`. Artistic review and representative
performance acceptance remain open. No borough, river or Mathlib-world rebuild.

Open `?district=units&node=Physlib.Units.ISQDimensionBase&metrics=1` after
`npm run build:city && npm run serve`. Substitute `district=procedural` for the
comparison control. District overview, close view and building view share
deterministic semantic camera poses. The preview scopes rendering to Units;
selecting an outside file restores context. No source placements change.

## Implementation and files

- `site/city-district.js`: three stable-hash decorative archetypes—research
  tower, terraced laboratory and rotunda institute—sharing ceramic frames,
  inset teal glazing, copper bands, roof crowns and docking collars. Fixed
  0.72-unit facade stories, a 0.62-unit entrance podium and a remainder band
  smaller than one story preserve the exact semantic height. Imported windows
  never stretch. Architectural stories do not represent source floors.
- `site/city-skywalks.js`: up to three selected, recorded local module imports;
  instanced decks/rails, roof landings, directional moving arrows, recorded
  import-line labels and a bounded vertical-clearance heuristic.
- `site/city-asset-registry.js`, `site/assets/models/kenney-district-kit.glb`:
  one cached five-part GLB, not one building download per module. Doors, window
  bays, wall modules and roof pieces share source geometry/materials.
- `site/city-scene.js`, `site/city.js`, `site/city.css`: optional showcase,
  static cached PCF shadows, paths, planters, trees, lamps and actual-directory
  signs; matched camera controls, load-frame timing and an interruptible
  12-second camera benchmark with foreground validation, renderer metadata and
  JSON evidence export. Canonical picking/collision bodies stay separate.
- `site/city-resources.js`: release instance buffers and deduplicate disposal
  of shared ephemeral bridge resources.
- `scripts/pack-district-kit.mjs`, `scripts/validate-assets.mjs`, asset tests,
  district tests, README and licence ledger: reproducible repack, integrity,
  geometry/identity checks and documentation. Existing packaging includes the kit.

The default application and the accepted Milestone A fixture remain available.
`city-model.js`, `city-layout.js`, source extraction and graph data are unchanged.
All three snapshot SHA256 hashes still match the Milestone A report. No new
PaperView records, mathematical edges, status records or module identities.

## Asset provenance

Kenney **Modular Buildings 2.1**, CC0; same original licence receipt and
accepted mirror provenance limitation as Milestone A. Five original components
were repacked without changing vertices, UVs or palette pixels. The original
creator download was not obtained directly. File names, input/output hashes,
URLs and redistribution permission are in [THIRD_PARTY_ASSETS](../THIRD_PARTY_ASSETS.md).
New kit: **28,688 raw / 10,371 gzip bytes**, five named parts, 174 unique source
triangles before instancing, one embedded palette, no external decoder.
The full application bundle is approximately 1.61 MB raw / 308 KB gzip.

## Tests and browser checks

**68/68 tests pass.** Data validation, both asset validations, bundle build,
site packaging, packaged-asset validation and `git diff --check` pass.
Packaging required the same local sandbox escalation documented in Milestone A.
New checks cover fixed-height assembly, decorative bounds inside semantic
envelopes, real GLTFLoader geometry parsing, shared instancing, unchanged graph
inputs/positions, three archetypes, 25 concurrent consumers loading one kit,
selected import direction/capping, frame percentiles and instance-buffer cleanup.

Verified in the packaged site beneath a relative URL subpath:

- Exact module deep link and pinned source URL after asynchronous model load.
- Source floor opens for `Physlib.Units.ISQDimensionBase`.
- Actual Mathlib import opens the underground layer; Back returns to Units.
- Manual W input interrupts the camera benchmark.
- Selecting `Examples` shows its actual imports to `FDeriv` (line 10) and
  `WithDim.Speed` (line 9), without manufacturing additional bridges.
- Real GLB HTTP 404: procedural Units, exact source URL and floor inspector
  remain usable. The temporary packaged model was restored after this check.
- Low quality disables shadows and reduces renderer resolution.

## Comparable screenshots

All three pairs have **identical measured camera coordinates and targets,
canvas dimensions (686 × 429 renderer pixels), and Medium quality**. Requested
browser viewport was 1265 × 744. The procedural control uses the same scoped
visibility and selected-import policy; its original building art is retained.
This compares architecture without an unrelated full-city edge network.

| View | Procedural control | Modular district |
| --- | --- | --- |
| Overview | [Before](screenshots/milestone-b/procedural-overview.jpg) | [After](screenshots/milestone-b/units-overview.jpg) |
| Medium | [Before](screenshots/milestone-b/procedural-medium.jpg) | [After](screenshots/milestone-b/units-medium.jpg) |
| Selected building | [Before](screenshots/milestone-b/procedural-selected.jpg) | [After](screenshots/milestone-b/units-selected.jpg) |

Also: [two actual skywalks](screenshots/milestone-b/selected-skywalks.jpg),
[404 fallback](screenshots/milestone-b/asset-404-fallback.jpg),
[matched-camera records; initial timings superseded](screenshots/milestone-b/measurements.json).

## Load and performance measurements — foreground rerun

The earlier in-app-browser 1 FPS readings are superseded. On 22 November
2026, nine measured **native Chrome 157** camera traversals completed in a
maximized foreground window: three procedural Medium, three modular Medium
and three modular Low runs, each approximately 12 seconds. One initial path
warm-up per scene was excluded; Low followed the already warmed modular scene.
Every measured frame passed both `document.visibilityState === 'visible'`
and `document.hasFocus()`. No runs were minimized or lost focus.

The renderer reported **ANGLE / Microsoft Basic Render Driver / Direct3D11**.
This is the Windows software-rendering path, not a hardware-GPU benchmark;
see [Microsoft's WARP documentation](https://learn.microsoft.com/en-us/windows/win32/direct3darticles/directx-warp).
These are valid repeatable measurements of this environment, not evidence
of performance on a representative hardware-accelerated desktop. Hardware
acceleration settings were not changed. CPU model and physical RAM could not
be verified through the sandbox's system-information interface.

The browser viewport stayed **1536 × 791 CSS pixels**. Medium rendered at
**956 × 505**, pixel ratio 1; Low at **717 × 378**, pixel ratio 0.75. Camera
path, graph snapshot, selected file and window size were the same. The
benchmark's own recorder sampled frame intervals and renderer counters;
result inspection and JSON downloads occurred after timing ended. A running-
state observation occurred immediately after each start. The control's JSON
panel was expanded during its runs; the modular panel was collapsed because
Chrome accessibility reads were intermittent. Neither changes the WebGL
canvas dimensions, but the DOM-compositing difference is a protocol limitation.
Other applications were not closed, so this is not a controlled lab benchmark.

Values below are **medians of three run-level values**; P95/P99 are medians
of each run's percentile, not pooled percentiles. Worst frame is the largest
observed interval across the three runs.

| Metric | Procedural Medium | Modular Medium | Modular Low |
| --- | ---: | ---: | ---: |
| FPS, median | **30.4** | **10.3** | **12.6** |
| FPS range | 30.4–31.6 | 10.0–10.3 | 12.5–12.7 |
| P50 frame interval | 32.0 ms | 97.3 ms | 79.3 ms |
| P95 frame interval | 40.6 ms | 116.1 ms | 91.1 ms |
| P99 frame interval | 50.7 ms | 138.0 ms | 107.5 ms |
| Worst observed frame | 79.7 ms | 157.1 ms | 134.9 ms |
| Draw calls | 44 | 65 | 65 |
| Rendered triangles, representative frame | 6,098 | 287,864 | 287,864 |
| Renderer geometries | 17 | 30 | 30 |
| Renderer textures | 3 | 8 | 8 |

The modular district is about **66% slower in FPS** than the procedural
control here; Low improves modular FPS by about **22%**, but is still below
30 FPS. The art submits roughly **47 times** as many triangles as the control.
Low currently changes resolution and shadows, **not geometry detail**. These
measurements do not establish the exact bottleneck without CPU/GPU profiling.
The 30/60 FPS targets are **not met in this software-rendered environment**.

On the measured modular page reload, the first model/district render was
submitted at **2,246 ms from navigation**, with **358 ms** synchronous scene
construction shown in diagnostics. First model and completed district coincide
because assembly is attached atomically. This is one local reload observation
after earlier kit loads, not a three-load median, cold-network test, actual
first-pixel timestamp or GPU-completion measurement. The earlier 2,523 ms
throttled observation is not the current load-time figure.

Evidence: [all nine raw runs and aggregation](screenshots/milestone-b/foreground-benchmarks.json),
[original modular exports](screenshots/milestone-b/foreground-runs/),
[Medium result capture](screenshots/milestone-b/foreground-units-medium.png),
[Low result capture](screenshots/milestone-b/foreground-units-low.png).
The benchmark now checks foreground state and offers a local JSON download,
so the procedure can be repeated without relying on accessibility text.
Renderer counts are allocations/calls, not GPU-memory bytes. GPU elapsed time
and browser heap were not measured.

Unchanged data-path benchmark on Node v26.13.0: 2,256 modules / 6,598 edges;
warmed median model 26.8 ms, layout 73.6 ms, floors 3.0 ms; process peak 154.4 MB.
This does not benchmark browser rendering.

## Known defects and criteria not yet met

- The native foreground benchmark is complete, but the modular district
  **fails the 30 FPS fallback target on Microsoft Basic Render Driver**.
  Hardware-accelerated acceptance remains outstanding; GPU time/memory are
  unmeasured. A geometry LOD/facade-cost pass is needed before expanding this kit.
- Real trackpad, Firefox and touch testing remain outstanding.
- Small canvas views remain dense, with some neighbouring crowns outside the
  selected-building frame. District signs use distance-dependent legibility;
  the exact directory labels/inspector provide the readable source hierarchy.
- Skywalk clearance is a bounded heuristic, not a general obstacle/path solver.
- This is one architectural showcase for review, not the completed artistic
  redesign. Three-volunteer usability review and final aesthetic approval are
  outstanding. Stop here at Milestone B; Milestones C–E are not implemented.
