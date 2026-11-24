# PhysLib City — Geneva programme
Status: architectural direction approved 24 November 2026; implementation pending. Parent #55. Baseline: 325a974, published City v2; 433 complexes at the recorded source snapshot, not a permanent count.

## Objective
A coherent Geneva-inspired metropolis, not a diagram of uniform compounds. Realistic urban morphology, stylised futuristic buildings, truthful mathematical graph. The lake and river topology precede streets, streets precede parcels, parcels precede buildings.

## Roadmap
| Phase | Specification | Issue | Exit gate |
|---|---|---|---|
| G1 | [Masterplan](masterplan.spec.md) | #59 | Approved terrain-only north-up and oblique reference |
| G2 | [Urban fabric](urban-fabric.spec.md) | #60 | Valid connected street graph and polygon blocks |
| G3 | [Urban fabric](urban-fabric.spec.md) | #61 | Full source placement with collision checks |
| G4 | [Rendering](rendering.spec.md) | #62 | Approved skyline, district and waterfront renders |
| G5 | [Release](release.spec.md) | #63 | Actual browser, benchmark and deployment evidence |

G1 → G2 → G3 → G4 → G5. G4 asset prototypes may run in parallel, but not replace G1 review. Existing City v2 remains production; develop new geography on a branch and explicit preview, retain C.4 fallback. Do not switch until reviewed. No implementation commits as part of this specification.

## Cross-cutting work
#49 canonical ontology and coverage; #51 dependency projection; #52 local Mathlib station; #54 navigation; #47 performance and QA; #21 publication resilience; #4/#8/#32/#35/#40 declaration evidence. Do not duplicate them. Existing extraction is partial lexical inventory, not elaborated proof dependencies.

## Source of truth
This programme supersedes the rectangular and seeded point-first layout recommendations in earlier City v2 docs. The mathematical invariants in [design constitution](../city-v2-design.md) remain binding. See [masterplan diagram](masterplan.svg). All dimensions, thresholds and asset choices below are engineering starting points, to be validated rather than claims about actual Geneva. Every issue requires code, tests, source revisions and evidence. Do not mark a visual issue completed merely because compilation succeeds.

## Explicit non-goals
Exact GIS reconstruction, live mapping service, full traffic simulation, interiors, mathematical ontology redesign, underground Mathlib city, invented dependency edges, runtime Lean build, photorealism at the expense of navigation.
