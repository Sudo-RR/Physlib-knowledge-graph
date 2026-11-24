# Milestone C.3 — Atomic civic architecture candidate

**Candidate implemented, technical checks passing, artistic acceptance incomplete.** Open `?visual=c3`; `?visual=c2` remains the unchanged comparison and the default C route is unchanged. The selected-building design and landmark vocabulary improve on C.2, but the independent review still finds the world too plan-like and the campuses insufficiently integrated. This report does not claim a completed artistic transformation or human visual approval. No Milestone D, PaperView ingestion, new mathematics or unrelated ingestion refactor was undertaken.

## C.3a — Baseline and real concepts

Read the C.3 specification and C.2 report, then inspected the colour registry, geographic manifest, architecture renderer, LOD, camera, routes and relevant tests. C.2's dominant visual blocks were continuous opaque parcel colour, broad rectangular garden fields and tiny building masses; its uniformly small landmarks disappeared at zoom-out. These are presentation issues, not graph errors.

Captured fresh C.2 controls: [world](screenshots/milestone-c3/before-world.png), [Physlib](screenshots/milestone-c3/before-physlib.png), [ClassicalMechanics](screenshots/milestone-c3/before-mechanics.png), [Units](screenshots/milestone-c3/before-units.png) and [selected ISQDimensionBase](screenshots/milestone-c3/before-selected.png). The two concepts below are **actual Three.js screenshots**, using the same C.2 camera coordinates, 1536×791 viewport, Medium quality and 956×476 canvas.

| Criterion | Civic Gardens | Space-Age campus |
| --- | --- | --- |
| Actual ClassicalMechanics view | [Gardens](screenshots/milestone-c3/gardens-mechanics.png) | [Space-Age](screenshots/milestone-c3/spaceage-mechanics.png) |
| Actual Units view | [Gardens](screenshots/milestone-c3/gardens-units.png) | [Space-Age](screenshots/milestone-c3/spaceage-units.png) |
| Silhouette | Repeated broad domes; coherent but monotonous | Gateway, ring, observatory and stepped institute are more distinguishable |
| District recognisability | Retains coral/amber address; subdued ground | Retains coral/amber address and adds different civic silhouettes |
| Hierarchy | Same source plots and directories | Same source plots and directories |
| Readability / clutter | Quiet, still very plan-like | Better civic focal points, still weak integration with module clusters |
| Cost | Shared instancing; simpler civic catalog | Shared instancing; additional component batches; final cost measured below |

**Choice: Space-Age.** The differentiated civic vocabulary was stronger than repeated domes. Neither first concept met the whole-metropolis criterion. A bounded correction pass replaced thin fin-like civic forms with broad orbital pavilions, expanded source masses horizontally within their original decorative bounds, added park groves and forecourt detail, and improved district/selected framing. The first concept captures deliberately remain pre-correction evidence. A/B FPS was not recorded at that early stage; the controlled timings below cover the final chosen candidate and C.2, not an invented concept-speed comparison.

Used installed Impeccable new-work and craft playbooks, existing product/design context, an independent screenshot critique and a documenter. The engine was already unavailable from the earlier milestone and was not repeatedly retried or installed. No successful engine, seed or detector command is claimed. The user's specified two-render/implementer-choice workflow governed concept selection.

## C.3b–c — Implementation and invariants

`site/city-metropolis.js` adds a version-1 presentation manifest and a shared civic kit. It consumes C.2's deterministic placement: no canonical module is moved, resized semantically or assigned another address. The existing 39 directory colours and three explicitly synthetic Root Modules addresses are unchanged. A district's size controls available civic dimensions; civic size expresses available geographic space, never theorem importance or proof status.

Four reusable civic forms establish directory focal points: gateway, ring observatory, broad orbital pavilion and stepped institute. Their scale is constrained by the existing forecourt, with larger directories using at most 100×40-unit civic envelopes and a bounded height. Landmark objects remain nonselectable scenery, outside the canonical module raycast collection. Forecourt paths, low planter walls, benches and planting lie within those audited civic envelopes. The C.2 public access and future pipe/skywalk/service bands are preserved exactly.

