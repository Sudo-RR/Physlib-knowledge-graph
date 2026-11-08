# Reference projects and descriptive-layer roadmap

Research snapshot: 8 November 2026. This is a shortlist for evaluation, not a claim that these projects have been tested against Physlib or that their data can be combined without an adapter. Check the exact versions, licenses and toolchain compatibility before reuse.

## Most relevant references

| Project | What it contributes | What to investigate for Physlib |
| --- | --- | --- |
| [lean-vouch](https://github.com/jjeffrey/lean-vouch) | Lean declaration dependency diagrams, statements, docstrings, review marks, notes and change tracking. | Compare its declaration graph output and change model with Physlib's needs. Discuss reuse or a documented export interface with Jonathan Jeffrey. Review marks are attributed judgments, not proof verification. |
| [result-graph](https://github.com/PierreSenellart/result-graph) | Focused declaration graphs with depth caps, uses/used-by views and a simplified result spine. Separates statement and proof dependencies. | Test a small Physlib area and compare extracted edges with lean-vouch; adopt its clear handling of truncated graphs as a design principle. |
| [importGraph](https://github.com/leanprover-community/import-graph) | Lean-aware module import analysis and source-based import extraction. | Compare its direct imports with our current source scanner and consider replacing that scanner, using the project's pinned version. |
| [PhyslibSearch](https://github.com/Kernel-Science/physlibsearch) | Existing Physlib declaration browser and natural-language search API. | Investigate deep links, available API and snapshot/version information before adding another search service. Its README says end-to-end incremental indexing still needs verification. |
| [Loogle](https://github.com/nomeata/loogle) | Search Lean declarations by names and type patterns; supports local Lake projects with matching toolchains. | Test useful Physlib and Mathlib searches and integrate links or a local adapter where practical. |
| [mathlib-network](https://github.com/CloK-Lab/mathlib-network) | Research pipeline for declaration, module and namespace networks; communities and graph metrics. | Test selected metrics and clustering on Physlib; report method, edge types and limitations, rather than treating centrality as scientific importance. |
| [Lean Graph](https://github.com/aurasoph/lean-graph) | Compiled-environment extraction with several dependency categories and a graph explorer. | Compare scope, edge semantics, coverage and compatibility with lean-vouch and result-graph. |
| [Mathlib DuplicateDecls](https://github.com/leanprover-community/mathlib4/blob/master/Mathlib/Tactic/DuplicateDecls.lean) | Finds duplicate theorem/instance types while ignoring some superficial differences. | Run on a bounded sample to surface candidates. It cannot establish the absence of semantic duplicates. |
| [LeanExplore](https://github.com/lean-explore/lean-explore) | Hybrid declaration search combining lexical and semantic retrieval; its local backend documents dependency boosting. | Study its search and evaluation approach. Verify whether its current index covers the Physlib revision of interest. |
| [GitNexus](https://github.com/abhigyanpatwari/GitNexus) | Graph-oriented explorer, search and agent-facing code queries. | Reference for interaction design and future query interfaces. Its published language list does not include Lean; its [license](https://github.com/abhigyanpatwari/GitNexus/blob/main/LICENSE) is PolyForm Noncommercial, so review terms before reusing code. |
| [Strata](https://github.com/themonk911/strata) | MIT-licensed code-city explorer with districts, import relationships and sampled history. | Its current scanner does not document Lean support. Our 2D district proof of concept borrows the idea, not source code; evaluate its layout and rendering as an optional future adapter. |

## References for a later planning layer

- [Lean Blueprint](https://github.com/PatrickMassot/leanblueprint) connects human-written mathematical statements, manually recorded dependencies and Lean declarations. Its dependency and status claims need their own provenance.
- [Verso Blueprint](https://github.com/leanprover/verso-blueprint/blob/v4.35.0/README.md) combines informal exposition with Lean links and can infer certain dependency edges between associated declarations. Evaluate its exported data and Physlib compatibility before choosing a planning format.
- [TheoremGraph](https://arxiv.org/abs/2606.25363) explores matching informal mathematical statements to formal declarations. Its matches are candidates, not proof of equivalence. Relevant to the later book-to-roadmap idea, not a prerequisite for the descriptive layer.

## Additional extensions suggested by the survey

1. **Focused result views.** Show a selected declaration's immediate prerequisites or dependents, with depth and size controls and a clear truncated-result indicator. Offer a simplified view of principal results without hiding the underlying graph.
2. **Typed, explainable edges.** Distinguish file imports, statement dependencies, proof dependencies, API-map references and inferred similarity. Store extractor, revision and location where available. Do not silently combine edges from different methods.
3. **Review and freshness overlays.** Let users inspect a review mark's author and scope, and identify when linked source or dependencies have changed. Keep review status distinct from proof validity. Consider integration with lean-vouch rather than duplicating its review workflow.
4. **Evidence and coverage diagnostics.** Show snapshot SHA, toolchain, extraction time and failed or unresolved references. Compare source imports with Lean-aware extraction on representative samples; expose incomplete extraction.
5. **Search interoperability.** Start with PhyslibSearch and Loogle; link search results to graph nodes and preserve source revisions. Add retrieval techniques only when evaluated on real Physlib tasks.
6. **Navigable paths and impact.** Show paths from a result to a dependency and reverse-dependency neighborhoods; indicate that graph reachability is potential impact, not a guarantee that a change breaks downstream results.
7. **Export and integration contract.** Publish versioned machine-readable node/edge data and stable links so external tools and coding agents can consume the same snapshot. Keep generated observations separate from curated API-map content and later planning records.
8. **Evaluation with contributors.** Build a small set of real navigation and reuse tasks. Measure whether users find the relevant source and whether searches retrieve known relevant declarations, comparing against ordinary text and symbol search.

[CSLibPremiseBench](https://arxiv.org/abs/2605.14549) is a useful caution: its graph-informed reranker did not reliably outperform its stronger lexical-plus-symbol baseline and its labels were source-visible proxies. Graph search should be evaluated, not assumed better.

## Proposed pilot with Jonathan

Choose one manageable API area and pin a Physlib commit and its Lean toolchain. Compare our file imports to importGraph; export declaration data with lean-vouch and, if feasible, result-graph; record coverage, dependency direction, edge semantics and build cost. Join the resulting declarations to existing API-map references, retaining unresolved links. Then try three concrete tasks: explain a declaration's prerequisites, find its reverse dependents, and find existing code relevant to a proposed extension. Agree on an interface based on those results before committing to an extractor or a database.
