# Production backlog and issue-to-spec mapping

Rebaselined 25 November 2026 from verified production 5bcffd1 and handover 65e95f8. GitHub Issues is the active execution tracker, while the two roadmap documents define scope. [All active issues](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues?q=is%3Aissue+is%3Aopen). 32 historical open issues were retired with not-planned/superseded reasons and replacement links; original descriptions and comments remain available. This does not claim that their historical requirements all shipped.

- Art epic [#64](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/64) — [Art specification](ART-ROADMAP.md)
- Integration epic [#65](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/65) — [Integration specification](INTEGRATION-ROADMAP.md)
- Shared operational hardening [#80](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/80) — [Development runbook](DEVELOPMENT.md)

| Issue | Spec ID | Workstream | Work package | Prerequisites |
|---|---|---|---|---|
| [#66](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/66) | A0 | Art | Baseline capture | — |
| [#67](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/67) | A1 | Art | Landing city density | 66 |
| [#68](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/68) | A2 | Art | Shadowless district colours | 66 |
| [#69](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/69) | A3 | Art | Animated beams/static roof lights | 68 |
| [#81](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/81) | A2.1/A3.1 | Art | PaperView-inspired district lighting and façade sweeps | 68/69 shared scope; independent of remaining shadow work |
| [#82](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/82) | A3.2 | Art | Continuous conduits, endpoint colours and Mathlib street beams | 69 shared scope |
| [#83](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/83) | A2.2 | Art | Actual top-down city and irregular borough envelopes | 81 palette; 82 pipe legibility |
| [#84](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/84) | A3.3 | Art | Unified complex-level light blankets | 81 palette; replaces façade sweeps |
| [#90](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/90) | A1.2/A4 | Art | Immersive full-bleed workspace and immediate search | 67/70 refinement; preserve 83/84 |
| [#70](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/70) | A4 | Art | Visual acceptance | 67,68,69 |
| [#71](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/71) | I1a | Integration | Initiative schema | — |
| [#72](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/72) | I1b | Integration | Classical Integrability draft | 71 |
| [#73](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/73) | I1c | Integration | Construction-site overlay | 71,72 |
| [#74](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/74) | I2 | Integration | Review/Lean skeleton/PR workflow | 71,72,73 |
| [#75](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/75) | I3 | Integration | PaperView exchange | 71,74 |
| [#76](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/76) | I4 | Integration | Retrieval and agents | 71,74; coordinate 75 |
| [#77](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/77) | I0.1 | Integration | Evidence contracts and coverage | — |
| [#78](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/78) | I0.2 / K2 | Integration | Exact API/search citations | 77, 85, 86 |
| [#79](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/79) | I0.3 | Integration | Contributor usability and evidence | — |
| [#80](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/80) | R1 | Operations | Release and recovery | — |
| [#91](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/91) | A2.4 | Art | Night terrain, streets and flowing rivers | #68/#70 |
| [#93](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/93) | A2.3/A3.4/A3.5 | Art | District clearance, skywalks and role patterns | #82/#83/#84; acceptance #70 |

## Knowledge-base milestone mapping (26 November 2026)

The [K0–K7 specification](KNOWLEDGE-BASE.md) extends integration epic #65; rows below are authoritative for the next sequence. Existing I-issues retain their history; no duplicates or retired work recreated.

| Milestone | Issue(s) | Work package | Dependencies |
|---|---|---|---|
| [K0](KNOWLEDGE-BASE.md#k0--canonical-schema) | [#85](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/85) | Canonical typed schema | Coordinate #77, #71 |
| [K1](KNOWLEDGE-BASE.md#k1--ingestion-and-publication) | [#86](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/86) | SQLite ingestion and static publication | #85; #77, #80 |
| [K2](KNOWLEDGE-BASE.md#k2--exact-declaration-and-api-map-reference-resolution) | [#78](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/78) (existing I0.2) | Exact declaration/API references | #85, #86, #77 |
| [K3](KNOWLEDGE-BASE.md#k3--query-engine-and-analytics) | [#87](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/87) | Deterministic query engine and analytics | #85, #86, #77; #78 claim joins |
| [K4](KNOWLEDGE-BASE.md#k4--macro-meso-micro-interfaces) | [#88](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/88) | Macro/Meso/Micro interfaces | #86, #78, #87; #79 |
| [K5](KNOWLEDGE-BASE.md#k5--claim-reconciliation) | [#89](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/89) | Claim reconciliation and reusable-result candidates | #86, #78, #87 |
| [K6](KNOWLEDGE-BASE.md#k6--formalisation-initiatives) | [#71](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/71), [#72](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/72), [#73](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/73), [#74](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/74) (I1/I2) | Initiative schema, draft, overlay, workflow | #71 parallel K0; relevant #78/#87/#89 evidence; #88 view adapter |
| [K7](KNOWLEDGE-BASE.md#k7--semantic-retrieval-and-agent-integration) | [#76](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/76) (I4) | Semantic retrieval and agents | K1–K5; K6 review flow; coordinate #75 |

## Ready work
Start #85 (K0 canonical schema) now, coordinate #77 evidence contracts and #80 revision freshness. #71 initiative schema may proceed independently in alignment with K0; pilot/overlay/workflow depend on relevant query and reconciliation evidence as specified above. #79 usability and #75 interoperability remain distinct, coordinated work packages. Art #66–70 and #81–84 remain independent and unchanged. No artificial art gate for integration.

## Definition of ready and done
Every task links a spec section, declares scope/non-goals and dependencies, and has verifiable acceptance criteria. Report exact source and commit revisions, tests actually run, real browser/visual evidence where applicable, and blockers. A PR is not deployed simply because it is merged; no spec milestone is complete until its acceptance criteria are satisfied. Art approval is human; mathematical approval and verification must be evidence-backed.

Use issue templates for new work and a scoped branch named art/aN-<short-description>, integration/iN-<short-description>, or fix/<short-description>. Reference the issue in the PR and keep historical discussions, avoiding duplicative issues. Do not recreate the old issue plan: docs/issue-plan.json is historical only.
