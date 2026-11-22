# City visual and performance checks

Use the same checked-out code, graph snapshots, browser, viewport, quality
setting and device scale for before/after comparisons. Animation and the
current Physlib snapshot can otherwise cause differences unrelated to a change.

## Manual screenshots and comparison

Generate and serve the site as described in the README. With the same browser
viewport in both builds, capture PNG screenshots after the camera settles:

1. Open the city and select **Overview**.
2. Search for `Physlib.ClassicalMechanics.EulerLagrange` and capture the
   selected building; verify the source link and selection outline.
3. Select a short file from the same folder and capture its building.
4. Reload a URL containing `?node=Physlib.ClassicalMechanics.EulerLagrange`
   and capture the restored selection.
5. Select a Mathlib import such as
   `Mathlib.MeasureTheory.Integral.Bochner.Basic` and capture the
   underground view. Return to the surface afterwards.

Keep the legend collapsed for comparisons, and wait for moving traffic to
settle or turn off pipelines. Compare same-sized RGB/RGBA PNG captures with:

```sh
node scripts/compare-screenshots.mjs before.png after.png 0.1
```

The command reports the fraction of pixels with a channel difference greater
than 30 and exits nonzero above the supplied fraction (10% by default).
Dimensions must match. A failure signals a change requiring human inspection;
it does not establish a defect, and passing cannot establish usability.
Screenshots can vary with GPU, browser, fonts and time-dependent visuals.
The test suite checks that a substantial synthetic image change is detected.

## Rendering instrumentation

Add `?metrics=1` (or `&metrics=1` on a deep link) to display the one-second
frame rate, draw calls, triangles and GPU geometry/texture counts reported by
Three.js. “Scene” is synchronous scene-construction time, not page load time or
time to interactive. Counts describe renderer allocations, not GPU bytes or
total process memory. Repeatedly switch between the same two files and allow
the scene to settle to look for persistent growth; record the selection and
quality setting.

On 22 November 2026, one local desktop browser session at the default initial
view, High quality and the same 2,256-file local snapshot produced these single
samples. They are diagnostic observations, not a device benchmark or FPS claim.
The baseline was commit `f938052`; its scene was instrumented with the same
renderer counters for this comparison.

| Measurement | Baseline | Updated build |
| --- | ---: | ---: |
| Scene construction | 648 ms | 176 ms |
| One-second frame rate | 29 FPS | 60 FPS |
| Draw calls | 740 | 773 |
| Triangles | 856,672 | 875,804 |
| Renderer geometries | 644 | 141 |
| Renderer textures | 17 | 17 |

The measurements are affected by warm-up, GPU scheduling, viewport and browser
load. Repeat on a mid-range desktop and a lower-spec device before evaluating
the proposed 60/30 FPS targets. There is no measured page-load, time-to-
interactive or GPU-memory baseline yet. Five back/forward cycles between two
files settled around 200 renderer geometries and 30 textures; this short check
does not prove absence of leaks over a longer session.

For interaction checks, test mouse drag, right-drag, wheel, keyboard and a real
trackpad; select a dependency and use Back, switch layers, reload a deep link,
open and close the floor inspector, and test the low-quality setting. Test a
small viewport and keyboard focus separately. Record device, browser, revision,
failures and screenshots rather than extrapolating from the local sample.