Module architecture uses broader fixed-envelope masses, stepped crowns, domed pavilion roofs, recessed dark glazing, rounded entrance canopies, columns and planted approaches. The source-line logarithmic height formula, semantic footprints, selection bodies, decorative collision bounds and source floor ranges are retained. Architectural storeys are not Lean source floors. Existing per-directory courts and rotations remain the composition foundation; this is a presentation layer rather than a new source layout.

Ground is less dominant: bounded district tint remains visible, while borders, architectural accents, civic materials and planted areas reinforce address identity. Existing flat green fields become lighter garden ground with **486 additional grove trees** placed only in legal free parks, alongside the existing 112 civic trees. Full-data clearance checks reject inspection-margin, river, approach, landmark and reserved-corridor overlap.

The base architecture and civic forms are cheap persistent distant silhouettes. Medium/near detail uses the existing hysteresis and shader fade system; Low actually omits facade, base-cladding and civic detail geometry. The first candidate failed the Explore performance gate. Profiling showed roughly 102,000–117,000 triangles/frame versus C.2's 59,000–67,000, with small CPU update/submission times. Moving base cladding into the near tier and reducing the civic proxy tessellation brought the final world workload to **74,200–84,436 triangles**. Inspected entrances and roofs remain. Civic detail uses distance/quality filtering; shared geometry/material ownership has an idempotent disposal API and a lifecycle test.

District focus uses a lower, viewport-aware direction and actual parcel/civic height. Selected focus was pulled back after review from approximately 75% to approximately 65% of canvas height; nearby street context is restored. Free navigation, Home, history, Explore drawers and exact source inspection remain available. Normal views hide benchmark/debug overlays. No glowing ground discs or persistent complete dependency graph was introduced.

### Files changed for C.3

- Added `site/city-metropolis.js` and `test/city-metropolis.test.mjs`.
- Extended `site/city-borough-layout.js`, `site/city-chromatic-layout.js`, `site/city-chromatic-art.js`, `site/city-atomic-art.js`, `site/city-atomic-plan.js`, `site/city-rivers.js`, `site/city-scene.js`, `site/city-skywalks.js`, `site/city-geography-map.js` and `site/city.js` for the C.3 flag, presentation, camera and registry inheritance.
- Added `scripts/audit-city-c3.mjs`, `scripts/report-city-c3.mjs`, this report and `docs/screenshots/milestone-c3/` evidence.
- Updated README/provenance links and the existing Impeccable project/design context, with a C.3 surface brief. Earlier uncommitted milestone changes were preserved.

No new external assets, textures, fonts or dependencies were imported. New civic/architectural geometry is original repository code. Existing documented Kenney CC0 licensing and provenance limitations remain unchanged; see [asset ledger](../THIRD_PARTY_ASSETS.md).

## C.3d — Integrity, geometry and navigation checks

**96/96 tests pass**, no skips: [full output](screenshots/milestone-c3/final-tests.txt). Data validation, asset validation, city bundling and static-site packaging pass. Packaging used the existing permission for the disposable output directory. `git diff --check` passes.

Five C.3 tests cover exact C.2 placement/dimension/address/corridor preservation and underground anchors; every submitted module and civic component against its exported AABB for both concepts; real Low geometry reduction and shared-resource disposal; dense/deep/extreme-height fixtures and sampled real dependency routes; and appended-file/new-directory updates. Existing model-loading, cache, source navigation, graph and fallback tests remain passing.

The [full-data audit](screenshots/milestone-c3/layout-audit.json) reports no spatial errors, **12.02-unit** minimum module clearance and **2,350 connected street segments**, one component. All 42 civic centres and 486 grove trees are exported alongside service corridors, skywalk bands and roof docks in [infrastructure.json](screenshots/milestone-c3/infrastructure.json). One appended Units file moved **0/1,579** existing surface anchors. A new-directory fixture retains existing colour addresses and legal geometry; global repacking can move anchors when a new district is added, so absolute no-movement for that case is not claimed.

Exactly **2,256 canonical IDs and 6,598 recorded edges** remain: 669 Physlib, 828 PhyslibAlpha, 82 QuantumInfo and 677 underground Mathlib modules. Both 100-unit rivers and all C.2 borough boundaries remain. Source snapshot SHA-256 values are unchanged:

