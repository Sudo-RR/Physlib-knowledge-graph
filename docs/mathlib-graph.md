# Mathlib module explorer

The explorer adds Mathlib's modules to the existing tool. An arrow from a Physlib module to a Mathlib module records an explicit source import; Mathlib-to-Mathlib arrows have the same meaning. Select a Mathlib module to inspect its imports, importers and directly importing Physlib modules, or follow a Physlib module's Mathlib import into the explorer. Source links point to the revisions used to generate the data.

## Generate locally

First generate `site/data/graph.json` as described in the README. The clean Physlib checkout must have its pinned Mathlib revision checked out at `.physlib-source/.lake/packages/mathlib`. If that directory is not already populated, clone `https://github.com/leanprover-community/mathlib4.git` into it, then check out the revision printed by:

```sh
node scripts/mathlib-pin.mjs .physlib-source
```

Run `npm run build:mathlib`, then `npm run serve` and choose **Explore Mathlib**. This creates ignored local files `site/data/mathlib.json` and `site/data/mathlib-bridge.json`. Both checkouts must be clean; the extractor verifies the Mathlib revision against Physlib's `lake-manifest.json` and checks their Lean toolchains match. The viewer refuses to combine incompatible snapshots. The regular Physlib explorer remains usable when Mathlib data is absent.

GitHub Actions performs these steps automatically on each refresh. It uses the version Physlib pins, not necessarily Mathlib's latest revision. A failure leaves the previous deployment in place. The workflow can also be run manually on a feature branch to test the build; only the default branch deploys.

## Meaning and limits

This is a source scan of explicit imports, not a Lean declaration dependency graph. An import does not establish that a declaration is used, and implicit imports are not represented. The bridge only covers direct Physlib-to-Mathlib imports; external and unresolved imports are distinguished in the data. Declaration-level Mathlib dependencies and semantic duplicate detection remain future work. The Physlib declaration path and potential-dependents controls use the separately generated, partial declaration snapshot and do not infer breakage.

As a check on one snapshot, the scanner's import names matched Lean's parser for all 8,625 Mathlib modules at revision `56a005855ea17e0b0958f73ec801ae140b0a1679`, pinned by Physlib revision `4e2182f2b6f0a54207a2fa62002c264217f875d6`. This comparison does not prove equivalence for all Lean syntax or validate source positions or import modifiers. To repeat it with a matching Lean toolchain installed, run:

```sh
node scripts/compare-mathlib-imports.mjs .physlib-source/.lake/packages/mathlib site/data/mathlib.json --all
```
