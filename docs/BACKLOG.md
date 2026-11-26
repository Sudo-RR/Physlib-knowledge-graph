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
| [#70](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/70) | A4 | Art | Visual acceptance | 67,68,69 |
| [#71](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/71) | I1a | Integration | Initiative schema | — |
| [#72](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/72) | I1b | Integration | Classical Integrability draft | 71 |
| [#73](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/73) | I1c | Integration | Construction-site overlay | 71,72 |
| [#74](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/74) | I2 | Integration | Review/Lean skeleton/PR workflow | 71,72,73 |
| [#75](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/75) | I3 | Integration | PaperView exchange | 71,74 |
| [#76](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/76) | I4 | Integration | Retrieval and agents | 71,74; coordinate 75 |
| [#77](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/77) | I0.1 | Integration | Evidence contracts and coverage | — |
| [#78](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/78) | I0.2 | Integration | Exact API/search citations | 77 |
| [#79](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/79) | I0.3 | Integration | Contributor usability and evidence | — |
| [#80](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/80) | R1 | Operations | Release and recovery | — |

## Ready work
Start [#66](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/66) (art baseline) and [#71](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/71) (initiative schema) independently. [#77](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/77), [#79](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/79) and [#80](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/80) are parallel maintenance work, not gates for the first initiative. I1b/I1c follow the schema; A1/A2 follow baseline, with A3 following A2. No artificial dependency between art and integration.

## Definition of ready and done
Every task links a spec section, declares scope/non-goals and dependencies, and has verifiable acceptance criteria. Report exact source and commit revisions, tests actually run, real browser/visual evidence where applicable, and blockers. A PR is not deployed simply because it is merged; no spec milestone is complete until its acceptance criteria are satisfied. Art approval is human; mathematical approval and verification must be evidence-backed.

Use issue templates for new work and a scoped branch named art/aN-<short-description>, integration/iN-<short-description>, or fix/<short-description>. Reference the issue in the PR and keep historical discussions, avoiding duplicative issues. Do not recreate the old issue plan: docs/issue-plan.json is historical only.