| Snapshot | SHA-256 |
| --- | --- |
| graph | `40de214ae1760eb45d05b083b87889e895805281a52d860984ef91e1c84f8200` |
| mathlib | `638f9e1fd4b7f01e4a697460f8f0e296ed9602689afa2106b8b53848ecd762f2` |
| mathlib-bridge | `db53d9268d6b7c732dcb20b41a960c29046bd10fdac322c195dd70fd8fd6b331` |

Browser checks confirmed the ISQDimensionBase deep link and pinned source revision, Inspector Floor 2 source lines 52–102, Mathlib.Data.Fintype.Card and previous-selection return, Focus Selected, Home recovery, Explore Files/search to QuantumInfo.States.Pure.Qubit, Explore Inspector and exit. The mini-map retains Units `#efbc29`, matching its registry/breadcrumb/Inspector address. At 640×900 the document width was 625, with no horizontal page overflow.

A packaged `/qa-c3/` subdirectory worked, including the exact floor inspector. Removing only its copied optional Kenney GLB produced **“Modular kit unavailable · procedural Units retained · source inspection available.”** C.3 continued to render and inspect source floors without that optional GLB. C.3's original geometry does not require that asset; this is not a claim that C.3 fetched a missing model. The disposable QA copy was removed. Source/Inspector selection was exercised in the browser; a dedicated new C.3 click-on-decorative-edge test was not performed.

## Controlled performance

Same native foreground Chrome, software **ANGLE / Microsoft Basic Render Driver / D3D11 WARP**. No representative hardware-GPU benchmark was obtained. Three valid 12-second foreground runs per final row, preserving the 20-step/600ms camera protocol. No screenshot capture or concurrent test workload ran during timing. Final rows use the last three valid runs per configuration; earlier candidate/profiling runs remain archived, rather than being mixed into final medians.

World path target `[3555.6859237322847,18,1786.4733260073292]`, radius `5120.18773017449`; selected path uses the same C.2 module-relative target and radius 45. Viewport 1536×791. Standard Medium canvas 956×476, Low 717×357 physical pixels at the same CSS size. Explore has an actual 1536×626 canvas and is compared only against equal-sized Explore. [Repeatable benchmark URLs](screenshots/milestone-c3/benchmark-plan.json), [raw results and gate calculations](screenshots/milestone-c3/benchmarks.json), [complete performance table](screenshots/milestone-c3/performance.md).

| Configuration | FPS | P50 / P95 / P99 ms | Worst ms | Calls | Triangle range | Geometry / textures |
| --- | ---: | --- | ---: | --- | --- | --- |
| C.2 world Medium | 36.5 | 26.0 / 37.0 / 43.8 | 59.6 | 25 | 58,554–67,250 | 33 / 4 |
| C.3 world Medium | 37.3 | 25.7 / 35.5 / 45.3 | 51.8 | 31 | 74,200–84,436 | 37 / 4 |
| C.3 world Low | 47.2 | 20.3 / 26.8 / 33.6 | 63.2 | 31 | 74,220–84,436 | 37 / 4 |
| C.2 Explore Medium | 29.6 | 33.0 / 41.5 / 51.1 | 62.7 | 25 | 58,578–67,250 | 33 / 4 |
| C.3 Explore Medium | 28.4 | 35.2 / 40.8 / 46.4 | 75.7 | 31 | 74,176–84,436 | 25 / 4 |
| C.2 selected orbit | 44.0 | 22.3 / 27.5 / 34.4 | 60.6 | 35–43 | 20,070–21,954 | 40 / 4 |
| C.3 selected orbit | 42.9 | 22.8 / 28.3 / 35.5 | 64.0 | 42–52 | 30,056–31,784 | 43 / 4 |

World **37.3 ≥ 32.85 FPS** and Explore **28.4 ≥ 26.64 FPS** pass the fresh-control 90% gates. Both also clear the historical specification references (34.47 and 25.38). C.2's world runs ranged 34.4–41.9 FPS, so do not interpret the small median world advantage as a robust speedup. Low's distant geometry is already at the shared city tier; its world gain is predominantly reduced resolution. Near-detail geometry reduction is separately tested. Final Explore is about 4% below its fresh C.2 control; selected orbit is about 2.5% below.

