---
name: Physlib City C1 and C2
description: Original atomic architecture with an opt-in chromatic source geography extension
colors:
  ivory: "#f3e9d2"
  teal: "#14b8b0"
  amber: "#ffc34b"
  coral: "#f47758"
  orchid: "#a47ae1"
  green: "#66be87"
  ink: "#27334d"
  glass: "#39858d"
  chrome-paper: "#fffaf0"
  supporting-text: "#46516a"
  c2-borough-physlib: "#13a8a5"
  c2-borough-alpha: "#d9527c"
  c2-borough-quantum: "#7956c7"
typography:
  body:
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "12px"
    lineHeight: 1.5
  title:
    fontSize: "18px"
    lineHeight: 1.3
  control:
    fontSize: "11px"
---

# Design System: Physlib City C1 and C2

## Overview

The opt-in `visual=c1` surface uses broad, original Three.js geometry to make a colourful atomic scientific campus. The city is the primary visual artifact; compact source tools support exploration. Experience is the scene's mode and Operate is the surrounding Explorer/Inspector's mode. This records the implemented C1 variant, not approval to replace the default C visual system.

The `visual=c2` extension adds persistent geographic colour and civic scenery to that architecture. Both variants remain opt-in alongside default C. C2 retains the scene's Experience mode and source tools' Operate mode; Explore is a reversible presentation, not a different source model.

The ordinary opt-in `visual=c3` candidate extends C2 with space-age metropolis massing. It preserves the incumbent palette, typography and source tools; its surface-specific direction and evidence limits live in `.impeccable/surfaces/city-c3.md`. Default C and comparison C2 remain unchanged. This records a candidate, not an approved replacement world.

## Colors

Ivory forms the architectural masses. Teal, amber and coral articulate Physlib structures; coral identifies PhyslibAlpha accents and orchid identifies QuantumInfo accents. Green marks planting; dark indigo ink anchors entrances and interface text. Glass uses a muted blue-green. Warm paper supports the compact controls. The alternative metropolis concept uses amber accents throughout.

C2 uses `site/city-colors.js` as the authoritative persistent version-1 address registry: 39 directory assignments and three `@root` assignments shown as Root Modules. Borough colours are separate from district primaries. Existing assignments are retained; new keys select a swatch distant from adjacent assignments. Ground, neighborhood and dark edge shades are derived from each primary. Vivid and porcelain compositions use different ground mixing. Geographic pattern signatures combine portico, observatory, fin-array or orbital-gate with stable fin and band counts; close colour pairs therefore have another visual code. Breadcrumb borders, search results, the Inspector address and scene territories share that identity. Colour encodes directory address, never proof status, completion or scientific rank. The registry, rather than duplicated district token entries here, owns the exact assignments.

## Typography

The existing Helvetica Neue/Helvetica/Arial stack remains inherited. Source lists, file paths and Inspector paragraphs use the body role; headings use the title role; toolbar controls use the control role. Breadcrumb and topic-label text is 12px. The existing interface includes smaller supporting labels; these are not a new display-type direction.

## Layout

Desktop uses a 220px Explorer, flexible scene and 292px Inspector below a 56px masthead. At 1100px the side columns become 180px and 250px. At 760px the inherited column flow stacks; Explorer height is 210px and the canvas is at least 520px high. Mobile toolbar targets have a 44px minimum height. Source trees retain unbroken names with scrolling; Inspector headings may wrap.

C2 Explore collapses the side columns and makes the existing panels non-modal drawers, one open at a time. Desktop drawers are 300px wide; mobile drawers cap at the viewport width minus 24px. Explore uses a 42px masthead. Exit Explore restores the ordinary panel presentation. `explore=1` restores this reversible view from the URL.

## Elevation & Depth

Three-dimensional massing carries the depth: ivory solids, coloured roofs, glass bands, shallow entrance canopies and planted courts. Shared primitive resources and instanced batches support distance-dependent detail. Broad base silhouettes remain visible while facade bays and sunshades fade in at closer ranges. Standard materials use roughness 0.7 and metalness 0.08; glass uses roughness 0.3.

C2 ground uses opaque, explicitly ordered layers for boroughs, rivers, district boundaries, neighborhoods, parks, courtyards, streets, service bands and module plinths. Offset contact shades anchor buildings. Civic forms are instanced original geometry; finer bands, fins and vegetation details depend on quality and distance.

## Shapes

Four deterministic archetypes are implemented: Research institute, Terraced laboratory, Space-age tower and Garden pavilion. Their original forms combine boxes, six- or twelve-sided cylinders, domes and low-detail orbs. Campus institutes use rounded drums; the metropolis variant replaces those principal masses with boxes and adds side volumes. Display height is logarithmic and capped at 20 scene units; exact source height remains separate.

C2 district composition motifs are institute-square (up to six modules), research-crescent (up to twenty), terraced-campus (twenty-one through eighty) and science-promenade (over eighty). Civic landmark silhouettes are portico, observatory, fin-array and orbital-gate; the porcelain alternative uses a shared domed form. Civic classes include non-selectable district landmarks, civic trees, bridge decks/balustrades and approaches. None becomes a graph module or import endpoint.

C3 adds broad module silhouettes, dark glazing and rounded porticos. `site/city-metropolis.js` supplies expanded civic forecourts with gateway, observatory, orbital pavilion and stepped institute forms, plus park groves. Civic expansion remains presentation geometry; C2 module anchors, plots, heightmap, registry and graph remain authoritative. Independent review still finds only partial world-metropolis and campus grouping, so those ambitions are not documented as achieved system invariants.

## Components

Breadcrumbs and the compact wrapping toolbar preserve navigation. Warm-paper minimap and reading-key disclosures sit at the scene edge. Current-file, movement, import-summary and asset-status overlays are hidden in C1; district controls appear only in debug mode. Explorer and Inspector preserve exact identities, relationship lists and source-floor controls. Focus is a dark 2px outline offset by 3px; selected text uses amber with dark ink.

C2 Explore exposes Files and Inspector toggles with expanded state. Files focuses search; Escape closes drawers and focuses Explore; slash opens Files for search. Selecting a module retains its path and appends the filename as the current breadcrumb. Geographic address labels supplement canonical accessible module names. The reading key explicitly distinguishes scenery, directory colours, recorded import arrows and source floors.

## Do's and Don'ts

- Do retain original geometry, shared resources and a complete silhouette at every detail tier.
- Do preserve canonical module IDs, revision-pinned source links and import semantics independently of decoration.
- Don't interpret decorative storeys as declarations or source floors.
- Don't promote C1 to the default without resolving its reported 35.6 versus 45.3 FPS software-rendered regression and obtaining approval.
- Do preserve C2 colour-registry addresses independently of completion or scientific meaning.
- Don't treat civic scenery as source modules or change source data to support the visual extension.
- Don't infer default approval from C2's controlled Software/Medium comparison: C 42.6 FPS, C1 36.6 FPS and C2 38.3 FPS pass the at-least-90%-of-C1 gate; approval remains pending.
- Do keep C3 opt-in and preserve the incumbent C and C2 comparisons; passing C3 performance gates does not establish visual approval or default promotion.
