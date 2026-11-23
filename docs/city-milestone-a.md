# Milestone A — imported building pipeline

22 November 2026. Scope: one opt-in modular building fixture in the existing
JavaScript/Three.js application. Milestones B–E have not been implemented.
The specification was read in full before implementation; its future-city
definition of done is not claimed by this smoke test.

## Architecture and file-change plan

The plan presented before editing was to retain the current scene/controller,
add a narrow cached GLTFLoader registry, decorate one canonical module behind
a query flag, package a reviewed local asset, and test identity/failure/URLs.
No framework, graph, placement algorithm or extraction migration was needed.

| Existing responsibility | Milestone A change |
| --- | --- |
| `city.js` builds model, selection, source inspector and history | Unchanged |
| `city-model.js`, `city-layout.js`, `city-relations.js`, `city-floors.js` | Unchanged; canonical IDs/imports/positions/heights retained |
| `city-scene.js` owns semantic bodies, camera, picking and rendering | Attach one optional asset, retain hitboxes/floor picking; report P95/max frame intervals |
| `city-art.js` generates instanced decorative roofs/entrances | Unchanged; rebuild surface decorations once after successful fixture load to omit its old roof |
| New `city-asset-registry.js` | Cache one load per URL, share cloned geometry/materials, uniformly fit bounds, catch failure |
| `scripts/package-site.mjs` | Include curated models and licence receipts beside the hashed bundle |
| New `scripts/validate-assets.mjs`, `test/city-assets.test.mjs` | Asset integrity, self-containment, bounds, selection identity, sharing, retry and fallback checks |
| `package.json`, deployment workflow | `validate:assets`, also run in CI |
| `city.css`, README, this report, THIRD_PARTY_ASSETS, screenshots | Fixture status, usage, provenance and evidence |

Use the existing local server:

```sh
npm run build:city
npm run serve
```

Open `http://127.0.0.1:4173/?assetFixture=kenney-tower&node=Physlib.Units.ISQDimensionBase&metrics=1`.
Removing `assetFixture` restores the original procedural presentation. This
fixture decorates only that existing file, not all graph modules. All other
files, import lists and source links remain available.

## Reference inspection

