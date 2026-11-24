# G5 — Validation, performance and release
Issue #63. Collaborate with #47, #54, #21; #59–#62 precede promotion.

## Baseline and rollout
Current production City v2 at index.html and city-v2.html; city-c4.html is fallback. Develop geography in a branch and explicit preview, with same source data contract. Do not make successive unreviewed changes to production. Use one atomic integration commit/PR after validation; source revision and renderer revision visible separately. Preserve content-hashed bundles. Publication safeguard must still reject stale source snapshots; distinguish superseded runs from broken builds in logs, and retain last successful site. No loosening safeguards just to make Actions green.

## Automated gate
Run npm test, validate assets, build renderer, generate real graph/Mathlib/inventory snapshots, validate provenance, run actual snapshot layout for all filters, package site. Add Chromium Playwright smoke against packaged dist/site via local HTTP server, pinned browser tooling; use software WebGL where CI needs it. Assert actual startup completes (summary populated, visible canvas, nonzero rendered frames, no page errors/console errors attributable to app), no unknown-library error, click overview and verify orthographic framing, select/focus building, open inspector, select station, 1/2/3 controls, search, escape, resize, subject filter keeps locations, legacy fallback reachable. Capture screenshots at prescribed poses and report errors, source revision, seed and asset hashes. Fail on startup/error state, not just HTTP 200 or successful npm build. Browser tests must use actual deployed snapshot in addition to lightweight fixtures. Do not claim that passing geometry functions proves rendering works.

## Performance and access
Establish current v2 baseline and C.4 historical comparison where comparable; measure initial load, time-to-interactive, frame times (median/p95), draw calls, triangles, textures, memory and repeated filter/navigation behaviour. Proposed targets 60 fps mid-range desktop / usable 30 fps low spec, subject to measured device baseline; use LOD, instancing and bounded labels, low/medium/high settings where appropriate. Report hardware, resolution, renderer, sample size; CI software renderer is smoke evidence not hardware performance evidence. Measure no material regression or provide explicit approved tradeoff. Desktop and mobile/trackpad checks, keyboard-only journey, accessible inspector and meaningful focus, no overlay trap; user evaluations #20 and dependency accessibility #25 remain independent.
## Release criteria
1. G1–G4 visual captures reviewed and accepted; no accidental semantic changes.
2. Geometry and source invariants, actual snapshot browser smoke and packaging pass.
3. Performance and accessibility evidence recorded; known limitations documented.
4. Publish preview, review in browser, explicitly approve promotion. Preserve rollback to previous working City v2 commit and legacy C.4.
5. After publication verify homepage and explicit v2 route, content hash and revision marker, real browser startup, overview and inspector. Record link to deployment run and screenshots. If live mismatch, distinguish cache from runtime error with actual bundle/version. No new speculative push while pending deploy; use diagnostic evidence.
