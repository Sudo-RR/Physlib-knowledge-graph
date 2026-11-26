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

## A2.1/A3.1 — PaperView-inspired district lighting
Tracked by [#81](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/81); refinement of A2 (#68) and A3 (#69), acceptance in A4 (#70). Reference: [PaperView concept map](https://paperview.org/roadmap/index.html), using a hierarchical family-colour vocabulary, not copying its exact colours (not verified). This is an original city palette.

- Use one stable hue per physics subject, related subjects grouped into warm mechanics, blue quantum, violet geometry/gravity, coral field/particle and green thermal/statistical families; repeat a subject's colour across libraries. Distinct shades within families; retain labels and exact ownership. Mathlib stays cyan-white diamond/ring; pipe channels unchanged; neutral civic scenery receives no district lighting. SharedFoundations remains excluded.
- Colour is luminous rather than painted: restrained architectural material tint, static roof cap/outline, light band scanning up visible façades. Match the same hue in SVG roof caps and borough labels, with a compact subject-colour key. Top-down map static; no global flicker, no claim of scientific activity or proof status.
- Use deterministic building phase offsets and a smooth periodic scan (about 0.9 cycles/sec versus pipe phase 0.68 cycles/sec). Keep visible constant accents, modest peak intensity and no abrupt strobing. Pause motion/OS reduced motion retain a static colour signal. Pipes on/off affects pipes only.
- Reuse the separate transparent WebGL overlay, batched geometry, time uniform and existing frame fences. No real per-building lights, full city animation redraw, extra renderer or full-screen bloom. Overlay is diagrammatic and does not share the city depth buffer; keep accents tightly aligned to source footprints. If overlay unavailable use static roof signals. Maintain full-detail dusk city and exact positions, source IDs, graph, station and API/evidence semantics.
- Verify palette completeness, deterministic phases, excluded/nonsemantic geometry, matching map roofs, subject filters, toggles, static mode, animation without full city redraw, real packaged browser captures. Maintainer visual approval required; neither CI nor this increment closes the whole A2/A3 scope.

## A3.2 — Continuous conduits and street-level utilities
Tracked by [#82](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/82); refinement of #69, acceptance #70. Original all-pink overview came from selection-relative classification, not missing source edges. Each unique directed complex import now has a pink dependent end and orange prerequisite end, smoothly transitioned in 3D, divided at midpoint in SVG. Selected imports retain pink outgoing/orange incoming; explicit unselected channel modes use their respective single colour. No reciprocal links invented. Declaration dashed relationships retain their distinct channels.

- Continuous dark casing, coloured body and luminous core with gentle travelling intensity waves instead of projectile heads. Maintain restrained background links, stronger selected links, independent district lighting and existing animation overlay.
- Stronger blue-cyan utility conduits at street level with rounded parcel-aligned bends from importing role buildings to exact local Mathlib station. Render utilities after sky paths; matching SVG routes. This represents local parcel infrastructure, not actual city-road routing or new dependencies.
- Preserve toggles, pause/reduced motion, skyline, palette and mathematical source. Tests verify colours, counts and utility geometry. Human visual acceptance remains required.

## A2.2 — Top-down city geometry and irregular boroughs
Tracked by [#83](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/83); related A2 (#68), #81 district lighting, #82 conduits, acceptance #70. North-up navigation is a plan projection of the same city: actual occupied site and role-building positions, scale, rotation, stations, roads, parks, water, civic infill and trees. Project actual imported architectural meshes into horizontal silhouettes (convex outline approximation), use the renderer's circular and rectangular dimensions for native forms, and show roof colour and local base footprint. This is a vector architectural plan, not a photoreal orthographic GPU image. No second scene or reallocation.

Generate irregular borough envelopes from visible occupied complex parcels: deterministic nearest-distance-to-oriented-parcel assignment on a fine bounded grid; limit influence to nearby occupied sites, assign each cell once, merge runs and draw exterior edges. Clip by existing library-bank polygon and render below water, parks and actual road widths. This preserves real city separators, avoids overlapping district claims and permits disconnected neighbourhood patches. No invented geographical ownership; envelopes are visual guidance, not exact cadastral boundaries. Use the established #81 physics colour palette, visible roof colours, subtle ground tint and matching labels/legend. Neutral scenery and cyan utility stations stay distinct; SharedFoundations remains excluded.

Preserve click targets, focus, zoom, map-to-city transition, filters, source evidence and dependency channels. Provide a map-specific unobtrusive colour key and use lighter overview dependency strokes so the map stays legible with pipes on. Test deterministic nonoverlapping parcel assignments, geometry projection, palette correspondence, filter and navigation; capture actual packaged map and mobile evidence, human acceptance. No changes to canonical source layout or integration.

## A3.3 — Unified district light blankets
Tracked by [#84](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/84); replaces the façade sweep treatment of A3.1 (#81), refines #69, acceptance #70. Use broad translucent district-coloured architectural face skins, not travelling strips, missiles or per-face scans. All role buildings and faces of a complex share one deterministic phase keyed by complex ID, with a common 0.9 Hz smooth sinusoidal intensity pulse. Complexes may differ in phase. Persistent low-level wash remains when paused or reduced-motion. Retain the district palette, static rooftop caps and #83 top-down borough colours; preserve pipe direction/colour, Mathlib utility distinction and source identity.

Use a single batched façade blanket in the existing independent animation overlay, with broad geometry fitted to the original building forms (imported model outline and native round/stepped or rectangular forms), visible-facing surfaces and controlled translucent intensity to retain architectural detail. No extra WebGL context or full-scene animation redraw. Overlay remains diagrammatic and does not share city depth; simplified façade surfaces are visual approximations. Fallback keeps static light. Tests validate shared phase across complex roles, coverage, motion controls and unchanged navigation; real rendered visual review required. No source extraction or geometry allocation changes.


## A1.2 — Immersive workspace and navigation
Tracked by [#90](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/90); refines A1 (#67) and A4 (#70). Inspired by the graph-first [Riemann Atlas](https://octoinform.axiomatic.ai/riemann-atlas/): persistent search, compact controls and a dominant visual workspace. Reference public interface controls, not copied assets or exact pixel layout. Compact identity bar, full-bleed city/map below it, floating toolbar/search and context panels, collapsible help/legend. Keep all current controls and sidebar overlay; search uses existing complex/module index, not new semantic or declaration query claims. Responsive HUD reserves clearance above/below context panels, with primary controls reachable on narrow screens.

Initial oblique composition deliberately zooms in (1.20 desktop / 1.28 intermediate / 1.38 portrait) from the existing full-fit frame, allowing peripheral clipping rather than forcing all buildings into the landing composition. Overview restores full-fit framing; pan, zoom, map and source search preserve access to all source locations. Keep city geometry, placement, palette, lighting, data and top-down semantic map unchanged. No extra GPU context or unapproved massing. Measure actual desktop/mobile workspace area, test persistent search and recovery, retain existing browser regression and obtain real visual acceptance. Visual quality still requires human review; this is not a claim of identical Atlas appearance or physical GPU performance.


## A2.4 — Nighttime terrain and flowing rivers
Tracked by [#91](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/91); refines #68 and #70. Keep authored bank/road geometry and mathematical positions. Use original dark world-space paving shaders, continuous width-aware road junctions, subtle wet-surface sheen and warm curb accents, no real lights or baked contact shadows. Water base is a static shader on the existing polygon; approximate branch-direction moving ripples and stylised glints in the existing transparent overlay, with low-cost depth proxies for land, bridges and buildings. No physically simulated flow or true scene reflections, no extra renderer or animated full-city redraw. Pause/reduced-motion retains static water; map remains semantic. References: SynthCity (emissive ground), procedural-city (road/footpath shader), cheapwater and Three.js flow-map showcase. Original code; no third-party shader/assets copied. Actual screenshot and performance acceptance pending.
