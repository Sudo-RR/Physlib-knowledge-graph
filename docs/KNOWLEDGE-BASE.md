# Queryable mathematical knowledge base — K0–K7

Status: approved development direction, 26 November 2026. Implementation not yet delivered. Parent [#65](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/65); governed by [integration roadmap](INTEGRATION-ROADMAP.md), [agent instructions](../AGENTS.md) and [backlog](BACKLOG.md). Independent of the approved art workstream.

## Purpose and non-goals

Make formalised mathematics queryable as structured data, with PhysLib City one consumer of a canonical evidence-backed knowledge base. Macro, Meso and Micro are resolutions of the same entities and relationships, not independently curated graphs. Inspired by Axiomatic AI's Riemann Atlas, Quiver and OctoInform, but adapted to an evolving general-purpose physics library and its human-authored API maps. Do not replace the existing city with a global declaration graph or draw all of Mathlib. Preserve visual architecture, navigation, semantic ownership, existing utilities and library boundaries. No upstream writes, claims of partner integration, automatic proof certification or hosted backend requirement.

## Architecture and technical defaults

Pinned PhysLib / PhyslibAlpha / QuantumInfo, exact referenced Mathlib endpoints, Lean environment and API maps → existing extraction artifacts → validated canonical normalisation → SQLite knowledge database → typed deterministic query/analytics layer → static versioned manifests and bounded shards → existing city and future agent clients.

Start with portable SQLite and Python standard library (sqlite3), SQL indexes and recursive CTEs. Python graph algorithms or NetworkX only when demonstrated useful. Provide inspectable programmatic/CLI queries and static exports; browser consumes only required data and runs bounded local queries. GitHub Pages remains static. Do not require a server, Neo4j, vector DB or LangGraph for K0–K4. Evaluate vector retrieval and orchestration in K7; natural-language questions eventually compile to validated typed operations, never unrestricted model-generated execution. These are implementation defaults, not claims of deployed functionality.

## Entity and relationship contract

| Entity | Canonical identity / required evidence |
|---|---|
| Snapshot/revision | PhysLib SHA, Mathlib SHA, Lean toolchain, extractor/schema versions, artifact hashes, extraction scope and timestamps |
| Library and subject | Stable source-root/classification identifiers, revision and explicit classification method |
| Complex and role | Existing complex/role IDs and module ownership; role classification inferred, not elaborated theorem identity |
| Module | Exact module path and name, pinned source, imports, documentation |
| Declaration | Qualified Lean name + snapshot/library identity, owner module, kind, exact type/signature and range if available, value availability; source pointers not fabricated |
| External declaration | Exact recorded external target and module where known; explicit boundary/scope and unavailable metadata |
| API map | Pinned path, abstract, reviewed/Alpha section and source lines |
| Claim passage | Source-span ID, literal prose, explicit TODO/review status, numbered references; finer claim splitting is a proposed annotation until reviewed |
| Citation / literature | Typed numbered Lean or literature citation with exact original reference, source span, resolution state and candidate evidence |
| Initiative / work package | Separate stable proposed namespace; existing and proposed prerequisites, specification, status and evidence, via I1/I2 contract |
| Evidence | Source origin, revision, exact span/qualified ID, method, availability, coverage and attributable review; immutable snapshot records |

Typed directional relations: contains/belongs_to, defines, imports, direct_type_ref, direct_value_ref, scoped_result_relation (including routed/unknown directness), describes, cites, candidate_formalised_by, reviewed_formalised_by, requires_existing, requires_planned, proposes, implements, introduced_in, reviewed_at, extracted_from. Define domain/range, inverse interpretation and deduplication per relation. Keep observed, inferred, candidate and human-reviewed evidence separate. Missing values/ranges/references are unavailable, not false. No equivalence between imports and proof references; no proof-use or completeness inference from a native constant reference. Do not conflate external Mathlib reference coverage with a complete Mathlib dependency graph. Preserve canonical source-only records including SharedFoundations; visibility exclusions are a city projection, not database deletion. Store scene geometry/placement as a separate view adapter.

## Three resolutions of the same data

| Level | Focus | Example operations |
|---|---|---|
| Macro | Library, physics subject, complex | Count and aggregate typed relations across subjects; identify shared infrastructure; trace selected cross-complex paths; report scoped evidence availability |
| Meso | Framework, role, module, API map, claim | Inspect module/role structure and imports; exact cited declarations; candidate TODO reconciliation; prerequisite work packages |
| Micro | Exact declaration | Read type, source and hypotheses; inspect direct type/value refs; bounded transitive paths and reverse reachability; external targets; related statement candidates |

Aggregate only the chosen relation type and snapshot, retaining the underlying IDs and denominators. Deduplicate edges according to the selected grain. Every query result carries revision, relation semantics, direction, filters, scope, missing data and truncation. Macro view stays the city, Meso uses local complex context, Micro uses on-demand declaration inspector/local graph or table. Do not convert every theorem into a tower. Existing city default appearance unchanged.

## K0 — Canonical schema

Tracked by [#85](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/85); coordinate [#77](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/77) and [#71](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/71). Formalise versioned entity/relation/evidence schemas, SQLite logical tables, primary/foreign keys and validation; specify identity/normalisation and snapshot lifecycle. Preserve exact qualified IDs; unresolved, ambiguous, absent and candidate states. Provide fixtures, migration/version policy, integrity tests and mapping from existing extraction contracts. Existing and proposed namespaces remain distinct.

Exit: tested schema and mappings, fixture referential integrity, no canonical source/layout changes.

## K1 — Ingestion and publication

Tracked by [#86](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/86); depends K0, coordinates [#77](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/77), [#80](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/80). Build reproducible read-only SQLite artifacts using matching existing source, graph, native and API-map data; record per-kind counts and coverage, transactionally ingest and publish, reconcile IDs, verify hashes and provenance. Reuse unchanged data only with verified compatible content/dependency fingerprints; build complete snapshots when unsure. Missing companions must stay explicit, never join stale data to a fresh revision. CLI and versioned manifests/static shards, bounded load budgets, immutable artifacts and rollback; record actual size/build time. First refresh extraction when incompatible. No full Mathlib graph requirement.

Exit: actual revision-matched sample plus production-scale ingestion, atomicity/idempotence/incremental fixtures, documented query access and publication/availability.

## K2 — Exact declaration and API-map reference resolution

Reuse [#78](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/78) (I0.2), depends K0/K1 and [#77](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/77). Resolve only with exact module plus elaborated identity; use native types/ranges where available. Preserve citation passage and source link. Distinguish notation, typed instance, short/ambiguous/unresolved names and source revision mismatch; do not guess from lexical commands. External search links only with verified identifier/revision contracts.

Exit: positive/negative resolution fixtures, exact citations on actual map and snapshot, uncertainty and unavailable status visible; no proof or completeness inference.

## K3 — Query engine and analytics

Tracked by [#87](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/87); depends K0/K1 and evidence contracts [#77](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/77), K2 for claim joins. Typed parameterised read-only query operations with budgets, pagination, deterministic output, revision/coverage, direct and bounded transitive paths, reverse impact, cross-subject aggregates, fan-in/out, SCC/cycle handling and depth/longest paths on the condensed DAG. Clearly identify cycle condensation and external boundary; never call longest routed path a proof length. Candidate exact statement duplicate fingerprints only from suitable canonical expression evidence; distinguish syntactic/normalised equality from semantic equivalence. No global unused=dead metric, proof quality score or duplicate removal. Test against independent small graph oracles, actual data counts and runtime/memory.

Exit: reproducible CLI/programmatic queries, evidence and bounded traversal fixtures, measured real-snapshot performance. K3 owns analytics implementation; #77 owns evidence contracts and coverage, not a duplicate query engine.

## K4 — Macro Meso Micro interfaces

Tracked by [#88](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/88); depends K1/K2/K3; coordinate [#79](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/79). Connect shared typed query operations to existing city selection, subject/complex summary, framework/module/API-map details and exact declaration inspector. Provide contextual analytics, local paths and table/text alternatives, stable cross-level navigation and deep links. Lazy bounded publication/client loading, no extra global theorem buildings, palette/layout/massing unchanged. Scope/filter/coverage/truncation visible; missing snapshot graceful. Validate aggregate drill-down, entity identity, existing browser navigation, keyboard/mobile access and real packaged data.

Exit: working query interfaces at all three levels with representative actual-data regression and existing art intact.

## K5 — Claim reconciliation

Tracked by [#89](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/89); depends K1/K2/K3; feeds K6. Surface stale or ambiguous citations and possible already-formalised TODO passages, based on exact types, documented search and dependency evidence. Preserve original text and TODO status, require human review of claim correspondence and bibliography. Start with Hamiltonian mechanics map at 101e93cf91f0304f5ab9bfbfdec6cebcc031f7cd: three canonical coordinate Poisson-bracket lemmas exist while canonical relations and Jacobi are jointly marked TODO. Recheck current revision; do not infer Jacobi is absent globally or mark it proved. Evaluate false positives/misses and reviewable proposals; duplicate candidates are not equivalence proofs or removal instructions.

Exit: reproducible reviewed-or-pending reconciliation report with exact declaration/source evidence, unresolved cases, evaluation and no automatic edits to upstream.

## K6 — Formalisation initiatives

Reuse [#71](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/71) (schema), [#72](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/72) (Classical Integrability pilot), [#73](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/73) (construction sites), [#74](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/74) (review and PR lifecycle); see I1/I2. Design schema in parallel with K0; evidence-backed pilot/reconciliation relies on K2/K3/K5 as relevant. Preserve proposed vs actual identity, existing/planned prerequisites and explicit status gates. Use K4 view/query adapter for construction sites, not a redesign. Human author/reviewer accountable for all mathematics, references and communication. No sorry-bearing code submitted upstream; any local skeleton/spec must be clearly draft and follow applicable upstream policy. Preserve paper/API-map evidence and support future PaperView exchange [#75](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/75); no actual integration without agreement.

Exit: versioned initiative fixtures and validation, one small evidence-backed draft, distinct proposed visualisation, local reviewable export, status history and verified merge reconciliation.

## K7 — Semantic retrieval and agent integration

Reuse [#76](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/76) (I4), coordinate [#75](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/75); depends on validated K1–K5 query/evidence contracts and K6 human workflow for initiative actions. Evaluate existing search (PhyslibSearch, Loogle and suitable external services) before new infrastructure. Retrieval over pinned PhysLib, Mathlib, Lean docs and authorised resources; vector search optional secondary index, exact source citations and reproducible benchmark with false positives/misses. Incremental refresh, structured query translation with allowlisted operations, candidate explanations and proposals separated from verified source; no autonomous certification or upstream PR/reviewer communication. Evaluate LangGraph only if orchestration warrants it.

Exit: measured evidence-grounded retrieval, query and agent fixtures with review gates; no fabricated dependencies, no automatic writes.

## Execution sequence

K0 → K1 → K2/K3 → K4 and K5 → K6 → K7. K2 and K3 may progress in parallel after shared schema/ingestion contracts; K3 claim joins require K2. K6 schema (#71) may start alongside K0; actual initiative acceptance requires relevant reconciled evidence. #77 evidence hardening and #80 refresh/recovery are parallel prerequisites/support; #79 usability coordinates K4; #75 PaperView contract remains distinct. Art remains independent. All work packages open until their acceptance criteria pass; no new functional implementation claimed in this specification commit.
