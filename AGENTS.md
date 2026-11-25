# PhysLib City — repository instructions for coding agents

## Read first
1. [Handover and current architecture](docs/HANDOVER.md).
2. [PhysLib integration roadmap](docs/INTEGRATION-ROADMAP.md).
3. [Art specification and roadmap](docs/ART-ROADMAP.md).
4. [Developer and release runbook](docs/DEVELOPMENT.md).
5. [Production backlog](docs/BACKLOG.md) — start from an open mapped issue; link it in the PR. Do not use the historical issue plan.

These are the current operational documents. Older milestone, Geneva and City v2 specifications are historical design/evidence records; preserve their useful invariants but do not resurrect superseded UI or layouts. Explicit current maintainer direction takes precedence. The repository is Sudo-RR/Physlib-knowledge-graph, default branch master. This is an independent contributor tool, not an official upstream PhysLib workflow.

## Two independent workstreams
- **Integration** owns source identity, provenance, Lean extraction, module ownership, declaration relations, API-map evidence, initiatives, review and publication. Its next milestone is a versioned initiative/work-package model with a Classical Integrability draft.
- **Art** owns appearance, presentation, non-semantic scenery, lighting, motion, camera defaults and static/animated visual signals. Its next milestone is the approved density/colour/beam/no-shadow art direction. Read ART-ROADMAP before renderer changes.
- Treat the mathematical model as a read-only input to the art layer. Do not change IDs, role semantics, dependency types, source snapshot formats or allocation ownership to achieve an art target. Do not change the approved artistic baseline merely to implement integration.
- Use separate branches/worktrees or clearly scoped commits (art/... and integration/... suggested). Avoid parallel edits to the shared renderer glue; coordinate interfaces and merge order. Neither roadmap blocks the other. Cross-cutting fixes must state their impact and preserve the contract.

## Non-negotiable mathematical invariants
- Actual upstream libraries: Physlib, PhyslibAlpha, QuantumInfo. Subject boroughs, complexes and inferred Bourbaki role buildings are derived from source. Decorative objects have no Lean IDs and are not mathematical click targets.
- Exact module ownership is authoritative. Do not join lexical command IDs to qualified elaborated names by fuzzy/short-name matching. Role building placement is explicitly inferred, not proof certification.
- Module imports, scoped/potentially routed result-graph edges and native direct type/value constants are distinct evidence types. Do not label them all direct proofs. Missing ranges, values, edges or review marks mean unavailable or unrecorded, not false, independent or rejected.
- Verify Physlib revision, pinned Mathlib revision, Lean toolchain, extractor revision and hashes for mathematical companions. Never display stale data as current. Mathlib extraction is scoped, not exhaustive.
- API map references are citations, not coverage or completion claims. Preserve explicit TODO passages and source lines; TODO markers are not automatically individual tasks. Proposed initiative data is separately namespaced, explicitly draft until human review, and never part of the canonical existing-source graph. No automatic upstream PRs, approval, verification claims or merges.

## Approved public UI
- Geneva G1 is the source-linked landing page; city-v2.html redirects with query/hash, city-c4.html is historical only. No parallel classical source explorer in the primary UI, no underground Mathlib, no river/geographic labels.
- Dusk-only oblique 3D, full geometry, highest practical resolution (current 3–4x DPR within 12 MP and device limits). Top view is north-up navigation into oblique. Collapsed-by-default resizable overlay sidebar; it must not shrink the city canvas or cover global controls.
- Preserve WASD movement, arrows rotate/zoom in city and pan on map, drag, right/Shift-drag, wheel/pinch, selection, deep links and declaration trail. No unsolicited architecture rewrite. The rejected 6bf872c massing redesign was rolled back; use approved bedda3d architectural baseline as a reference.
- New visual goals are in ART-ROADMAP; don't claim implemented until rendered and reviewed. Colour never implies proof or completion. Use reduced-motion support and non-colour indicators for meaningful state.

## Execution and review
- Read relevant existing code/tests/docs before edits. Prefer small coherent modules and pure tested helpers, no sweeping refactors. Do not edit generated site/data or bundle files as source; regenerate.
- Use Node 22 (CI); run npm ci, npm test, npm run validate:assets, npm run build:city, and applicable real-snapshot checks in DEVELOPMENT.md. Test changed feature with fixtures and actual production data. Browser functional assertions must remain mandatory; screenshots are diagnostic, not substitutes for tests.
- Never weaken freshness, source validation, integrity or browser gates to obtain green CI. Superseded runs must not publish. Don't push another production commit while a previous deploy is validating unless addressing a confirmed blocker. Use branch previews when iterating visuals.
- Use the actual GitHub default branch/ref and current head; avoid force-push, unrelated reversions or changes to upstream. Do not add dependencies without justification, secrets, generated artifacts, third-party assets without license/provenance, or private correspondence.
- End every work package with changed files, exact commit/PR, tests actually run, CI status (queued/running/passed/failed), limitations and next task. Do not equate committed with deployed, or software Chromium timings with measured hardware FPS. Inspect build and deploy jobs and verify the deploy-pages step really executed.
- Maintain HANDOVER.md and the relevant roadmap when milestones genuinely change. Record decisions, blockers and evidence, not speculative progress.
