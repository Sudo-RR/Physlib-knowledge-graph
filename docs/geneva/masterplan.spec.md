# G1 — Geographic masterplan specification
Issue #59. Approved north-up concept: [masterplan.svg](masterplan.svg).

## 1. Spatial composition
Use a continuous planar world (x east, z south; north = negative z). The lake occupies a substantial northeastern region, with visible shoreline extending beyond the developed core. The Rhône exits its southwestern end, meanders west/southwest, and continues beyond the map. The Arve enters from the southeast, curves northwest, and joins the Rhône at a single La Jonction confluence. The central peninsula tapers toward that confluence. Two nearly parallel strips extending across the entire city are explicitly unacceptable.
- Rive Droite / PhyslibAlpha: north/northwest of Rhône and west of lake; broad urban fabric, expansion room.
- Rive Gauche / Physlib: south/east of Rhône, north/east of Arve; dense central peninsula and eastern lakefront.
- Outre-Arve / QuantumInfo: south of Arve; smaller distinct urban quarter, not disconnected island.
- Neutral terrain across all three; no coloured filled subject parcels, no floating platform.

## 2. Template and geometry
Use authored normalized geometry control points and a versioned configuration file, not an uncontrolled river formula. In a normalized 0..1 frame, approximate lake tip (0.65,0.42), confluence (0.22,0.57), Rhône western outlet (0,0.63), Arve southeast entry (1,0.80). These are illustrative design anchors, not real coordinates. Lake occupies roughly 15–25% of framed land/water composition as a proposed starting range. Use smooth centerlines with tapered widths or direct boundary polygons; union lake and rivers at their joins. Construct a land polygon difference from the water union; partition eligible land into three disjoint library sectors using river topology, not nearest-centroid labels. Extend terrain beyond camera bounds. Maintain gentle terrain variation only if it cannot interfere with buildings, water or roads; flat terrain is acceptable initially.
Produce a pure module with a schema such as {version,seed,bounds,waterPolygons,shorelines,sectorPolygons,bridgeAnchors,protectedAreas}. Geometry coordinates in world units; IDs stable and named. Polygon winding, holes, tolerances and coordinate transforms documented. Use a robust polygon clipping/triangulation library if needed, pin version and record licence.

## 3. Capacity and scale
Read exact library from canonical model, including .lean root modules. Allocate sufficient land by actual plot demand (building footprints, station, setback and public space), not equal thirds. Estimate total usable area after water, quays, arterial roads and protected spaces; target provisional 20–30% expansion headroom. Scale sectors or lower non-semantic spacing through explicit configuration when demand exceeds capacity. Never move complexes across riverbanks to solve capacity. Keep full-world layout stable on subject filters; filter visibility, not city geometry. No arbitrary omitted source modules. Empty sector remains a geographical sector even in filtered view.

## 4. Bridges and civic geography
Design 3–5 Rhône crossings and 2–3 Arve crossings as initial ranges, only at plausible short spans and safe shore landings; actual count chosen from terrain geometry. Quays follow shoreline; reserve approach space for future street graph. Bridges connect urban sectors, not dependency edges. Lakefront plaza, La Jonction park, waterfront promenades and occasional larger green areas establish character. No independent artificial lake solely for decoration.

## 5. Implementation order and checks
1. Draw terrain/water-only plan in 2D; review before 3D.
2. Validate closed simple polygons, nonzero area, sector interior disjointness, no land/water overlap, expected river connectivity, one confluence and lake outlet; test near-boundary tolerance.
3. Render terrain, waterfront and bridges in Three.js; camera fitted to developed land plus lake. Save north-up and oblique reference captures with geometry revision.
4. Compare visual topology to approved diagram; explicitly approve before street generation.
Test empty, full and skewed library population, same geometry for subject-filter visibility, and provenance root cases. Record land area, capacity and any exceptions. Do not claim exact geographic fidelity.
