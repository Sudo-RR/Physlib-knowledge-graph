# Physlib Knowledge Graph

An experimental descriptive browser for [Physlib](https://github.com/leanprover-community/physlib): find modules, explore direct imports and importers, and follow links from API maps to the files they reference. The generated snapshot records the exact source commit and timestamp.

See [reference projects and roadmap](docs/reference-projects.md) for related Lean tools and proposed extensions.

## Run locally

Requires Git and Node.js 20 or newer. No package installation is needed.

```sh
git clone --depth 1 https://github.com/leanprover-community/physlib.git .physlib-source
npm test
npm run build:data
npm run serve
```

Open <http://127.0.0.1:4173>. To use a different clean Physlib checkout or output path, run `node scripts/extract.mjs /path/to/physlib site/data/graph.json`. The checkout must be clean so that the recorded commit accurately identifies the source.

## What the data means

The extractor scans Lean source for explicit import commands, ignoring nested comments. An edge A → B means A explicitly imports B, not that A actually uses a declaration from B. External and unresolved imports are shown together; standard implicit imports are not included. Module and API-map data cover `Physlib`, `PhyslibAlpha`, and `QuantumInfo`, including root modules. Map links are extracted from the `Lean References` section of `API-map.md`; references are file-level, not verified declaration-level links. Missing referenced files are reported in the JSON snapshot. This is a lightweight source scan, not Lean's parser: unusual syntax may be missed. It should be compared with Lean/importGraph before it is treated as an authoritative dependency index.

The overview groups modules by top-level directory and draws cross-area connections with at least two imports. Select an area to explore up to 100 modules, then a module to see up to 24 direct imports and 24 importers, alongside complete lists and linked API maps. Hover on nodes to see their names, and use search to reach modules outside the displayed subset. These directory groups are not algorithmic communities. The viewer does not calculate transitive dependencies or assess duplicate implementations. API-map abstracts retain their original Alpha/review status in the source; follow the source link for full context.

The interface takes inspiration from the navigable dependency diagrams in [lean-vouch](https://github.com/jjeffrey/lean-vouch) and the graph explorer in [GitNexus](https://github.com/abhigyanpatwari/GitNexus). This project does not currently integrate either tool: in particular, its source-scanned file imports are not lean-vouch's elaborated declaration dependencies.

The experimental **Districts** overview borrows the district metaphor from [Strata](https://github.com/themonk911/strata), but is independently implemented as a 2D directory grouping; no Strata source code is included. Select a module to see a color-coded relationship lens: blue importers, orange imports, a black selected file and purple API-map references. Arrows identify direct imports; dashed lines identify map references. External or unresolved imports have a dashed outline. This is not Strata's 3D city, history view, boundary checker, or a determination that an import needs fixing. The accompanying full text lists remain available for keyboard and screen-reader navigation.

## Automatic updates and deployment

The included GitHub Actions workflow checks out the latest Physlib `master`, runs tests, regenerates the snapshot and deploys `site/` to GitHub Pages on pushes, hourly, manually, or on a `physlib-updated` repository dispatch. Enable Pages with **Settings → Pages → Build and deployment → GitHub Actions** in this repository. Scheduling can be delayed; every successful build records the commit actually checked out. The deployment keeps the previous successful snapshot if a build fails. The workflow always builds the latest master, including when a dispatch arrives; it does not trust a supplied SHA. A dispatch requires a separately configured authorized sender and is not enabled on Physlib upstream by this repository alone.

The standalone page can later be linked from physlib.io or integrated into its hosting after coordination with its maintainers. No live Physlib website configuration is changed here.
