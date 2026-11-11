# Physlib Knowledge Graph

An experimental descriptive browser for [Physlib](https://github.com/leanprover-community/physlib): find modules, explore direct imports and importers, and follow links from API maps to the files they reference. The generated snapshot records the exact source commit and timestamp.

See [reference projects and roadmap](docs/reference-projects.md) for related Lean tools and proposed extensions.
The [graph data contract](docs/graph-data-contract.md) defines the current snapshot and its limits.
An [experimental clustering analysis](docs/module-clustering.md) groups files by shared imports and records the evidence.
The [declaration browser proposal](docs/declaration-browser-proposal.md) documents an experimental lean-vouch adapter and its optional data interface. Automatic publication includes only a three-module declaration pilot; full-library extraction is not yet enabled.
See the [Euler–Lagrange pilot](docs/lean-vouch-pilot.md) for a real Physlib example and the limits of the extracted dependencies.
The [discovery and website notes](docs/discovery-and-website.md) cover search links, duplicate candidates and possible website integration.
The [contributor evaluation protocol](docs/contributor-evaluation.md) provides tasks for testing discovery and accessibility; no sessions are claimed yet.

## Run locally

Requires Git and Node.js 20 or newer. No package installation is needed.

```sh
git clone --depth 1 https://github.com/leanprover-community/physlib.git .physlib-source
npm test
npm run build:data
npm run validate:data
npm run serve
```

Open <http://127.0.0.1:4173>. To use a different clean Physlib checkout or output path, run `node scripts/extract.mjs /path/to/physlib site/data/graph.json`. The checkout must be clean so that the recorded commit accurately identifies the source.

## What the data means

The extractor scans Lean source for explicit import commands, ignoring nested comments. An edge A → B means A explicitly imports B, not that A actually uses a declaration from B. External imports and unresolved local imports are reported separately; standard implicit imports are not included. Module and API-map data cover `Physlib`, `PhyslibAlpha`, and `QuantumInfo`, including root modules. Map links are extracted from the `Lean References` section of `API-map.md`; references are file-level, not verified declaration-level links. Missing referenced files are reported in the JSON snapshot. This is a lightweight source scan, not Lean's parser: unusual syntax may be missed. Its direct import names matched Lean's parser across one complete Physlib checkout; see the [comparison and its limitations](docs/import-comparison.md).

The overview groups modules by top-level directory and draws cross-area connections with at least two imports. Select an area to explore up to 100 modules, then a module to see up to 24 direct imports and 24 importers, alongside complete lists and linked API maps. Browse the directory tree or search to reach modules outside the displayed subset. Module views support filters, shareable links and a shortest import-path search across local modules. These directory groups are not algorithmic communities, and an import path does not demonstrate declaration usage. The viewer does not assess duplicate implementations. API-map abstracts retain their original Alpha/review status in the source; follow the source link for full context.

The interface takes inspiration from the navigable dependency diagrams in [lean-vouch](https://github.com/jjeffrey/lean-vouch) and the graph explorer in [GitNexus](https://github.com/abhigyanpatwari/GitNexus). The optional lean-vouch adapter is experimental and must be run separately; its elaborated declaration dependencies are distinct from the source-scanned file imports. GitNexus is not integrated.

The experimental **Districts** overview borrows the district metaphor from [Strata](https://github.com/themonk911/strata), but is independently implemented as a 2D directory grouping; no Strata source code is included. Select a module to see a color-coded relationship lens: blue importers, orange imports, a black selected file and purple API-map references. Arrows identify direct imports; dashed lines identify map references. External or unresolved imports have a dashed outline. This is not Strata's 3D city, history view, boundary checker, or a determination that an import needs fixing. The accompanying full text lists remain available for keyboard and screen-reader navigation.

## Automatic updates and deployment

The included GitHub Actions workflow checks out Physlib `master` at the start of each build, runs tests, regenerates and validates the snapshot, and deploys `site/` to GitHub Pages on pushes, hourly, manually, or on a `physlib-updated` repository dispatch. It also attempts a pinned lean-vouch extraction for Euler–Lagrange, harmonic oscillator and simple pendulum modules. Declaration coverage remains partial. If Lean setup or declaration extraction fails, the fresh module graph is still published without declaration data, and the inspector reports the failure; inspect the Actions log for details. A malformed supposedly successful declaration snapshot fails validation and blocks publication. Enable Pages with **Settings → Pages → Build and deployment → GitHub Actions** in this repository. Runs are serialized and check both source branches immediately before deployment; if either has advanced, the run fails rather than knowingly publishing stale data. A branch can still advance during deployment, and scheduling can be delayed, so this is not an instantaneous freshness guarantee. The previous successful site remains available if a build fails; its timestamp and revision are displayed, and failure details are in this repository's Actions tab. The workflow builds the latest checkout even when a dispatch arrives; it does not trust a supplied SHA. Manual runs from non-default branches build but cannot deploy.

For a faster refresh, Physlib maintainers could configure a workflow on merges to `master` that sends a `repository_dispatch` event of type `physlib-updated` to this repository, using an appropriately scoped credential stored as a GitHub Actions secret. This requires coordination and an authorized sender; no upstream workflow or credential is configured here. The hourly schedule remains a fallback.

The standalone page can later be linked from physlib.io or integrated into its hosting after coordination with its maintainers. No live Physlib website configuration is changed here.
