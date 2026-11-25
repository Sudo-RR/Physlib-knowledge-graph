# Repository branch audit — 25 November 2026

This is a one-time cleanup of historical working branches, authorised by the repository owner. At baseline 65e95f8, there were 12 non-default branches, master was protected and no open PRs existed. Comparison against master found nine strictly ancestral branches (ahead=0); three divergent branch tips require preservation, including two squash/merged historical PRs and one closed unmerged experiment. The allowlist records exact SHAs. No force updates to master.

| Branch | Tip | Disposition |
|---|---|---|
| codex/city-architecture-clean-20261124 | a4fcb83c34d30ecdfceb012a893012aeef8a2890 | Delete only if ancestor |
| codex/city-dependency-clarity | 95cda3c7e1937a8b122e4fff13ef1ad829a12300 | Preserve exact tip at archive/2026-11-25/codex/city-dependency-clarity before deleting branch |
| codex/city-district-navigation | 4d2bb9929152bbc7da64294b72ba016d45c2a3c3 | Delete only if ancestor |
| codex/city-only-navigation | e95f5b4e00a4026a24aab544a2b546090063df30 | Delete only if ancestor |
| codex/declaration-exploration | e3bec36fc92c2fb6899756348d467776b012d0d1 | Preserve exact tip at archive/2026-11-25/codex/declaration-exploration before deleting branch |
| codex/deploy-full-city | 4f1e2e8b0b66f0a2aba98d5b0b9ec471a1a09d72 | Delete only if ancestor |
| codex/full-city-basement | f382e8f7290c78d4cc715134d7887642dba259e5 | Delete only if ancestor |
| codex/layered-city | 96cfd641c5546331cef026ab486fd544c877f4e5 | Delete only if ancestor |
| codex/mathlib-graph | 9cefa26c8806c623d4802b7761033014b0f47f9a | Delete only if ancestor |
| feature/city-v2-product-visuals | 1d3127eeec4343af12c554eadaf59ecb028ed4ce | Delete only if ancestor |
| feature/city-v2-surface-pilot-20261124 | a89b594c13e625172b21817414a60b9e89c59c5d | Preserve exact tip at archive/2026-11-25/feature/city-v2-surface-pilot-20261124 before deleting branch |
| feature/city-v2-world | d532303ed29b98b03ec2a7b3b2b7b78b71f70abd | Delete only if ancestor |

Divergent evidence: #43 (city-dependency-clarity, merged, 3 unique commits), #31 (declaration-exploration, closed unmerged, 2 unique commits), #56 (surface-pilot, merged, 1 unique commit). These experiments are superseded as active development paths, not declared worthless; archive tags retain full history. No active PR is closed as part of cleanup.

The single-purpose workflow is triggered only by the checked-in dated allowlist on master, checks the default branch, exact SHA, ancestry where applicable and open PR references, verifies archive tag before deletion and uses a ref lease to avoid deleting changed tips. No generic deletion endpoint, scheduled cleanup or credentials stored in repository. Check actual workflow and branch/tag lists to confirm completion; this audit is a plan, not a claim that the remote deletions succeeded. If a branch changed or has an open PR, stop and inspect; never bypass guards. Once verified, the workflow can be retired in a later ordinary maintenance PR, retaining this audit.
