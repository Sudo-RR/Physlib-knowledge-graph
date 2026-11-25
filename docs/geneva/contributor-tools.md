# Contributor tools: explicit import paths and API-map discovery

Production Geneva inspector, issues #9, #13, #25, #54. Independent of elaborated declaration extraction.

The manifest includes a revision-matched contributor index of every source module, exact import line and kind, and API-map file references. Existing indexed maps are linked by explicit references only, never inferred from directory proximity or lexical declaration names. Unresolved citations remain visible. Source links point at the exact source commit.

The inspector exposes bounded breadth-first search on the **module** graph. Shortest paths preserve individual import evidence, rather than combining unrelated imports between complexes. Reverse reachability is potential impact only, not proof of actual declaration use or breakage. Default impact/prerequisite bound: 3 steps, 100 other modules; path bound: 12 steps, 5,000 other modules. Show truncation when a search reaches bounds. External imports remain outside this local traversal. The site records selected complex/building in the URL using replaceState (shareable/reloadable selection, not full history navigation). Cross-subject focus clears an incompatible filter. Hidden subject endpoints do not receive sky links. No geometry or proof extraction changes. Declaration-level resolution/path analysis remains pending.

Tests exercise direct evidence, cycles, reverse traversal, bounds, missing external endpoints and unresolved map references. Browser and contributor evaluation remain outstanding.
