# City v2 — First implementation (24 November 2026)

This document records **implemented work** and explicitly separates it from the approved [design constitution](city-v2-design.md) and [roadmap](city-v2-roadmap.md).

## Entry point

After the branch is merged and deployed: **\`/city-v2.html\`**. The existing C.4 \`/index.html\` remains unchanged. Run \`npm run build:city\` to build the original and v2 JS bundles. The GitHub Pages packager includes a content-addressed v2 bundle.

- Default preview: \`/city-v2.html?area=ClassicalMechanics\`
- Illustration only: \`/city-v2.html?area=ClassicalMechanics&demo=1\`
- The area picker navigates between available physics areas and neutral \`SharedFoundations\`; library provenance remains attached to each complex.

## Implemented

1. **Pure City view model** in \`site/city-v2-model.js\` maps source modules to physics area, source directory complex, four function-based declaration groups (where present), and provisional construction groups (when declaration coverage is missing or incomplete). It stores original module and declaration IDs, line counts, evidence and revision. It does not invent edges or foundational roles. \`Basic.lean\` is identified as a candidate only, not a verified monument.
2. **Surface-only scene** in \`site/city-v2.js\` uses three-dimensional retro-futurist procedural architecture, warm golden-hour lights, distant terrain and ground haze. Four tower silhouettes appear when supported by declaration kinds or when explicitly requested as synthetic demonstration. Unclassified groups appear as scaffolding/construction sites. All scenery is non-semantic.
3. **Two elevated PhysLib channels** render directed grouped inter-complex module imports and imported-by relationships for the selected complex. Import-level evidence is **not** declaration-level use. Selected routes are capped to control clutter; the real complete graph remains in the source data.
4. **One local Math Power Station per complex**. Ground-level cyan conduits aggregate recorded imports from relevant source modules; clicking a station lists unique Mathlib targets and actual importing PhysLib modules. Reused Mathlib targets appear in separate station lists by design. There is no Mathlib underground city.
5. **Keyboard-first camera** with bounded fixed viewing elevation; overhead camera, WASD movement, arrow controls, mouse pick/zoom. Directory/complex and building inspection links to revision-pinned PhysLib source.
6. **Independent preview deployment**, minimal source tests and pull-request CI. C.4 is not replaced.

## Honest limitations / next iteration

- The default deployed module snapshot generally does **not** include full declaration metadata; consequently most or all real buildings are **construction sites**. DEMO mode shows the four final tower types with an explicit synthetic label. This is intentional, not an assertion that PhysLib mathematics is incomplete.
- Area geography is an **irregular local arrangement of directory complexes**, not yet a final geographically accurate, PaperView-inspired all-physics city. Only one area is shown at a time.
- Sky pipes are grouped **inter-complex module imports** and are displayed on selection. A separate typed declaration-level graph requires reliable extraction coverage.
- The first implementation uses procedural objects, not external 3D assets; skyline variety and urban composition need visual QA in an actual browser.
- Mathlib stations have links to recorded target modules, but the diagram does not depict shared Mathlib use across complexes (an agreed compromise).
- Some modules may have no documented Mathlib imports; their station shows an explicit empty state.
- The data and model tests do not establish browser performance or visual acceptance. Do not promote v2 to default until tests, browser screenshots, performance measurement and source drilldown checks pass.

## Verification

\`npm test\` — model and existing tests. \`npm run build:city\` — esbuild both bundles. The new GitHub Actions **City v2 preview checks** workflow validates the branch on pull requests.

## Work tracking

- [Master City v2 epic #55](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/55)
- [Preview #48](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/48)
- [City ontology #49](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/49)
- [Visual archetypes #50](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/50)
- [Elevated dependencies #51](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/51)
- [Math power stations #52](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/52)
