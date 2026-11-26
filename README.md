# PhysLib City

**[Explore the live city](https://sudo-rr.github.io/Physlib-knowledge-graph/)** · [Current release and handover](docs/HANDOVER.md) · [Issues](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues) · [Builds](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions)

An independent, source-linked visualisation and contributor interface for [PhysLib](https://github.com/leanprover-community/physlib). Explore formalised physics as a Geneva-inspired city: districts represent physics subjects, complexes group related source modules, buildings represent inferred mathematical roles, and connections represent recorded dependencies. The city is a read-only companion to the existing upstream project, not an official replacement or proof certification system.

## What works today

- Interactive dusk city and north-up navigation map; search, select, zoom and follow source links.
- Physics subject colours, role lighting, hierarchical import corridors and local Mathlib stations.
- Revision-pinned module inventory, API-map passages and citations, qualified Lean declaration navigation, native signatures and direct expression references when compatible extraction is published.
- Contributor activity/review evidence, research search and history; missing evidence remains explicitly unavailable.

The proposed queryable knowledge base, formalisation initiatives and PaperView interoperability are **future work**, not features already delivered.

## Start here

| Reader | Read |
|---|---|
| New collaborator | [Handover](docs/HANDOVER.md), [Architecture](docs/ARCHITECTURE.md) |
| Developer | [Development](docs/DEVELOPMENT.md), [data contract](docs/graph-data-contract.md) |
| Coding agent | [AGENTS.md](AGENTS.md), then [Architecture](docs/ARCHITECTURE.md) |
| Visual designer | [Art specification](docs/ART-ROADMAP.md) |
| Mathematical integration | [Knowledge base K0–K7](docs/KNOWLEDGE-BASE.md), [integration roadmap](docs/INTEGRATION-ROADMAP.md) |
| Next tasks | [Backlog](docs/BACKLOG.md) |

For a complete directory, see [documentation index](docs/README.md).

## Run locally

Node 22, npm and Git; Three.js and esbuild. From the repository root:

```sh
npm ci
npm test
npm run build:city
```

Build the revision-pinned fixture package or real-data package as described in [Development](docs/DEVELOPMENT.md), then `npm run serve` and open http://127.0.0.1:4173. The default server serves the packaged Geneva city. The legacy local explorer is explicitly opt-in with `npm run serve:legacy`.

## Navigation

WASD moves; arrows rotate/zoom in 3D and pan on the map. Drag pans, right/Shift-drag rotates, wheel/pinch zooms. M switches view, I opens the sidebar, / searches, F focuses, Home restores overview, Esc clears selection. Select a source building/station to inspect mathematics. In the map, dragging never selects label text.

## Contributor boundaries

Keep source identities, revision provenance and evidence semantics separate from art. No upstream writes or private correspondence. Read [third-party asset notices](THIRD_PARTY_ASSETS.md); the repository does not currently include a project-wide licence grant, so confirm licensing with the maintainer before redistribution or external reuse. Historical designs and benchmark evidence are preserved at the [pre-handover commit](https://github.com/Sudo-RR/Physlib-knowledge-graph/tree/2c12d5d21022a09fe9ff50e85195958e8adea569); they are not current instructions.
