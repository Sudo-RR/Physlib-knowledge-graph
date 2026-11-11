# Import parsing comparison

On 11 November 2026, compared the JavaScript source scanner against Lean's `Lean.parseImports'` on Physlib commit `4e2182f2b6f0a54207a2fa62002c264217f875d6`, Lean `v4.35.0`, and importGraph revision `a41f0e9a4dea23188ea9cc1c41ac9f8bbafe0b93` as pinned in that Physlib manifest. The inspected importGraph `ImportGraph.Imports.FromSource` wrapper calls `Lean.parseImports'` for direct imports; this comparison calls that same Lean core parser directly, not the importGraph executable itself. Both outputs drop `Init` and compare sorted module names, including duplicate names. Modifier visibility, source locations, implicit imports and other parser behavior were not compared.

| Source | Explicit import names matched |
| --- | ---: |
| `Physlib.lean` | 668 |
| `PhyslibAlpha.lean` | 827 |
| `QuantumInfo.lean` | 81 |
| `Physlib/ClassicalMechanics/EulerLagrange.lean` | 4 |
| `Physlib/Units/Dimension.lean` | 2 |
| `PhyslibAlpha/ClassicalMechanics/NortonDome/Basic.lean` | 3 |
| `QuantumInfo/States/Pure/Braket.lean` | 7 |

The whole checkout was then compared: **1,579 files checked, zero differing files** for direct import names. This establishes agreement for this revision, not parser equivalence for future files. Our regex-based scanner handles a subset of Lean syntax and can misinterpret unusual headers; the Lean parser is the stronger long-term source. Further work should compare visibility flags, malformed sources and representative syntax edge cases, then consider an adapter based on the actual importGraph package pinned by Physlib. Do not infer declaration-level use from either tool's import list.

To reproduce with the pinned checkout and its Lean binary on PATH (or set `LEAN_BIN` to the toolchain's `lean` executable):

```sh
npm run compare:imports -- /path/to/physlib --all
```

The helper checks the Lean executable's version against `lean-toolchain` and prints the checkout SHA and manifest's importGraph revision. The toolchain and repository must be installed; no lean-vouch output or build is required.