Single page-load first-visible/settled markers: C.2 world **1,198/2,403 ms**, C.3 world **1,392/1,878 ms**; C.3 Explore **1,403/1,862 ms**; C.3 selected **1,650/2,164 ms**. These navigation-origin observations are not repeated cold-cache trials. Geometry/texture counts reflect resources instantiated in that page's view history; they are not total source-file counts. Raw phase timings include CPU update, render submission, overlay and optional finish waits; they are not hardware GPU timings.

## Final screenshots and motion

All captures are actual application renders. [Observed camera metadata](screenshots/milestone-c3/capture-metadata.json) records names, URLs, physical dimensions and poses. The matched after images below use **identical absolute C.2 camera coordinates**, FOV, quality, viewport and canvas; the normal focus views separately demonstrate C.3's changed framing.

| View | C.2 before | C.3 matched after | C.3 normal focus |
| --- | --- | --- | --- |
| World | [before](screenshots/milestone-c3/before-world.png) | [matched](screenshots/milestone-c3/after-world-matched.png) | [overview](screenshots/milestone-c3/surface-overview.png) |
| Physlib | [before](screenshots/milestone-c3/before-physlib.png) | [matched](screenshots/milestone-c3/after-physlib-matched.png) | [borough](screenshots/milestone-c3/physlib-borough.png) |
| ClassicalMechanics | [before](screenshots/milestone-c3/before-mechanics.png) | [matched](screenshots/milestone-c3/after-mechanics-matched.png) | [district](screenshots/milestone-c3/classical-mechanics.png) |
| Units | [before](screenshots/milestone-c3/before-units.png) | [matched](screenshots/milestone-c3/after-units-matched.png) | [district](screenshots/milestone-c3/units-district.png) |
| ISQDimensionBase | [before](screenshots/milestone-c3/before-selected.png) | [matched](screenshots/milestone-c3/after-selected-matched.png) | [selected](screenshots/milestone-c3/units-selected.png) |

Additional views: [Explore](screenshots/milestone-c3/explore-selected.png), [river](screenshots/milestone-c3/river-crossing.png), [Mathlib](screenshots/milestone-c3/mathlib-roundtrip.png), [floor source](screenshots/milestone-c3/floor-source.png), [registry map](screenshots/milestone-c3/registry-map.png), [mobile](screenshots/milestone-c3/mobile-selected.png), [Home recovery](screenshots/milestone-c3/home-recovery.png), [packaged fallback](screenshots/milestone-c3/packaged-404.png).

[Timed LOD transition GIF](screenshots/milestone-c3/lod-motion.gif): 24 actual sampled frames over 2.717 seconds during the district-to-selected camera flight. Original frames and timestamps are retained under `motion/`. This is sampled motion evidence, not a 60 FPS video or certification of universal absence of shimmer/popping.

## Independent review and outstanding acceptance

The independent Impeccable review's disposition is **fix**, not artistic approval. Its bounded verdict pass scored:

| Material finding | Verdict |
| --- | --- |
| Built mass / world city identity | Partial: broader source silhouettes, still small against the geographic plots |
| Civic forecourt integration | Partial: additional detail, but an inhabited enclosed centre is not consistently legible |
| Ground and landscape | Partial: groves soften fields; rectangular open areas and row composition remain apparent |
| Far silhouette hierarchy | Partial: civic forms distinguishable, source buildings still collapse at world scale |
| Selected framing | Resolved: approximately 65%, with useful street context |
| Documentation | Resolved in the final narrow review: the report accurately preserves the open visual findings |

**The central world-scale metropolis and district-clustering acceptance criteria are not yet satisfied.** This candidate advances close-up architecture, civic variety and measured performance, but the whole surface can still read as a plan with large civic ornaments. Keep `visual=c3` opt-in. External human visual approval remains pending.

The final narrow reviewer closure confirmed documentation accuracy and retained selected-building craftsmanship after optimisation. It kept findings 1–4 partial and disposition **fix**; it was not a fresh whole-surface artistic pass.

Other limits: no hardware GPU, Firefox, physical touch or trackpad validation; no universal free-camera/path guarantee; grove/detail filtering and the short sampled transition do not establish zero popping across every zoom/quality combination. No new high-quality imported architectural asset was added, and existing provenance limitations remain. No pre-correction A/B FPS measurement was made.

Stop point: C.3 candidate and evidence only. No Milestone D, Mathlib redesign, PaperView integration or new semantic relationships follow automatically.
