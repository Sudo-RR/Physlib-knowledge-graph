# Discovery and website integration

## PhyslibSearch

[PhyslibSearch](https://github.com/Kernel-Science/physlibsearch) documents semantic declaration search, `/search`, `/fetch`, and module endpoints. Its [frontend result type](https://github.com/Kernel-Science/physlibsearch/blob/main/frontend/src/types/index.ts) represents Lean names and module names as arrays of components. The reviewed interface does not document a source commit in each result, so a graph link cannot assume that both services indexed the same Physlib revision. The project's README also describes incomplete QuantumInfo indexing; verify current coverage with its maintainers before relying on it.

The graph accepts `?declaration=<URL-encoded-qualified-name>` and, optionally, `&source_revision=<full-commit-SHA>`. It finds only an exact ID in the current declaration snapshot. A supplied, different revision is rejected; an absent revision produces a warning. A missing result is reported as not indexed, not nonexistent. For example, after the pilot is generated:

```text
?declaration=ClassicalMechanics.eulerLagrangeOp_eq&source_revision=4e2182f2b6f0a54207a2fa62002c264217f875d6
```

This is a receiving interface only: PhyslibSearch has not been modified. Coordinate canonical serialization of component arrays, including escaped and numeric Lean names, and revision metadata with its maintainers before adding a producer link. Do not assume a simple dot join is always lossless.

## Loogle and duplicate candidates

On 11 November 2026, the public [Loogle JSON endpoint](https://github.com/nomeata/loogle#web-service) returned one result for `deriv_add` and 19 for `gradient`; the latter included the `gradient` definition in `Mathlib.Analysis.Calculus.Gradient.Basic`. These are useful leads for the classical-mechanics pilot, but the public service searches its own Mathlib index, not our pinned Physlib snapshot. The API explicitly does not promise a stable response format. Its [local CLI](https://github.com/nomeata/loogle#running-locally) can instead index a chosen compiled module with a matching toolchain, but that has not yet been run here.

[Mathlib's DuplicateDecls](https://github.com/leanprover-community/mathlib4/blob/master/Mathlib/Tactic/DuplicateDecls.lean) compares normalised declaration types and, for definitions, values; it can identify candidates beyond name matches. It ignores certain binder and universe differences and filters aliases. A match is a review lead, not an automatic instruction to merge or delete code. The checker operates on the imported Lean environment, which can include much more than the pilot and can be expensive. Confirm applicability and compare statements, assumptions and source locations before deciding whether an implementation is redundant.

On 11 November 2026, the pinned Physlib `4e2182f2b6f0a54207a2fa62002c264217f875d6` / Lean `v4.35.0` three-file classical-mechanics pilot was loaded together with the pinned Mathlib checker. Its default 200,000 heartbeat limit timed out; raising it to 2,000,000 completed the theorem scan. It reported 528 candidate groups across the **entire imported environment**, not 528 Physlib duplicates. No declaration name containing `ClassicalMechanics` appeared in the output; this name-based check is not proof of novelty or full coverage.

Candidates in supporting Physlib imports included `Lorentz.Vector.eq_of_apply_eq` / `Lorentz.Vector.ext_of_apply` in [RealTensor/Vector/Basic.lean](https://github.com/leanprover-community/physlib/blob/4e2182f2b6f0a54207a2fa62002c264217f875d6/Physlib/Relativity/Tensors/RealTensor/Vector/Basic.lean#L64), and `Space.inner_apply` / `Space.inner_eq_sum` in [Space/Module.lean](https://github.com/leanprover-community/physlib/blob/4e2182f2b6f0a54207a2fa62002c264217f875d6/Physlib/SpaceAndTime/Space/Module.lean#L233). Another group paired `Nat.default_eq_zero` with `Time.default_eq_zero`; distinct names and intended interfaces may be useful even when normalized types coincide. These are **unreviewed candidates**, not recommendations to remove anything. Instances and definitions were not scanned in this run.

The pilot command was a non-module Lean file importing `Mathlib.Tactic.DuplicateDecls` and the three pilot modules, followed by:

```lean
open Lean Mathlib.Tactic.DuplicateDecls
set_option maxHeartbeats 2000000 in
run_meta do logInfo m!"{← lintDuplicateDeclarations .theorems}"
```

Run it with `lake env lean path/to/file.lean` inside the pinned Physlib checkout after building its imports. Results depend on that environment and tool version.

## Physlib website

The [Kernel-Science website repository](https://github.com/Kernel-Science/physlib-website) identifies itself as the Physlib website. Its [`web2` package](https://github.com/Kernel-Science/physlib-website/blob/main/web2/package.json) uses Next.js; its [documentation workflow](https://github.com/Kernel-Science/physlib-website/blob/main/.github/workflows/DocsArtifact.yml) builds Physlib documentation and triggers a Vercel deploy hook. Maintainers should confirm that this is the active deployment path and who owns it.

The smallest integration is a normal link from physlib.io to the independently deployed graph, with both sites displaying snapshot provenance. A subdomain or a route under physlib.io would require coordination over DNS/hosting, asset paths, refresh ownership, availability and accessibility; embedding is another option to evaluate, including keyboard and mobile behavior. No Physlib website or DNS configuration is changed by this repository.
