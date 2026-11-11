# Declaration graph integration: handoff

The existing snapshot describes modules and API-map file references only. It does not contain declarations, proof dependencies, or evidence that an imported declaration is used. The module graph can be generated and explored without a Lean build or lean-vouch.

The current data format, provenance, and query example are in [graph-data-contract.md](graph-data-contract.md). The source scanner's comparison with Lean's import parser is in [import-comparison.md](import-comparison.md). These are separate from declaration extraction.

For a declaration-level pilot, the next integration decision is to agree on a versioned adapter contract based on the actual output available from lean-vouch or another Lean-aware tool. In particular, establish:

- Stable names and source locations for declarations and the revision and toolchain that produced them.
- Whether each edge comes from a declaration's type, proof, or another source, and the direction of that edge.
- How unavailable or external declarations are represented and how source extraction failures are reported.
- How declaration nodes link to modules and to explicit API-map references, without treating a file reference as a verified declaration link.
- How a declaration snapshot is validated and combined with the existing module snapshot only when both refer to the same upstream revision.

Keep proposed declaration fields out of schema version 1 until their meaning is agreed and supported by real output. Declaration-level views, duplicate candidates, proof impact, and review overlays depend on that work; import reachability is not a substitute. Relevant tracked issues include #6–#11, #15–#17 and #26.
