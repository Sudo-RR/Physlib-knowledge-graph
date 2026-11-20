# Layered city pilot

This is a bounded, read-only module-import view, based on the validated Physlib, pinned Mathlib and bridge snapshots. Physlib files occupy the upper layer and Mathlib files the lower layer. Each building is a module, not a theorem. The review slice includes the Physlib gradient and Euler–Lagrange files when present, their direct local imports, classical-mechanics files that directly import the Physlib gradient, and the Mathlib files directly imported by those selected Physlib files. A Mathlib module is shown once, even if multiple Physlib files import it. Optional, locally generated declaration snapshots can be inspected from the sidebar, but do not change the meaning of the city arrows.

The explorer uses actual source directory paths. Selecting a folder focuses its area; selecting a file in the explorer or city updates both the selection and inspector. The 3D and top-down views share the selection. Districts group the first three path components (or the complete parent path if shorter), while file positions inside each district are a simple grid. This is a directory layout, not a mathematical clustering or proof ordering.

Building height increases logarithmically with the number of distinct recorded declarations from matching snapshots; it is not a measure of quality or importance. Up to 12 visible floors divide the recorded declarations evenly, so a floor can group several declarations. Select a building, then click a floor or choose it in the inspector to see the recorded names. Indexed coverage can be partial: the height is based only on what was recorded. A pale placeholder means no declarations were recorded or data is unavailable, not that the file is empty. Mathlib floor counts represent only Mathlib declarations linked by the pilot, not a complete Mathlib index. These optional snapshots are not currently produced by the publication workflow.

Select a building or file to show only its direct imports within the displayed set. Solid arrows point from importer to imported file. When optional declaration pilot data is present, selecting a declaration replaces these arrows with dashed lines between displayed modules containing recorded declaration relationships; these are partial and may be routed. The inspector reports the number of displayed module pairs and lists the recorded declarations, including those outside the city slice. The inspector links imports to their source lines, API maps where available, and the full module view. No declaration-use or theorem-proof edge is inferred from a file import. District labels are suppressed when they overlap; zoom or select a folder for more detail.

The browser uses Three.js and OrbitControls; bundling is performed by esbuild at build time. `npm ci && npm run build:city` generates the ignored `site/assets/city-bundle.js`, which the Pages workflow includes in its artifact. Run the local data and Mathlib build steps in the README first. For visual and interaction inspiration, see [Strata](https://github.com/themonk911/strata), whose source is not included here.

## Declaration extraction investigation

The existing [lean-vouch pilot](lean-vouch-pilot.md) records partial relationships for nine Euler–Lagrange declarations and does not cover most theorem-proof dependencies. The city does not reinterpret these records as complete.

Two other candidates are being compared against Physlib revision `4e2182f2b6f0a54207a2fa62002c264217f875d6`, its pinned Mathlib revision `56a005855ea17e0b0958f73ec801ae140b0a1679`, and Lean `v4.35.0`:

- [result-graph](https://github.com/PierreSenellart/result-graph) revision `2ee55ff6e521eabe71ecddac797e12f64448a5b6` built using the matching toolchain. Its default scope excludes dependency declarations; a pilot must pass `--include-prefix Mathlib.Analysis.Calculus` or another deliberate scope to include cross-library edges. Its source records edges from dependency to dependent, which must be normalized if adapted to this project's importer-to-dependency convention. Its default handling contracts excluded private/generated declarations, so apparent directness requires particular care.
- [lean-graph](https://github.com/aurasoph/lean-graph) revision `3bf57c70f0326e45b9e84345c8fe7cf520919358` pins Lean `v4.29.0`. Building its CLI with Physlib's `v4.35.0` and matching `Cli` dependency required experimental type annotations for three loop variables in the isolated research checkout. The modified tool is not a tested upstream release or a production dependency. Its output modes and filtering require separate evaluation.

Both extractors inspect elaborated information but make different choices about scope, compiler-generated declarations and filtered edges. Neither has yet been integrated into the publication pipeline. A production adapter must preserve the tool version, exact revisions, edge direction and kind, explicit versus contracted relationships, source-location semantics and coverage. It must be tested on known cross-library declarations before the UI calls an edge theorem usage.

### Local result-graph observation

An Euler–Lagrange extraction using `--root Physlib.ClassicalMechanics.EulerLagrange --include-prefix Mathlib.Analysis.Calculus` produced 3,581 nodes and 12,564 edges. Among them were nine Physlib declarations and 43 edges from a Mathlib calculus declaration to a Physlib declaration in result-graph's direction. For example, it reports a statement relationship from `ContDiff` to `ClassicalMechanics.euler_lagrange_varGradient`; the latter's source statement mentions `ContDiff`. Its value relationships may include theorem proofs or definition bodies, and default contraction can route edges through hidden declarations. These numbers are from one scoped run, not full Physlib or Mathlib coverage.

`scripts/adapt-result-city.mjs` converts the scoped output to an optional `site/data/city-declarations.json` that the city can show in the inspector when all snapshot revisions and toolchains match. The adapter checks the input hash, supported extractor revision, graph roots, module membership and declared scope. It does **not** run Lean or independently establish provenance: the caller supplies a provenance JSON with `physlibRevision`, `mathlibRevision`, `toolchain`, `extractorRevision`, `rawSha256`, `roots`, and `includedPrefixes`. For example:

```sh
node scripts/adapt-result-city.mjs raw.json site/data/graph.json site/data/mathlib.json provenance.json site/data/city-declarations.json
```

The file is ignored and not produced by the current Pages workflow. A missing, stale or incompatible pilot is not treated as evidence that the file contains no declarations. Automating a reproducible extractor wrapper, complete coverage tests and refresh strategy remains future work.

### Local lean-graph observation

The compatibility-adjusted CLI was run on the same Euler–Lagrange module with `--mode unified --readable --edge-types proof,sig`. It reported writing 210,684 nodes and 4,418,297 edges to a 356 MB NDJSON file, then exited unsuccessfully while attempting a further DOT/Graphviz output. All 210,684 lines in the file parsed as JSON, but the failed exit means the export must not be treated as a validated production artifact. The process reached at least 3.7 GB resident memory on this machine.

An inspection of the output found `ContDiff` as a signature relationship and `gradient` and `contDiff_id` as proof relationships of `ClassicalMechanics.euler_lagrange_varGradient`. It also found `gradient` in the signature of `ClassicalMechanics.eulerLagrangeOp_eq`. These observations agree in broad terms with the result-graph pilot, but different filters, edge semantics and possible routed relationships prevent a claim that their complete outputs are equivalent. Investigate the post-export failure and benchmark a smaller scope before considering automatic refresh.
