# Layered city pilot

This is a bounded, read-only module-import view, based on the validated Physlib, pinned Mathlib and bridge snapshots. Physlib files occupy the upper layer and Mathlib files the lower layer. Each equal-sized building is a module, not a theorem. The pilot includes up to 60 alphabetically sorted `Physlib.ClassicalMechanics.*` modules plus `Physlib.Mathematics.Calculus.Gradient` when present, and the Mathlib files directly imported by those selected modules. The visible count reports how many classical-mechanics files were omitted. A Mathlib module is shown once, even if multiple Physlib files import it. An optional, locally generated declaration pilot can be inspected from the sidebar, but does not change the meaning of the city arrows.

Select a building or a list entry to show only its direct connections within the displayed set. An arrow points from importer to imported file. The inspector links each connection to its source import line and links to the full module view. Other imports and importers may exist outside this bounded scene. Equal height does not imply a quality or importance metric. No declaration-use or theorem-proof edge is inferred from a file import. Positions in each layer are alphabetical, not a mathematical clustering or proof ordering.

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
