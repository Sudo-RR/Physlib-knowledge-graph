# PhysLib City — Art specification and roadmap

Status: approved direction, implementation pending. 25 November 2026. This roadmap is independent of the [PhysLib integration roadmap](INTEGRATION-ROADMAP.md). Art determines how the city looks and feels; integration determines what the city knows. The current renderer is the source-linked Geneva G1 city, not the historical C.4 or terrain-only study.

Execution tracker: [Art epic #64](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/64) · [Issue-to-spec mapping](BACKLOG.md). A0 #66, A1 #67, A2 #68, A3 #69, A4 #70.

## Art brief
A large, visually strong retro-futuristic metropolis at dusk. The landing view should look expansive and densely built, with little negative space. Preserve the sharp architectural treatment accepted after rollback of the unsuccessful massing redesign (bedda3d). Architecture should remain coherent, not become uniform coloured boxes, needle towers or an empty geography diorama. Colour and light should make neighbourhoods recognisable and the city visibly alive.

### Binding user requirements
- Larger apparent city footprint on the landing page; remove most of the negative space, not merely make existing towers taller.
- Distinct neighbourhood building colours using illuminated accents and animated coloured light beams/sweeps lighting up buildings.
- Static luminous rooftop/cap signals on the top-down navigation view; the top view is made legible by the same district lighting vocabulary.
- Remove **all shadows**, including simulated contact shadows, baked/procedural shadow patches, map offset/drop shadows and any shadow-map path. Lighting may retain material contrast, reflection and emissive definition, but no cast/contact shadow presentation.
- Dusk only, highest practical resolution, full geometry, oblique public 3D; top view strictly a navigable map leading back into the city. Keep collapsible resizable overlay sidebar and existing navigation.
- No change to mathematical semantics, extraction or roadmap priority.

## A0 — Baseline and measurement
Capture the currently deployed city (commit 5bcffd1, deployment 45680479487) in fixed overview, focus, map and mobile poses. Record viewport, DPR, source and renderer revisions, draw calls, triangles, textures, GPU/renderer and idle/interactive behaviour. Keep the accepted architectural model and source placements. Compare actual screenshots, not AI-generated concept renders. Historical approved sharp rendering: bedda3d; rejected massing: 6bf872c. Aesthetic acceptance requires maintainer review, not merely passing CI.

## A1 — Composition and density (first art work package)
- Tighten the default oblique camera composition; use view fitting responsive to aspect ratio, without losing navigation to the entire source city.
- Extend visible skyline and fill unused civic parcels with neutral non-semantic low/mid/high-rise context; balance massing against existing towers. Preserve source positions, building IDs, water, parks, roads, bridges and station/selection accessibility. Keep decorative scenery clearly distinguishable and non-selectable.
- Use collision/clearance checks and deterministic art seed; no indiscriminate grid fill or drastic rescaling of semantic towers. No duplicate or invented semantic structures.
- Measure empty-pixel fraction or occupied projected bounding area on matched viewport captures as a diagnostic; agree final composition visually. Do not set arbitrary acceptance percentages as if user-approved.

## A2 — Shadowless lighting and district identity (can run alongside A1)
- Audit directional shadow flags, shadow maps, contact-shadow geometry/texture functions, SVG offset rectangles and CSS shadow effects used for the city. Remove shadow effects, not surface detail or selection markers.
- Preserve sharp façade textures, anti-aliasing, geometry and practical pixel budget. Tune dusk ambient/emissive exposure for separation between buildings.
- Assign a deterministic district palette by existing subject/neighbourhood identity (library + area where needed); maintain semantic subject colours, add emissive accents rather than replacing mathematical ontology. Candidate families: amber/gold mechanics, cyan/blue quantum, violet/magenta relativity, emerald/teal supporting structures, cool white/silver utility. These are illustrative, not fixed assignments.
- Match palette across 3D roofs/facades and SVG map signals. Reserve existing graph/evidence channel colours for their actual meanings; use shape, label, pattern and intensity as well as colour. Distinguish neutral scenery.

## A3 — Animated lighting and rooftop beacons
- Implement reusable district-colour scan/sweep beams that visibly illuminate building facades in oblique 3D, with stable emissive accents on idle buildings, phase-offset animated highlights across neighbourhoods and stronger selected/related building activation.
- Prefer instanced shared geometry/materials and shader time/phase uniforms, no per-building real-time lights or expensive full-screen bloom requirement. Consider restrained glow via transparent emissive geometry. Use bounded animation workload; stop/suspend when hidden, honour prefers-reduced-motion (static equivalent), avoid strobing and preserve click targets.
- Add persistent static luminous rooftop caps/beacons for semantic buildings in 3D and equivalent static signals in top view. Selected/dependency/API-map states remain distinguishable and do not imply proof or construction status.
- Maintain a read-only overlay interface for future initiative statuses; do not invent new semantic states or implement initiative lifecycle in art work.

## A4 — Visual polish and acceptance
Tune colour balance, beam size/timing, map readability, foreground/background hierarchy and default composition. Capture real packaged-site overview/focus/map/mobile evidence. Test WASD, arrows, map-to-city, zoom/pan, sidebar, filters, declaration travel and all overlays. Verify no shadows, no lost source IDs or click targets, no overlap with controls, no WebGL errors. Record performance tradeoffs on comparable hardware; software CI smoke is not GPU FPS evidence. Obtain maintainer visual approval before promoting major changes. Preserve easy rollback.

## File boundary
Likely art-only implementation modules: site/geneva-architectural-materials.js, site/geneva-urban-materials.js, site/geneva-civic-render.js, new dedicated art/lighting modules and limited view glue in site/geneva-g1.js / .html. Layout ownership, scripts/extract.mjs, elaboration/native metadata, contributor/API-map/initiative schemas and graph publication are outside art scope. If an art geometry manifest is needed, derive it separately from canonical production data and keep non-semantic objects ID-free. Tests and documentation accompany each work package.

## Definition of done
Dense cinematic landing view; less empty space; recognisable coloured neighbourhoods; attractive scan/beam motion in oblique view; static rooftop lights in top view; shadow-free scene; preserved high-resolution full-detail dusk baseline; accessible and functional navigation; no changed mathematical identity or evidence semantics. No task marked done until real rendered evidence and maintainer acceptance. A1–A3 are independent of integration I1, and neither workstream may hold the other hostage.


## Pre-demo clarity pass
See [prototype legibility](geneva/prototype-legibility.md), related #68/#70/#79. This narrowly scoped pass is separate from the full A1–A4 artistic programme; do not mark those issues completed from this pass alone.


## Pre-demo composition and network
See [animated dependency network](geneva/animated-dependency-network.md). This is a focused A1/A3 presentation increment, not full art acceptance.


## City scope
SharedFoundations is an application-generated fallback category, not a recognised physics subject or literal upstream directory. Exclude its complexes, buildings, stations, borough labels and incident visible pipes from the public city and subject list. Preserve canonical source data, exact identities and evidence; source-only records remain inspectable through references. No deletion of upstream files. The projection preserves other city coordinates.
