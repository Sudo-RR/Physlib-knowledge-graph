# AGENTS.md — working agreement

Repository: Sudo-RR/Physlib-knowledge-graph. Default branch: master. Independent read-only companion to upstream PhysLib.

## Read in this order
1. [Current release and handover](docs/HANDOVER.md)
2. [Architecture and source-file map](docs/ARCHITECTURE.md)
3. [Development and release runbook](docs/DEVELOPMENT.md)
4. [Backlog](docs/BACKLOG.md) and the issue for your task.
5. The relevant governing spec: [Art](docs/ART-ROADMAP.md), [Integration](docs/INTEGRATION-ROADMAP.md), [K0–K7](docs/KNOWLEDGE-BASE.md).

Current visual milestone is paused for collaborator review. Do not start additional art changes without a defined issue. Next integration task is K0 #85, then K1 #86; initiative schema #71 may proceed in alignment. Preserve the approved city while building integration. Older notes under docs/geneva are dated records, not competing instructions.

## Source of truth and boundaries
- `site/geneva-g1.js` and `site/geneva-g1.html` are current UI; `scripts/build-geneva-production.mjs` creates the manifest. `site/city-v2-model.js` is still a live model dependency despite its name. See Architecture before removing any legacy file.
- Art is a presentation-only projection. Keep exact source IDs, owner/module relations, canonical positions and evidence independent of art. Decorative objects have no Lean identity. SharedFoundations remains source-only in the visible city.
- Physlib, PhyslibAlpha, QuantumInfo are actual source roots. Role inference is heuristic, not review/proof status. Basic.lean membership is actual module ownership.
- Distinguish lexical inventory, explicit module imports, potentially contracted/routed elaborated graph edges and native direct type/value constant references. Missing values/ranges/review evidence mean unavailable, not false or unproved.
- All cross-artifact joins require matching Physlib revision, Mathlib pin, Lean toolchain, extractor revision and hashes as applicable. Never fuzzy-match lexical command IDs to qualified names; do not silently use stale metadata. Mathlib coverage is scoped, not complete.
- API-map citations and TODOs are not completion claims. Proposed initiatives are separately namespaced and human-reviewed. No automatic upstream PRs, merges, claims of certification or endorsement. Follow upstream contributor policy.
- K0–K7 remains planned: typed revision-aware model, SQLite-first, bounded read-only queries, no guessed equivalence or global declaration rendering. Do not build an agent/vector-store layer before its evidence contracts and query layer.

## Approved UI
Dusk-only full-detail oblique 3D, north-up navigation map, full-bleed workspace and resizable sidebar. Preserve camera controls and deep links, accessibility, motion pause/reduced-motion, source search, role signatures and scoped pipe hierarchy. No underground Mathlib or geographic labels. Keep rendering changes separate from data changes; do not revive historical UI. See Art specification for exact current visual parameters.

## Execution
- Inspect the current head and relevant tests before editing. Prefer small modules/pure helpers; do not rewrite generated files or add dependencies without justification.
- Node 22; `npm ci`, `npm test`, `npm run validate:assets`, `npm run build:city`, applicable real-data validators and Chromium smoke from Development. Preserve negative tests and mandatory functional gates. Screenshots are diagnostic, not a substitute for tests or human visual review.
- Use a scoped branch/PR or explicitly authorised atomic default-branch update. No force-push, unrelated reversions, secrets, private data or unlicensed assets. Do not promote a new feature while a production deployment is validating unless fixing a confirmed blocker.
- Check actual build and deploy jobs; a green run with deploy-pages skipped is NOT published. Keep revision and hash guards. Report exact commit/source/run IDs, tests actually run, blockers and decisions. Software Chromium timings are not hardware FPS.
- Update the issue and relevant governing specification when scope changes; update Handover only when a release is confirmed. No speculative completion status.
