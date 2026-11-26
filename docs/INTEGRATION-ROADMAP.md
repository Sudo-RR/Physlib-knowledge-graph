# PhysLib City — PhysLib integration roadmap

Status: 26 November 2026. Independent of [Art roadmap](ART-ROADMAP.md). The mission is an evidence-backed, non-invasive contributor interface that progresses from existing mathematical infrastructure to reviewable formalisation initiatives. It does not replace PhysLib's existing review or API-map culture.

Execution tracker: [Integration epic #65](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/65) · [Issue-to-spec mapping](BACKLOG.md). I1a #71, I1b #72, I1c #73; I2 #74, I3 #75, I4 #76. Cross-cutting #77–#80.

## Current development direction — K0–K7
The [queryable mathematical knowledge-base specification](KNOWLEDGE-BASE.md) defines the next integration sequence. One canonical typed, revision-aware data model, SQLite-first ingestion, deterministic query/analytics, Macro/Meso/Micro city interfaces, claim reconciliation and subsequent initiatives/agents. K0 #85, K1 #86, K2 #78, K3 #87, K4 #88, K5 #89, K6 #71–74 and K7 #76 (see [mapped backlog](BACKLOG.md)). Existing I1–I4 requirements remain; K6/K7 consolidate rather than replace them. Start K0 and freshness/evidence work now; I1a schema may proceed alongside K0. Keep the approved art architecture unchanged.

## Delivered foundation (I0)
Verified review release 2c12d5d (see Handover): source-linked city, module-import graph, lexical command inventory, exact qualified elaborated graph and declaration travel, native signatures/ranges/direct references, Mathlib station/source links, contributor paths, activity/review evidence, research lookup/history and API-map planning overlay. See [handover](HANDOVER.md) for exact snapshot and CI evidence. Retain these features and provenance guarantees.

## I1 — Formalisation initiative schema and construction sites (K6)
Design a separate versioned initiative document format, validate it, and implement read-only city presentation before editor or agent automation.
- Initiative: stable namespaced ID, title, mathematical scope, draft/reviewed status, source revision, evidence/provenance, API-map links, mathematical hierarchy, author/reviewer records where explicitly provided.
- Work package: stable ID, proposed module path/declarations, mathematical statement or specification, acceptance criteria, existing prerequisites (exact module/qualified ID + revision), planned prerequisites (work-package IDs), explicit status, optional assignment/PR/commit/test evidence, unresolved questions.
- Separate existing vs proposed entities; validate exact existing references against the pinned graph, validate planned references, reject dangling IDs and cyclic prerequisite schedules (or explicitly model a co-developed group). Proposed modules may overlap existing paths for extensions, but cannot masquerade as existing declarations. Preserve unresolved items as such; do not invent source proof facts.
- Status vocabulary proposed → reviewed design → skeleton → in progress → verified implementation → merged. Status transitions require attributable evidence; only explicit review can approve design, Lean checks demonstrate compilation of specific code not broad mathematical completeness, and merged requires verified upstream commit plus exact graph identity. A draft may remain a draft indefinitely.
- Render reserved plot/blueprint/scaffold as distinct proposed overlay with links to real prerequisite complexes. Do not insert fake source buildings into the canonical layout. Art workstream owns aesthetics; I1 only needs a clear minimal representation and stable interface.
- Browse/select work packages, filter by initiative, show evidence and blockers, follow dependencies to real city locations. Deep link by initiative/work ID and preserve regular city traversal.
- Initial demonstration: **Classical Integrability (draft)**, based on the revision-pinned Hamiltonian mechanics API map. Candidate topics drawn from explicit TODOs: canonical symplectic form, geometric/coordinate Hamilton equations, Poisson Jacobi, Legendre equivalence, Liouville–Arnold and central-force functional independence. Canonical bracket relations already have candidate Lean implementations at 101e93c; reconcile before proposing new work (K5). Do not assert these are globally unformalised, approved tasks, or assign to contributors. Check existing PhysLib/Mathlib before proposing work. Start with a small reviewed package rather than promise all integrability.
- Exit: schema and tests, one attributable draft with exact/unresolved references, separate proposed overlays, real browser regression, no changed canonical graph.

## I2 — Reviewable authoring and implementation workflow
Add local draft import/export/editor with explicit provenance, revision reconciliation, human review checkpoints, dependency ordering and exportable formalisation plan. Track proposed Lean skeletons, CI results and stacked PR links where supplied/verified; no automated writes to upstream without explicit maintainer approval. Reconcile merged items against current source and keep history. Avoid backend/account requirements until justified; establish collaboration needs first.

## I3 — PaperView interoperability
Propose a non-invasive data exchange contract with PaperView: literature/learning hierarchy → human review → API maps → human review → work packages → Lean skeletons and implementation. Preserve paper identifiers, citations, provenance, versioning and distinction between suggestions and accepted plans. Actual partner API/access/format needs verification and agreement. No claimed existing integration or commitment from collaborators. Use import/export fixtures first.

## I4 — AI-assisted planning and retrieval
Optional retrieval over pinned PhysLib, Mathlib, Lean docs and literature resources, incremental ingestion and exact source links. Keep retrieval/evidence separate from model-generated proposals; agent outputs are drafts pending human review, Lean checks and upstream processes. Aim to identify reusable infrastructure and suggest initiatives, not autonomously assert new mathematical results. RAG/agent architecture is K7, not a prerequisite for I1 schema. Use the shared query/evidence contract and human review gates.

## Cross-cutting obligations
Maintain source compatibility, qualified identities, scoped evidence semantics, lazy loading, CI and deployment freshness. Module imports ≠ proof dependency; direct expression references ≠ certification; API-map TODO ≠ task or missing theorem. Current result-graph Mathlib scope is partial; exact source ranges/values can be unavailable. Expand coverage only with measured evidence. Keep development independently shippable, with small tested commits. Never make art acceptance a blocker for schema/retrieval work or vice versa; coordinate the small shared view adapter.
