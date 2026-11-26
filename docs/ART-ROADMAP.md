# PhysLib City — current art specification

**Review baseline:** 2c12d5d, actual deployment 45820966954. See [Handover](HANDOVER.md). Visual work paused for collaborator review; no claim of human acceptance. [Art epic #64](https://github.com/Sudo-RR/Physlib-knowledge-graph/issues/64), [backlog](BACKLOG.md), independent of [integration](INTEGRATION-ROADMAP.md). This document supersedes earlier competing instructions; [prior detailed roadmap](https://github.com/Sudo-RR/Physlib-knowledge-graph/blob/2c12d5d21022a09fe9ff50e85195958e8adea569/docs/ART-ROADMAP.md) preserves design history and measurements.

## Art brief
Dense, coherent retro-futuristic metropolis at dusk; architecture and source geography stay intact. District hue identifies physics; signature geometry identifies inferred role. No colour implies proof or review status. No underground Mathlib, geographic labels, invented edges or semantic scenery. Prefer clear architecture to overlaid clutter.

## A0 — Baseline and measurement
#66. Review exact production evidence in Handover; use actual matched screenshots and viewport/DPR/renderer/triangle/draw-call measurements. Software Chromium is not hardware FPS. Human review #70 still open.

## A1 — Composition and density (first art work package)
#67. Preserve accepted architecture, bank geography, source placement and neutral scenery. No unsolicited massing redesign. Overview full-fit available; landing tighter. 
## A1.2 — Immersive workspace and navigation
#90. Compact 36px desktop header, full-bleed canvas, floating toolbar/search, resizable overlay sidebar, collapsed context. Initial landing zoom 1.20/1.28/1.38 by aspect; Overview resets to full fit. Keep map, search, keyboard, gestures and deep links.

## A2 — Shadowless lighting and district identity (can run alongside A1)
#68. No cast/contact shadows; simulated ground contact shadows removed; avoid reintroducing shadow maps. Existing UI marker drop shadow is a readability treatment, not city lighting; remaining visual audit is open. Preserve material definition.
## A2.1/A3.1 — PaperView-inspired district lighting
#81. Original subject palette in geneva-district-palette.js; not copied PaperView assets. Previous sweeping façade effects superseded by A3.3/A3.7.
## A2.2 — Top-down city geometry and irregular boroughs
#83. North-up SVG from actual footprints and exclusive buffered occupied parcels; same identity and colour as 3D. Water and streets remain navigable.
## A2.3 — District clearance and utility legibility
#93. Presentation-only footprint scale .76 near district boundaries and .84 elsewhere; stations .84. Preserve canonical locations, heights and IDs. Remove boundary infill, borough buffer 10. Local continuous cyan utility strips represent recorded direct module imports.
## A2.4 — Nighttime terrain and flowing rivers
#91. Original dark procedural paving, width-aware road joins, warm curb accents and dark vegetation. Static river base plus directional stylised ripples in existing overlay; approximate depth proxies, no hydraulic simulation or true reflections. No changed road layout.

## A3 — Animated lighting and rooftop beacons
#69. Main scene on demand, separate existing overlay for animation, no additional context; static fallback and reduced-motion/pause respected.
## A3.2 — Continuous conduits and street-level utilities
#82. Pink/outgoing uses, orange/incoming used by relative to selection, cyan Mathlib street links. Unselected exact edge gradient dependent → prerequisite. Later A3.6 governs overview.
## A3.3 — Unified district light blankets
#84. One stable phase per complex, 0.9 Hz; faint .035–.11 opacity after A3.7. Existing overlay approximate, no shared city depth. Static when paused.
## A3.4 — Architectural skywalks
#93. Deterministic endpoint heights, 55% upper (.50–.95), 45% lower (.10–.50), minimum 2 world units, facing approximate façade, horizontal entry/exit and enclosed inclined span. Structural frame and translucent glazing .67 base alpha (.83 frame before strength). No actual collision routing.
## A3.5 — Role lighting
#93. Role and Basic.lean membership separate from subject and review. Earlier overlay patterns superseded by A3.7.
## A3.6 — Hierarchical conduit visibility
#94. Macro (zoom <2.4, no filter/selection): at most 20 largest unordered cross-library/subject district pairs, actual directed members counted, neutral corridor not a direct gateway dependency. Intra-district links omitted at macro, 24 utility routes maximum (one per station), all station beacons retained. Meso (zoom ≥2.4 or subject filter): nearest eligible district, up to 40 incident actual edges prioritising local/short routes, up to 80 local utilities. Micro: selected complex, 14 actual incident links per direction, exact selected utility role links. Declaration selection suppresses module skywalks, preserves bounded declaration arcs. Report coverage; identical projection in SVG and 3D. No canonical edge changes, road-aligned routing or globally shared multi-pair trunks.
## A3.7 — High-contrast building role signatures
#95. On real depth-tested facade materials: D three broad vertical ribs, R six panels, I three horizontal bands, L crown and side rails; unclassified no signature. Darken random windows; preserve district hue. Basic-bearing buildings get luminous base and separate roof dot; rooftop/map use matching large masks. Native multi-part geometry may repeat a pattern; small/occluded buildings remain a limitation.

## A4 — Visual polish and acceptance
#70. Check overview, focused complexes, map/mobile, role legibility, pipe clutter, keyboard/motion accessibility and no source identity changes. Review remains open; do not confuse functional CI with visual acceptance.
## A4.1 — Skywalk and navigation legibility
#96. Neutral aggregate near-white #e0edf5, strength .46, map opacity .60; retain translucent geometry/channel colours. White fitted word-wrapped labels on dark backing, sRGB untonemapped sprite, 14px overview/16px focus targets. Map-only text selection/native drag disabled; pointer navigation, clicks, sidebar text selection retained.

## City scope
SharedFoundations is source-only in visible view. PhysLib, PhyslibAlpha and QuantumInfo remain actual source roots, with canonical graph retained. 
## Pre-demo clarity pass
Exact role chips, local utility evidence, separate dashed declaration relationships, selection and count readout retained. See [prototype note](geneva/prototype-legibility.md) as historical implementation record.
## Pre-demo composition and network
Current A1.2/A3.6/A4.1 supersede earlier all-edge overview and animated ribbon design.
## File boundary
Art consumes the mathematical manifest read-only. [Architecture](ARCHITECTURE.md) locates modules. No feature scope beyond current request.
## Definition of done
Issue mapped, precise code and tests, actual build and deploy evidence, limitations and human visual review. No further visual work without reviewed feedback.
