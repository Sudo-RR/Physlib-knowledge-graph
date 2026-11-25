# Lean-aware extraction — first executable pilot

Status: experimental, isolated from production. Issues #4, #7, #8, #32, #35, #40, #49.

## Why result-graph first
The pinned result-graph source (2ee55ff6e521eabe71ecddac797e12f64448a5b6) reads `ConstantInfo.type.getUsedConstants` and `value? (allowOpaque := true)`, removes type mentions from the value-only set and contracts filtered internal nodes. Its arrow goes prerequisite → dependent; our adapter reverses it. Even with --private --auto, internal-detail filtering remains, so directness cannot be asserted. The producer does not export statements or declaration locations; retain nulls instead of guessing. Do not identify a lexical command with an elaborated name by short name.

## Reproducible run
Pinned Physlib 85bb8f5df598f6701be57a70f06e08069e30589c, Lean v4.36.0, Mathlib fc4f59e577feb1a4956671bc04ac18aaaf8cd842. Earlier result-graph evidence used Lean v4.35.0; rebuilding on 4.36 is a compatibility experiment, not a previously proven combination.
Scope: EulerLagrange, HamiltonianMechanics.Basic, HamiltonianMechanics.PoissonBracket, plus Mathlib.Analysis.Calculus targets. Include private and generated companions for better visibility. Do not use --spine or --reduce. The wrapper builds the exact roots, invokes result-graph via lake env, rechecks clean Git revisions and hashes raw output. The independent Actions workflow uploads raw graph, provenance, normalized snapshot, comparison report and GNU time logs (elapsed time, peak RSS). No workflow publishes pilot artifacts to Pages. Manual dispatch repeats the same pins. A failed compilation or missing proof record is evidence to investigate, not an empty successful index.

## Experimental contract
Format physlib-elaborated-pilot, schemaVersion 1 (distinct from the production lexical companion schema). Qualified producer IDs; module and raw kind; explicit partial coverage; source statement/line null. Directed dependencies dependent → prerequisite. Types: statement (potentially routed), theorem-proof-or-routed, value-or-routed. Each records original producer kind and unknown-or-routed directness. External targets remain Mathlib declaration records. Only edges whose dependent is in a pilot root are kept; no claim of complete Mathlib graph. Compare lexical inventory via per-module counts and short-name candidate diagnostics, never inferred ID matches. Artifact output is experimental, not a canonical contract approval.

## Exit gates
1. Clean hosted build and actual extraction on pinned revision; inspect reports and timings.
2. Manually reconcile several known theorem statement and proof references, definition bodies, private/generated cases; quantify coverage gaps; compare the same roots with lean-vouch when toolchain support is verified.
3. Agree stable qualified IDs, source locations, pretty-printed types and direct versus contracted edges. Result-graph's omissions may require a small core Lean environment exporter; do not fill them with fabricated source matches.
4. Expand to one representative subject per bank, then profile full library and Mathlib scope with incremental extraction. Only after acceptance replace or augment production lexical data. Existing City remains unchanged.
