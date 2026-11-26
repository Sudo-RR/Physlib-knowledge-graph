# Handover — 26 November 2026

This is the review baseline for the independent PhysLib City prototype. Visual iteration is paused for collaborator feedback; no claim of upstream endorsement or partnership. [Open city](https://sudo-rr.github.io/Physlib-knowledge-graph/) · [Architecture](ARCHITECTURE.md) · [Development](DEVELOPMENT.md) · [Backlog](BACKLOG.md).

## Verified review release

| Field | Verified value |
|---|---|
| Application revision | [2c12d5d](https://github.com/Sudo-RR/Physlib-knowledge-graph/commit/2c12d5d21022a09fe9ff50e85195958e8adea569) |
| Production run | [45820966954](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions/runs/45820966954) |
| Build / deploy | Both succeeded, deploy-pages executed |
| Unit tests | 182/182 passed |
| Browser | All eight packaged Chromium phases passed, including map text drag and native declaration navigation |
| PhysLib | `9027e3d7cb78c98452e2154d7e9428b15bae12aa` |
| Mathlib | `fc4f59e577feb1a4956671bc04ac18aaaf8cd842` |
| Lean | `leanprover/lean4:v4.36.0` |
| Result-graph extractor | `2ee55ff6e521eabe71ecddac797e12f64448a5b6` |
| Extraction | [45810885731](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions/runs/45810885731) |

The counts below describe that exact snapshot, not a promise about future upstream heads.

| Coverage | Count |
|---|---:|
| Scoped source modules | 1,635 |
| Source complexes | 435 |
| Visible complexes (81 SharedFoundations excluded) | 354 |
| Visible role buildings | 1,235 |
| Physics subjects / occupied borough regions | 18 / 27 |
| API maps | 44 |
| Local elaborated declarations | 34,995 |
| Scoped result-graph edges | 305,240 |
| External recorded targets | 589 |
| Modules with elaborated/native records | 1,604 |
| Native signatures / ranges / available values | 34,995 / 30,962 / 33,837 |
| Native type / value reference records | 1,164,560 / 2,438,533 |

Result graph 67,402,780 bytes (lazy); native shards 60,914,205 bytes total (lazy module load). Hashes and exact provenance verified by the published companion manifests. Reference counts are not unique graph edges.

Measured review rendering: 1440×864 CSS workspace (96% of 1440×900 viewport), 4320×2592 buffer at DPR 3, full-detail, 1,070,455 initial triangles, 849 initial draw calls, zero measured reduced-motion idle redraws. Macro shows 20 neutral corridors representing 167 of 745 eligible complex edges, 24 of 715 eligible utility routes. These are recorded software Chromium measurements, not hardware performance guarantees.

## Walkthrough for a reviewer
1. Open the city, inspect skyline, switch map, drag, zoom and select a complex.
2. Search HamiltonianMechanics or another source module, inspect role buildings, Mathlib station and source links.
3. Use qualified declaration search and inspect native type/value references. Distinguish exact direct refs from scoped graph edges.
4. Browse API maps and explicit TODO passages; cited locations can be highlighted without claiming coverage.
5. Review [art scope](ART-ROADMAP.md) and [future integration](INTEGRATION-ROADMAP.md).

## Known limitations
- Review is not proof of visual acceptance: human feedback remains open (#70). Dense small labels/buildings and approximate overlay depth can still affect legibility. Corridors are conceptual aggregates, not road-routed or collision-checked.
- Source scanner and lexical role classification are partial/heuristic. Full Mathlib is not rendered; external graph targets are scoped. Native metadata is available only for matching extraction and recorded values/ranges.
- API-map citation resolution is file-level plus parsed named references, not verified exact claim-to-declaration resolution. TODO reconciliation, structured query database, construction-site initiative lifecycle, PaperView exchange and RAG/agents are not implemented.
- Publication skips a superseded upstream revision; green CI alone does not mean live release (#80). Never disable freshness or provenance checks. See [runbook](DEVELOPMENT.md).
- Project-wide licence grant is not present in the repository; preserve third-party notices and resolve reuse terms with maintainer before external redistribution.

## Next work (not yet started)
K0 #85 canonical typed data schema, K1 #86 revision-aware ingestion, K2 #78 exact references, K3 #87 analytics, K4 #88 query-driven Macro/Meso/Micro, K5 #89 reconciliation, K6 #71–74 initiatives and K7 #76 retrieval/agents. PaperView exchange #75 is a proposed collaboration boundary; no integration or agreement implied. #77 evidence and #80 release reliability are cross-cutting; #79 usability remains open.

## Historical evidence and maintenance
This handover supersedes the append-only earlier handover and obsolete milestones. [Exact pre-cleanup revision](https://github.com/Sudo-RR/Physlib-knowledge-graph/tree/2c12d5d21022a09fe9ff50e85195958e8adea569) preserves them, including [old handover](https://github.com/Sudo-RR/Physlib-knowledge-graph/blob/2c12d5d21022a09fe9ff50e85195958e8adea569/docs/HANDOVER.md), [branch audit](https://github.com/Sudo-RR/Physlib-knowledge-graph/blob/2c12d5d21022a09fe9ff50e85195958e8adea569/docs/BRANCH-AUDIT-20261125.md) and [historical screenshots/benchmarks](https://github.com/Sudo-RR/Physlib-knowledge-graph/tree/2c12d5d21022a09fe9ff50e85195958e8adea569/docs/screenshots). Cleanup #97 is scoped to documentation, local preview ergonomics and retired maintenance; the verified application baseline is unchanged. A new build of the cleanup commit must pass before calling that commit deployed.
