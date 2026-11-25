# Prototype legibility pass — 25 November 2026

Final pre-demo clarity work, scoped to art/presentation and the existing model. No changes to city massing, architectural geometry of role towers, mathematical schemas, extraction, ownership or graph evidence. Related #68, #70, #79. The prototype must be visually reviewed in the deployed site before external sharing.

- Selected complexes show a compact accessible role key (D data structures, R relations/instances, I interfaces, L lemmas/properties, ? unclassified) and matching selected-complex rooftop/map glyphs; role assignments are still inferred from lexical commands. Role chips navigate to actual existing building IDs. No invented roles or planned entities.
- Solid sky conduits use bounded geometry, contrasting outline and direction arrows; map uses corresponding thick directional paths. Each arrow goes from dependent to prerequisite. Incoming/outgoing colours remain unchanged. Declaration relationships remain separately dashed and may be routed, not certified direct proof edges. Capped at 14 complexes per direction, filtered before cap. Readout reports shown versus eligible module counts.
- Mathlib stations retain exact station IDs and footprint; luminous cyan raised core/ring/halo and map diamond distinguish active utility infrastructure. Empty stations are subdued. Role-to-station conduits appear only where the role's actual module list intersects recorded direct Mathlib source modules; this does not infer declaration usage. No per-station real-time lights, animation loop or postprocess bloom.
- City key available while sidebar closed; no changes to dusk/full-detail/high-resolution baseline. Selected role marks bounded to one complex. No global animations or unrelated density/shadow changes in this sprint; these remain art roadmap tasks.

Tests cover relationship directions, filters, caps, role codes and recorded station evidence; packaged browser checks real station/role counts, visible pipes, map marks, and hide controls. CI and visual acceptance pending.


## Regression correction
Run 45693024434 passed all 159 unit tests and published companion preparation but failed the browser assertion that HamiltonianMechanics must have a direct Mathlib conduit. Inspection of the actual previous Pages artifact 15056828218 confirms this complex has zero direct Mathlib imports. The regression now verifies the exact expected count including zero and exercises a real import-bearing complex selected from the same packaged snapshot. Utility beacons retain luminous core and rings with lighter planar ring geometry; source tower detail and resolution are unchanged. Actual CI and visual review remain necessary.