- [Official Three.js manual](https://threejs.org/manual/en/load-gltf.html) and
  [example source](https://github.com/mrdoob/three.js/blob/dev/manual/examples/load-gltf.html):
  GLTFLoader, OrbitControls, Box3 bounds/framing, hemisphere/key lighting and
  resize handling. Existing `fitBox`/navigation remain authoritative: an async
  asset load never reframes the camera or changes selection.
- [HK generator](https://github.com/maxmode-now/building-generator-threeJS-clone):
  reviewed actual `src/hk/kit.ts`, `generator.ts`, `main.ts`, `ground.ts`,
  `streetprops.ts`, and `ATTRIBUTION.md`. Placements are grouped by part key;
  mesh-local matrices are composed with per-building transforms and rendered
  as shared InstancedMeshes. The shell merges placements before conversion
  from Blender Z-up. Their vendored code cites MIT, but their kit separately
  cites uday's **CC-BY 4.0**, not CC0. No code or kit assets copied.
- [CyberCity](https://github.com/achrefelouafi/CyberCityThreeJS) reviewed as an
  aspirational skyline/atmosphere reference; no WebGPU/TSL pipeline imported.
- [FPS environment kit](https://github.com/petroulacl/fps-buildings-env-kit)
  reviewed as an inventory, not a pack to vendor. Only a single Kenney sample
  and its palette/licence were retrieved. Creator Quaternius pack pages and
  Kenney's original CC0 declaration were checked before asset selection.

## Asset, geometry and licensing

Kenney Modular Buildings 2.1, sample tower A: 648 vertices, 398 triangles,
one material, one embedded palette. Native bounds are X ±0.55, Y 0–2.5,
Z −0.55–0.70; Y-up, grounded origin. The palette is not an external request.
GLTFLoader handles its base-colour texture in sRGB; renderer output remains
the existing sRGB configuration. No renderer-wide tone/lighting changes.

Uniform scaling fits X/Z and maximum semantic height. A procedural pedestal
fills the remaining height, so the exact source-line-derived height and
selection envelope remain unchanged without elongating windows. This
deliberately exposes the pipeline rather than establishing the final city kit.
The imported model's descendants carry the exact module ID; interactive
picking uses the simple semantic body/source-floor volumes, excluding art.
The selected floor uses a wireframe outline in fixture mode so it does not
cover the imported art. Other modules retain their original floor rendering.
Cached model resources are shared and are not disposed on selection changes.

The creator archive returned HTTP 403; **direct creator retrieval was not
achieved**. Actual files came from the specification's asset mirror, with
the original Kenney CC0 receipt and a matching independently checked creator
licence declaration. Full paths, hashes, transformation and redistribution
permission are in [THIRD_PARTY_ASSETS](../THIRD_PARTY_ASSETS.md). This deviation
must remain visible when assessing strict Milestone A acceptance.

## Data and structure checks

The three data files are byte-identical before/after. There are 2,256 city
modules, 6,598 displayed imports, 353 current layout districts and 5,129,768
snapshot bytes. The city includes 1,579 Physlib-family files and 677 directly
imported Mathlib files. Declaration snapshots remain optional and partial.

- Physlib revision: `4e2182f2b6f0a54207a2fa62002c264217f875d6`.
- Mathlib revision: `56a005855ea17e0b0958f73ec801ae140b0a1679`.
- `graph.json` SHA256: `40de214ae1760eb45d05b083b87889e895805281a52d860984ef91e1c84f8200`.
- `mathlib.json`: `638f9e1fd4b7f01e4a697460f8f0e296ed9602689afa2106b8b53848ecd762f2`.
- `mathlib-bridge.json`: `db53d9268d6b7c732dcb20b41a960c29046bd10fdac322c195dd70fd8fd6b331`.

No PaperView mappings, formalisation statuses or mathematical relationships
were added. The three river-separated surface boroughs, directory hierarchy
and underground mirror architecture remain the later milestone plan.

## Automated checks

Before: `npm test` **58/58**, `validate:data`, `build:city`, `package:site` passed.
After: `npm test` **62/62**, `validate:data`, `validate:assets`, `build:city`,
`package:site`, and validation of the **packaged** GLB/licence passed.
`git diff --check` passed. Repeated output-directory deletion hit a local
sandbox ACL (`EPERM`); packaging succeeded with approved escalation. This
was an environment restriction, not a build-code failure.

The four new tests cover reviewed payload integrity, absence of remote image
or buffer dependencies/required decoders, one cached load at Pages-relative
URLs, uniform fitting, shared resources, template non-mutation, raycast-to-ID
mapping and two failed-load retries without changing the semantic body.

## Browser and interaction checks

Chromium-based in-app browser on this Windows machine, Medium quality;
desktop and the initial narrow responsive view were inspected. Packaged
hashed JS/CSS and model were served beneath `/_asset-qa/` using the existing
local server, proving document-relative resolution. A separate QA-server
port timed out from the browser, so it was not used for acceptance.

Verified:

- Deep link restores exact `Physlib.Units.ISQDimensionBase` while GLB loads.
- Successful status and visible material/model; selected outline retained.
- Clicking the model's semantic hitbox opens its correct source floor.
- Inspector floor button preserves exact file identity/source ranges.
- Direct recorded `Mathlib.Data.Fintype.Card` import enters the underground
  layer, and Back returns to the original Physlib selection.
- Mouse drag pans; keyboard W input and focus recovery operate.
- Low/Medium controls operate; Overview recovers the radial directory map.
- Renaming only the temporary packaged GLB caused a real HTTP 404. The
  procedural building, exact revision source link and floor inspector remained
  usable. The temporary file was restored afterwards.

Real trackpad gestures, right-drag orbit, Firefox, touch hardware, prolonged
navigation and three-volunteer usability testing remain **unverified**.

## Payload and performance checks

One asset: **42,808 bytes raw / 12,954 bytes gzip**. Geometry and palette pixels
are unchanged; only embedding/JSON compaction was applied. No need for lossy
mesh compression or a runtime decoder at this size. Full asset packs are absent.
Original baseline bundle rebuilt from HEAD: 1,417,802 raw / 268,019 gzip bytes.
Final fixture-enabled code bundle: 1,583,029 raw / 301,270 gzip bytes
(about 33 KB gzip overhead, mainly GLTFLoader).
The GLB is fetched only when the fixture flag is enabled and the 3D scene opens.

Node v26.13.0, three warmed samples, same snapshots:

| Measurement | Before | After |
| --- | ---: | ---: |
| Model median | 31.3 ms | 27.8 ms |
| Layout median | 90.3 ms | 120.7 ms |
| Floors median | 3.5 ms | 4.9 ms |
| Process peak resident | 153.9 MB | 153.0 MB |

These codepaths were unchanged; timing differences are run variance, not a
claimed improvement/regression attributable to imported art.

Settled single-second desktop samples in the same packaged app and camera
target (see screenshots; the moving traffic/frustum can slightly change counts):

| Measurement | Procedural control | Imported fixture |
| --- | ---: | ---: |
| Synchronous scene creation | 200 ms | 189 ms |
| FPS | 60 | 60 |
| P95 frame interval | 18.7 ms | 18.1 ms |
| Maximum frame interval | 20.8 ms | 20.8 ms |
| Draw calls | 93 | 96 |
| Triangles | 861,646 | 862,108 |
| Renderer geometries | 65 | 66 |
| Renderer textures | 7 | 8 |

P95/max diagnostics describe the most recent second, exclude GPU timestamps,
and reset after resuming from the map. Synchronous scene creation excludes
the async GLB download/parse and is not first visual load. No browser heap,
GPU time/bytes, worst-case memory, reliable first-visual-load benchmark or
long-run frame-spike guarantee was obtained. These short samples do not
establish 60 FPS on a representative midrange machine.

## Screenshots

Initial baseline images used the original narrow viewport; the later control
and fixture screenshots show the desktop comparison. They are evidence for
manual inspection, not deterministic visual-regression goldens.

- [Original overview](screenshots/milestone-a-baseline-overview.jpg)
- [Original selected file](screenshots/milestone-a-baseline-building.jpg)
- [Original underground](screenshots/milestone-a-baseline-underground.jpg)
- [Procedural desktop control](screenshots/milestone-a-procedural-control.jpg)
- [Imported fixture](screenshots/milestone-a-fixture.jpg)
- [Underground journey](screenshots/milestone-a-underground.jpg)
- [404 fallback with source-floor inspector](screenshots/milestone-a-fallback.jpg)
- [Recovered overview](screenshots/milestone-a-overview.jpg)

## Next milestone

Milestone B: one actual Physlib directory showcase, curated base/floor/roof
components with fixed-unit facade instancing, deterministic decorative
archetypes, directory signage and selection-only truthful module-import
skywalks. Review the atomic-futurist art direction and direct creator asset
provenance before expanding the kit. Milestone C adds the three bounded
boroughs and two rivers; D adds the imported-Mathlib architectural mirror;
E adds polish, accessibility and only evidence-backed overlays.
