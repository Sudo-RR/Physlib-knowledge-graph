# Physlib Knowledge Graph

Milestone C.3's architectural candidate is available at `?visual=c3`, with C.2
retained at `?visual=c2`. Technical checks and comparison performance gates pass;
world-scale artistic acceptance remains incomplete. See the
[C.3 report and actual comparison screenshots](docs/city-milestone-c3.md).

Milestone C.2's chromatic boroughs are available at `?visual=c2`.
The persistent directory colour registry, civic compositions and Explore mode
remain opt-in pending external artistic approval. See the
[C.2 report, matched screenshots and controlled benchmarks](docs/city-milestone-c2.md).

Milestone C.1's atomic courtyard architecture is available at
`?visual=c1&node=Physlib.Units.ISQDimensionBase`. It remains opt-in pending
artistic review and resolution of the measured software-rendering regression.
See [concepts, captures, tests and controlled measurements](docs/city-milestone-c1.md).

Milestone A's optional imported-building smoke test is available at
`?assetFixture=kenney-tower&node=Physlib.Units.ISQDimensionBase&metrics=1`.
The current default is the Milestone C geographic surface. See [the implementation and QA report](docs/city-milestone-a.md)
and [asset provenance](THIRD_PARTY_ASSETS.md).

Milestone B's opt-in Units district is available at
`?district=units&node=Physlib.Units.ISQDimensionBase&metrics=1`.
Use `district=procedural` for the matched procedural control. The preview
preserves all source placements; selecting an outside file restores surrounding
context. [Milestone B report and comparisons](docs/city-milestone-b.md).

An experimental descriptive browser for [Physlib](https://github.com/leanprover-community/physlib): find modules, explore direct imports and importers, and follow links from API maps to the files they reference. The generated snapshot records the exact source commit and timestamp.

Open the [live city](https://sudo-rr.github.io/Physlib-knowledge-graph/). It includes `Physlib`, `PhyslibAlpha` and `QuantumInfo`, and the Mathlib modules they directly import. Search or browse the folder tree to focus a file and select a floor to inspect the available information. Drag or use two fingers on a trackpad to pan; pinch or use the zoom buttons to zoom. A mouse wheel can zoom, and right-drag rotates the view within a limited range. W/A/S/D and the directional controls also move the camera. Use **Overview** to return to the surface geography and **Explore Mathlib below** to enter the underground layer. Selecting a Mathlib file also opens that layer. Hover over a building to identify it. The back and forward controls retrace file selections; **Return to start** restores the initial view. Press `/` to search and Enter to open the first match. The 3D city requires a WebGL-capable browser.

The landing overview shows three repository-derived boroughs separated by two rivers. Actual source directories form spacious wedge-inspired districts, with recursive parcels, connected civic streets and reserved infrastructure corridors. The geographic map uses the same placement manifest. The former radial layout is available at `?layout=legacy`.
