# Graph snapshot contract, version 1

`site/data/graph.json` is generated from one clean Physlib checkout. `schemaVersion` is `1`; readers must reject unknown versions. Existing version-1 fields retain their meanings. Additive fields may be introduced without changing the version; incompatible changes require a new version and migration. This describes the **implemented** snapshot, not a declaration graph.

```json
{
  "schemaVersion": 1,
  "source": {
    "repository": "https://github.com/leanprover-community/physlib",
    "revision": "<40-character commit SHA>",
    "generatedAt": "2026-11-11T00:00:00.000Z",
    "toolchain": "leanprover/lean4:v4.35.0",
    "extractor": { "name": "physlib-source-scan", "version": "1.1.0" },
    "method": "source-header scan; API-map Lean References"
  },
  "counts": { "modules": 1, "maps": 0, "imports": 1, "unresolvedLocalImports": 0, "externalImports": 1, "unresolvedMapReferences": 0 },
  "modules": [{ "id": "Physlib.Example", "path": "Physlib/Example.lean", "library": "Physlib", "imports": [{ "module": "Mathlib.Example", "line": 8, "kind": "public" }] }],
  "maps": [],
  "unresolvedLocalImports": [],
  "externalImports": [{ "source": "Physlib.Example", "target": "Mathlib.Example", "line": 8 }],
  "unresolvedMapReferences": []
}
```

## Identity and relationships

- A module ID is its source path without `.lean`, with `/` replaced by `.`. IDs are unique **within a snapshot**; they are not guaranteed to survive renames.
- An import record is a directed explicit source reference **from the containing module to `module`**; `line` is one-based, and `kind` records the parsed modifiers. It indicates availability, not actual use of a declaration. The source scanner is not Lean's parser and does not record implicit imports.
- An API map is identified by its repository-relative `path`. Its `references` array lists file paths explicitly found in its `Lean References` section. These are curated source references extracted by a simple scanner, not verified declaration-level links.
- Newer snapshots also include `declarationReferences`, with the cited file path, the literal backtick-delimited name or notation, and a one-based map line. An exact declaration ID is linked only if it is indexed in the cited file. A unique suffix match in that file is shown separately as an **unconfirmed candidate**, since namespaces and incomplete coverage make it uncertain. Unsupported notation, ambiguity and missing coverage remain unresolved; absence of a match does not show that the declaration is absent.
- An import whose target has a Physlib, PhyslibAlpha or QuantumInfo root but is missing from `modules` is listed in `unresolvedLocalImports`. A target outside those roots is listed in `externalImports`; it is not thereby verified to exist. A map path absent from the indexed modules is listed in `unresolvedMapReferences`.
- Diagnostic records identify their source and target. Counts are checked against the data. Missing references are disclosed, not silently dropped or treated as proof of an invalid Physlib build.
- `source.revision` pins the code and API-map text used by the extractor; the toolchain is read from that commit. `generatedAt` is when the snapshot was produced, not the time of the upstream commit. The extractor version identifies our scanner, not Lean itself.

## Validation and evolution

Run `npm run validate:data`. Extraction validates before writing and CI validates again before publishing. The validator checks required metadata, supported schema, unique IDs and paths, import shapes, reference diagnostics and counts; it cannot prove that the source scanner found every import or that a Lean declaration exists. A published snapshot must not be interpreted as reviewed physics or a guarantee of completeness.

The generated `site/data/graph.json` is the machine-readable export. `node scripts/graph-query.mjs site/data/graph.json Physlib.Units.Dimension` prints a node and its direct typed edges with snapshot provenance. `node scripts/diff-snapshots.mjs before.json after.json` compares module IDs, map paths and direct edges; line-number changes are not treated as relationship changes. A rename appears as an addition and removal. Declaration statements are not yet indexed or compared.

Declarations, statement dependencies, proof dependencies, inference, and human review are **not** currently represented. Before adding them, agree with maintainers on their IDs, edge direction, provenance and semantics; do not encode guessed or curated relationships as compiler observations. Keep human review records separate from regenerated observations.
