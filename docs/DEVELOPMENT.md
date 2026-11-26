# Developer and release runbook

## Setup
Clone the repository and use Node 22 (package requires >=20; CI uses 22), npm and Git. For source-data builds clone PhysLib into .physlib-source and checkout the intended clean revision; use the Mathlib revision from its lake-manifest.json. Reproduce the exact workflow for real-data builds. Never commit generated JSON/bundles or the upstream checkout.

```sh
npm ci
npm test
npm run validate:assets
npm run build:city
git clone https://github.com/leanprover-community/physlib.git .physlib-source
npm run build:data
npm run validate:data
node scripts/city-v2-inventory.mjs .physlib-source
node scripts/validate-declarations.mjs site/data/graph.json site/data/declarations.json
node scripts/validate-city-v2-startup.mjs
node scripts/validate-geneva-g1.mjs
node scripts/build-geneva-production.mjs --require-inventory
node scripts/build-geneva-evidence.mjs .physlib-source
node scripts/build-geneva-history.mjs .physlib-source
# Clone Mathlib into .physlib-source/.lake/packages/mathlib and check out:
node scripts/mathlib-pin.mjs .physlib-source
# After checkout:
npm run build:mathlib
npm run package:site
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium
node scripts/smoke-geneva-browser.mjs
```

The authoritative ordering and runner dependencies are in [deploy.yml](../.github/workflows/deploy.yml). On Linux CI Playwright uses --with-deps. The source checkout must be clean; optional history and mathematical companions are built/validated as in workflow. Use npm run serve after npm run package:site; it serves dist/site over HTTP (current production UI). Use npm run serve:legacy only for historical raw-site benchmarks. Native extraction needs matching elan/Lake toolchain, Mathlib cache, pinned result-graph checkout and Linux GNU time; follow [elaborated-pilot.yml](../.github/workflows/elaborated-pilot.yml) and [native-metadata.yml](../.github/workflows/native-metadata.yml), not an improvised global Lean version.

## Fixture preview (fast, no Lean build)
Use a clean disposable checkout/worktree: the following commands overwrite generated site/data files, not tracked source. Use Git Bash on Windows or a POSIX shell. The preview workflow uses this exact fixture revision; no fake source checkout.

```sh
npm ci
npm run build:city
revision=$(node -p 'require("./test/fixtures/city/graph.json").source.revision')
git clone https://github.com/leanprover-community/physlib.git .physlib-source
git -C .physlib-source checkout "$revision"
mkdir -p site/data
cp test/fixtures/city/graph.json site/data/graph.json
cp test/fixtures/city/mathlib.json site/data/mathlib.json
cp test/fixtures/city/mathlib-bridge.json site/data/mathlib-bridge.json
node scripts/build-geneva-production.mjs
npm run package:site
npm run serve
````
Open http://127.0.0.1:4173. Fixture preview has no complete elaborated/native companion or full inventory; do not report fixture metrics as production. If .physlib-source already exists, do not overwrite it; use a separate worktree or explicitly verify its revision and cleanliness. Production steps above remain authoritative for real data.

## Workstream process
Start with [the production backlog](BACKLOG.md) and corresponding GitHub issue. New issues and PRs use repository templates. Historical issues are reference evidence rather than the active queue. The [archived one-time branch audit](https://github.com/Sudo-RR/Physlib-knowledge-graph/blob/2c12d5d21022a09fe9ff50e85195958e8adea569/docs/BRANCH-AUDIT-20261125.md) documents preservation of unique commits and safe retirement of historical branches.
Use separate art and integration branches/worktrees. Keep code change plus tests/docs cohesive; no unrelated refactors. For art use actual production baseline screenshots in matched camera poses and report renderer/viewport, geometry, draw calls, idle/interaction; review before promotion. For integration use exact source IDs and negative fixtures for provenance, missing coverage and proposed/actual separation. Maintain compatibility and avoid shared-file conflicts. No force-push; prefer normal reviewed PRs or maintainer-authorised atomic master changes.

## Release gates
- Unit tests, asset/data validation, real-source layout, packaging, Chromium functional checks. Browser smoke loads the actual packaged snapshot, validates 3D, sidebar, declaration navigation, native metadata if available, API maps, map, legacy redirect and mobile navigation. Diagnostic screenshots may time out without failing functional assertions.
- The full graph and native companion are optional only if absent/incompatible; when present they must validate. Never suppress failures or fabricate missing mathematical evidence.
- Deployment runs on push, scheduled refresh, workflow dispatch and successful extraction. The deployment freshness step verifies both graph HEAD and upstream PhysLib HEAD. If superseded, deployment step is skipped, existing site remains; green workflow alone is not proof of publication. Network/missing refs remain errors.
- Check actual build and deploy job steps, confirm deploy-pages succeeded and record URL, revision and artifact links. Hard refresh if cached; content-hashed bundle prevents stale JS. Wait for active production validation before new feature promotion. Never disable revision or integrity gates to clear an error.
- If failing, inspect specific job log and browser evidence; distinguish unit, packaging, extraction, browser, publication freshness and site cache. Fix root cause and rerun; revert only scoped rejected change if necessary. Previous working deployment stays available. Do not claim background completion.

## Browser controls
WASD camera-relative pan, left/right arrows rotate in 3D, up/down zoom; arrows pan in map. Left drag pans, right/Shift drag rotates, wheel/pinch zoom. M switches map/city, I sidebar, / search, F focus, Home overview, Esc clears. Map click enters oblique at source building. Sidebar overlays without shrinking the renderer; resize with grip or Enlarge. Legacy city-v2.html is redirect, C.4 historical. Public dusk/full geometry/highest practical resolution only.

## Evidence and security
Static site: no tokens or private data in published files. External data is untrusted, render text safely, pin source links and verify hashes. Preserve third-party asset license records. Document decisions and blockers in handover; actual run IDs and tested revisions beat claims. No unreviewed upstream writes or inferred approval.
