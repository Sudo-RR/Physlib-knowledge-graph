# C.4 skyline pivot

The default surface now uses shared instanced skyscrapers with podiums, broad
shafts and crowns. Existing C.1/C.2/C.3 comparisons and optional asset/fallback
routes remain available. No new assets, dependencies, landscaping or formal data.

Decorative height is `min(110, 32 + 12*log2(1 + lines/80), 5.8*min(width,depth))`.
This compressed mapping is monotone within each architectural footprint family.
C.2 horizontal placements, plots, semantic footprints and directory colours
remain exact; vertical collision envelopes, roof docks and reserved skywalk
heights follow the taller silhouettes. Source lines/floors remain authoritative.

Checks: 98 passing unit tests, data/asset validation, production bundle, all submitted
tower geometry inside exported bounds, unchanged geography/IDs/imports/colours.
Local browser smoke: overview, Units district, selected deep link, Floor 2 source
range, Mathlib navigation/return, no captured console errors. Live Pages is
checked after push; workflow status is reported separately, never inferred from
the local build.

Full-city tests now read unchanged pinned fixtures under `test/fixtures/city`
instead of ignored local generated data, so the same suite runs in a clean CI
checkout. The production extraction workflow and formal input contents are unchanged.

Captures: [district](screenshots/milestone-c4/district-skyline.png),
[selected](screenshots/milestone-c4/selected-building.png).

Limits: existing compact architectural kit and illustrative silhouettes;
no new performance or artistic approval exercise was requested. Existing source
and optional imported-asset provenance provisions remain unchanged.
