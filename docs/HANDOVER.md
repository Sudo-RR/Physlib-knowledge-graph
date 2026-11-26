# PhysLib City — maintainer handover

As of 25 November 2026, baseline commit [5bcffd1](https://github.com/Sudo-RR/Physlib-knowledge-graph/commit/5bcffd14b359790642e8a1d991039459eda204f7). Repository Sudo-RR/Physlib-knowledge-graph, default branch master. [Live city](https://sudo-rr.github.io/Physlib-knowledge-graph/). Project is an independent open-source-facing contributor interface, not an upstream PhysLib replacement.

## Start here
Read [AGENTS.md](../AGENTS.md), [Integration roadmap](INTEGRATION-ROADMAP.md), [Art roadmap](ART-ROADMAP.md) and [Development runbook](DEVELOPMENT.md). These documents supersede stale instructions in earlier milestone specifications for current operation. Current next integration task is K0 canonical schema (see latest section below); I1 schema may proceed in alignment. Art remains independent under the existing roadmap. Coordinate shared renderer glue, do not conflate milestones.

## Active issue tracker
The new [production backlog](BACKLOG.md) maps 17 active issues (two epics, 14 work packages and one shared operations issue) to these specs. All 32 previously open historical issues were retired with replacement links; no discussion was erased. The [branch audit](BRANCH-AUDIT-20261125.md) records exact obsolete branch tips and conditional preservation/deletion; consult actual workflow results before reporting cleanup complete.

## Verified production baseline
[Deployment 45680479487](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions/runs/45680479487), build job 139439385099 and deploy 139442153927 both successful. [Previous deployment 45679274759](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions/runs/45679274759) also successful. 157/157 unit tests; actual packaged Chromium browser regression passed (full-detail/dusk, declaration traversal, native metadata loading, API overlays, evidence, camera navigation, legacy redirect/deep links, research, mobile map). Native extraction [45677319974](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions/runs/45677319974) completed successfully, native full artifact 15053014189.
- PhysLib 7910f51f9129ee4c5829216251c25a3a82042f1e; Mathlib fc4f59e577feb1a4956671bc04ac18aaaf8cd842; Lean leanprover/lean4:v4.36.0; result-graph 2ee55ff6e521eabe71ecddac797e12f64448a5b6.
- 1,634 modules, 434 complexes, 1,478 role buildings, 434 stations, 30 boroughs, 43 API maps; snapshot-specific counts.
- 34,959 elaborated local declarations, 304,781 scoped edges, 589 external Mathlib targets, 1,603 modules with records. Graph 67,292,872 bytes (lazy).
- 34,959 native signatures, 30,926 exact ranges, 33,801 available values, 1,162,808 type references and 2,433,150 value references (reference records, not unique edges); 1,603 module shards, 60,811,582 bytes total, loaded on demand. Native raw graph hash 3281aaa7f132387556181852e4a51701f3daf87af04f85e641e9474f6ee982b0.
- Chromium at 1440x900 viewport: 4242x2079 render buffer, DPR 3, full detail, 1,061,469 overview triangles and 734 draw calls, 0 idle redraws in measured interval. Software renderer results, not physical GPU frame-rate benchmarks.
- Latest user art feedback is specified, not implemented. Current contact/plan shadows may remain. Formalisation initiative schema/editor, construction sites and PaperView integration are not implemented.

## Architecture map
| Layer | Key entry points |
|---|---|
| Source scan | scripts/extract.mjs, scripts/extract-mathlib.mjs, scripts/city-v2-inventory.mjs |
| Canonical grouping and placement | site/city-v2-model.js, site/geneva-production-layout.js, scripts/build-geneva-production.mjs |
| Published mathematical graph | scripts/elaborated-pilot.mjs, scripts/run-elaborated-pilot.mjs, scripts/publish-elaborated.mjs, site/geneva-elaborated.js |
| Native metadata | scripts/native-lean-metadata.lean, scripts/pack-native-metadata.mjs, site/geneva-native-metadata.js |
| Declaration exploration | site/geneva-elaborated-panel.js, site/geneva-declaration-navigation.js, site/geneva-source-inspector.js, site/geneva-declaration-browser.js |
| Contributor and planning | site/geneva-contributor.js, site/geneva-contributor-panel.js, site/geneva-api-maps.js, site/geneva-api-map-panel.js |
| Presentation | site/geneva-g1.js, site/geneva-g1.html, site/geneva-architectural-materials.js, site/geneva-urban-materials.js, site/geneva-civic-render.js, site/geneva-navigation.js |
| Publication | .github/workflows/deploy.yml, .github/workflows/elaborated-pilot.yml, .github/workflows/native-metadata.yml, scripts/package-site.mjs, scripts/smoke-geneva-browser.mjs |

## Data and semantics
Graph JSON contains source imports and API file references; lexical commands are not elaborated identities. Exact module ownership maps to complexes; functional role buildings are inferred, not proof-level joins. PhyslibAlpha, Physlib and QuantumInfo occupy three distinct geographic regions; no public river labels or underground explorer. Decorative towers and infill are not mathematical entities. Source imports and declaration relationships use distinct visual channels; Mathlib stations are surface utility representations. Native references are constants directly present in Lean expressions, not automatically certified proof usage. Scoped result-graph edges may be contracted/routed; absence is not independence. Review/freshness data is evidence, not quality or proof certification. API map parser extracts explicit passages and citations, not inferred completion status.

## Deployment and risks
Pages is static, generated from clean revision-pinned sources; GitHub Actions builds source snapshots and bundles, selects matching successful extraction artifacts, verifies hashes and publishes only fresh revisions. Extraction and website build are decoupled. A new source revision may temporarily have no compatible mathematical companion; explicitly show unavailable. Full graph/metadata are lazy-loaded. Artifact retention is 14 days; scheduled extraction refreshes evidence. Keep no secrets in the browser. A previous stale deployment was correctly blocked when newer commits arrived, and Chromium timeouts were fixed by isolating browser phases; see [deployment reliability](geneva/deployment-reliability.md). No confirmed GPU/mobile touch hardware performance acceptance. Browser smoke is not subjective visual approval.

## Historical references
[Geneva programme](geneva/README.md), [sharp rendering](geneva/sharp-rendering.md), [dusk navigation](geneva/dusk-navigation.md), [city navigation](geneva/city-navigation.md), [declaration navigation](geneva/declaration-navigation.md), [native metadata](geneva/full-native-metadata.md), [API planning](geneva/api-map-planning.md), [published graph](geneva/published-elaborated.md). Older C.4 and G1 studies are reference evidence, not current feature mandates.

## Handoff checklist
Start from master head and current CI, choose art or integration work package, inspect relevant files, build/test branch, capture evidence, submit a scoped commit, verify actual deployment and update handover. Do not make successive speculative production pushes. Record limitations, approvals and open questions. No future initiative is approved just because included in this roadmap.


## Pre-demo milestone
Before sharing externally, verify [prototype legibility](geneva/prototype-legibility.md) in the real deployed city: clear role identities, directional conduits and distinctive Mathlib stations. This is a presentation pass, not full initiative or art-roadmap completion.


## District lighting
Issue #81 (A2.1/A3.1) tracks [district illumination](geneva/district-lighting.md). Separate original palette and batched accent renderer; no canonical source change. Deployment and visual acceptance require actual evidence.


## Top-down borough map
#83 (A2.2) tracks [geometry-derived top-down plan](geneva/topdown-boroughs.md). Shared layout and mesh silhouettes, exclusive buffered parcel envelopes, no new source ownership. CI and visual review pending.


## Unified light blankets
#84 (A3.3) supersedes narrow façade sweeps; see [district lighting](geneva/district-lighting.md). Same palette and roof signals, per-complex phase, broad skin in existing overlay. CI and visual acceptance pending.


## Queryable knowledge base — 26 November 2026
New approved [K0–K7 specification](KNOWLEDGE-BASE.md) and [issue mapping](BACKLOG.md). Start K0 #85, coordinate #77 and #80 for evidence/freshness. K1 #86, K2 #78, K3 #87, K4 #88, K5 #89, K6 #71–74, K7 #76. Existing I3 #75 and I0.3 #79 remain. No implementation yet; existing art and source graph unchanged. Latest validated deployment 0be0a27 (run 45779819262, 169/169 unit tests); graph companion was rejected for incompatible provenance, so fresh compatible extraction remains necessary. Do not treat the historical 5bcffd1 baseline counts as current live graph coverage.


## Immersive workspace
#90 (A1.2/A4) tracks [full-bleed city and persistent search](geneva/immersive-workspace.md). Initial camera closer; Overview restores full fit. Geometry and knowledge-base work unchanged. CI and visual acceptance pending.


## Night terrain
#91 A2.4: [night terrain](geneva/night-terrain.md). Original procedural paving, width-aware roads, animated river in existing overlay, no source/geometry allocation changes. CI/visual acceptance pending.


## Release recovery — 26 November 2026
Skywalk/spacing/role lights [4d1e77f](https://github.com/Sudo-RR/Physlib-knowledge-graph/commit/4d1e77fc307a156b4efacc4088f026fa57e62b29), now mapped to #93 and A2.3/A3.4/A3.5. Terrain PR #92 merged at 8259bea; preview passed 45803288552. Production run [45803762039](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions/runs/45803762039): 176 unit tests passed, all packaged Chromium phases passed, but deploy-pages skipped because source freshness guard rejected built PhysLib 061be5c (current upstream at inspection 9027e3d). A green build is not a deployment. This documentation commit triggers a new production build with current pinned source; keep freshness gate intact. Native extraction run 45810885731 was in progress at inspection; do not claim compatible companion or deployed terrain until verified. No application code change.


## Overview smoke synchronisation
Run [45813173189](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions/runs/45813173189) failed after 176/176 unit passes: software Chromium returned zoom 1.2 after the test waited for any later frame, rather than the reset camera pose (expected 1). Earlier run 45803762039 passed the same assertion. Make the test wait for rendered full-fit zoom, yaw and centre; retain exact assertion and timeout. No renderer/source/provenance changes. Screenshot timeout remains an outstanding diagnostic. Retry production; deployment not yet confirmed.
