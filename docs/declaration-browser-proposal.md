# Declaration browser prototype

This is a **provisional interface for review**. The existing `graph.json` contract remains unchanged. The browser optionally reads `site/data/declarations.json`; the refresh pipeline attempts to generate it for three selected classical-mechanics modules. If extraction fails, the module graph can still be published and the browser reports the failure. If a file is outside the pilot, the browser says declaration data is unavailable rather than implying the file has no declarations.

For a controlled prototype, the companion JSON has this shape:

```json
{
  "schemaVersion": 1,
  "source": {
    "revision": "<same 40-character Physlib commit as graph.json>",
    "toolchain": "<same toolchain as graph.json>",
    "extractor": { "name": "<producer>", "version": "<version>" }
  },
  "coverage": [{ "module": "Physlib.Example", "status": "partial" }],
  "declarations": [{
    "id": "Physlib.Example.example",
    "module": "Physlib.Example",
    "kind": "theorem",
    "statement": null,
    "line": null
  }],
  "dependencies": [{ "from": "Physlib.Example.example", "to": "External.name", "kind": "unspecified" }]
}
```

This example illustrates the shape only; it does not assert that these declarations exist. `id` and dependency endpoints are qualified names. A declaration belongs to an indexed module listed in `coverage`. Coverage is `complete` or `partial`; an omitted module has unavailable coverage. `statement` and one-based source `line` are strings/positive integers or `null` when unavailable. Supported provisional kinds are `definition`, `structure`, `class`, `instance`, `theorem`, `lemma` and `other`; a producer must not fabricate a more specific kind than it can establish.

A dependency points from a declaration to a prerequisite. Its kind is `statement`, `proof` or `unspecified`; use `unspecified` unless the producing tool justifies a distinction. The source must be indexed; the target may be outside the snapshot, in which case it is shown as not indexed. No edge or empty reverse list proves absence of a dependency or use. The interface displays only recorded edges and does not claim whole-library coverage.

The browser rejects mismatched revisions or toolchains and malformed records before use. It lists declarations by file and provides name and kind filters, source links, and a bounded one- or two-edge declaration graph with recorded prerequisites and dependents. Module imports and declaration dependencies have distinct views. API-map references are linked automatically only for exact qualified names in the cited file; unique shortened names are shown as unconfirmed candidates. Stable identities, richer edge provenance and complete coverage semantics require agreement based on real tool output before production integration. Review these choices with Jonathan as part of the pilot; the proposed format may change.

## Experimental lean-vouch adapter

The adapter reads lean-vouch's declaration graph generated from compiled Lean, without copying lean-vouch code into this repository. It currently supports **only** lean-vouch revision `b235856d959bdd7c20df734af35d8bad579d6a4c` (release 0.1.1). Later versions must be inspected and explicitly supported before use. Start with a clean Physlib checkout whose commit and toolchain match the module snapshot, and a clean lean-vouch checkout at that revision. Lake and the matching Lean toolchain must be installed.

```sh
node scripts/run-lean-vouch.mjs .physlib-source site/data/graph.json /path/to/lean-vouch site/data/declarations.json Physlib.ClassicalMechanics.EulerLagrange
```

This builds the requested module and its dependencies, then runs lean-vouch's graph program in the Physlib project and writes the companion snapshot after checking both repositories again. Multiple module names can be supplied. The first build can download dependencies and use substantial time and disk space. Building a Lean project executes its build scripts and initializers; only run this on trusted projects. The module list controls extraction scope; a one-file pilot is not whole-library coverage. The stored provenance includes the pinned lean-vouch revision, source revision, toolchain, roots and SHA-256 of its raw graph. The raw graph does not itself include a Physlib commit, so the wrapper records provenance from the checked-out source rather than inferring it from the graph.

Lean-vouch's `deps` and `uses` are both recorded as `unspecified` dependencies: they cover what lean-vouch reviews, including a theorem's statement and a definition's type and body. **They do not represent all theorem-proof dependencies.** Lean-vouch also looks through or excludes generated helpers and some other declarations. Consequently every covered module is marked `partial`, and an absent declaration or edge does not establish absence of a result or usage. Original kinds and docstrings are retained where supplied; kinds without an exact match are shown as `other`. Lean-vouch does not distinguish the original `lemma` spelling from `theorem` here, and its structure classification does not establish whether a structure was declared as a class.

The lower-level `scripts/adapt-lean-vouch.mjs` accepts an existing graph plus an explicit provenance JSON containing `physlibRevision`, `toolchain`, `vouchRevision` and `graphSha256`. That file is a producer's assertion about the graph, not independent proof of which sources built it; prefer the wrapper for reproducibility.

## Validate, query and compare

The companion snapshot is optional and is not generated by `npm run build:data`. For an experimental snapshot, validate the pair before serving it:

```sh
node scripts/validate-declarations.mjs site/data/graph.json site/data/declarations.json
node scripts/declaration-query.mjs site/data/graph.json site/data/declarations.json 'Qualified.declaration.name'
```

To compare two paired module and declaration snapshots:

```sh
node scripts/diff-declarations.mjs before-graph.json before-declarations.json after-graph.json after-declarations.json
```

The comparison reports added, removed and modified declaration names, statement availability or text changes, recorded edges and per-module coverage changes. It includes both extractor identities and revisions: changes may be due to the producer or coverage rather than Physlib. A rename appears as an addition and removal, not a confirmed rename. Unknown statements remain distinct from empty strings. The tools validate each pair, but cannot establish that an extractor's output or a reported coverage level is correct.
