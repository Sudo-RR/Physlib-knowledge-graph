# PhysLib City

A source-linked, interactive city for exploring formalised physics and planning future formalisation in [PhysLib](https://github.com/leanprover-community/physlib). Independent contributor tooling; not an official upstream replacement.

**[Open the live city](https://sudo-rr.github.io/Physlib-knowledge-graph/)** · [GitHub Actions](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions)

Explore subject boroughs and mathematical complexes, module imports, exact qualified Lean declarations, native signatures and direct references, API maps and contributor evidence. The default Geneva-inspired city is dusk-only, full-detail oblique 3D with a top-down navigation map and collapsible resizable sidebar. Mathematical identities and evidence are tied to source revisions; civic scenery has no Lean identity.

## Start here for contributors and agents

| Document | Purpose |
|---|---|
| [AGENTS.md](AGENTS.md) | Binding repository instructions and workstream boundaries |
| [Handover](docs/HANDOVER.md) | Current architecture, validated baseline, limitations and next tasks |
| [Art specification and roadmap](docs/ART-ROADMAP.md) | Separate visual direction: dense skyline, district lighting, animated beams, static roof lights, no shadows |
| [PhysLib integration roadmap](docs/INTEGRATION-ROADMAP.md) | Mathematical data, construction sites, reviewable initiatives and future PaperView interoperability |
| [Development runbook](docs/DEVELOPMENT.md) | Setup, testing, deployment and diagnostics |

The two roadmaps are independent. The art layer consumes the integration model without redefining it. Integration does not wait for visual polish. Next: **I1 — formalisation initiative schema and construction sites** and **A0–A3 — approved art direction**.

## Use the city
WASD moves; arrow keys rotate/zoom in 3D and pan in the map. Drag pans, right/Shift-drag rotates, scroll/pinch zooms. M switches views, I toggles the sidebar, / searches, F focuses, Home resets and Esc clears. Select a coloured building or cyan Mathlib station; neutral scenery is decorative. In the map, click a source building to enter the oblique city. Search qualified declarations and travel through recorded relationships; open native metadata on demand. API-map overlays show cited complexes and explicit TODO passages, not verified completion.

## Development and provenance
Node 22, npm, Git, Three.js and esbuild. Run npm ci, npm test and npm run build:city; follow the [runbook](docs/DEVELOPMENT.md) for actual source snapshots and Chromium tests. The Pages deployment uses exact revision checks and hash-verified lazy mathematical companions. Result-graph relationships can be routed and Mathlib coverage is scoped; native ranges/values may be unavailable. No proof certification is implied by the visualisation.

[Historical Geneva programme](docs/geneva/README.md) and [asset provenance](THIRD_PARTY_ASSETS.md) remain available. city-v2.html redirects to the current city; city-c4.html is a historical fallback/asset fixture, not a second public explorer. Historical milestone documents preserve design decisions but the current handover and roadmaps govern new work.
