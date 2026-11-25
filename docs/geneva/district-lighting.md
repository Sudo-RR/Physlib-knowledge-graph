# District illumination implementation — #81

Spec: [A2.1/A3.1](../ART-ROADMAP.md#a21a31--paperview-inspired-district-lighting), commit b96f4fa. Prior validated city: 6c3e731, deployment 45700043067. Original 18-subject palette inspired by PaperView hierarchical concept families (https://paperview.org/roadmap/index.html); no claim of exact PaperView colour matching.

Static matching roof caps and map outlines, modest façade material/emission tint, consistent borough map labels and collapsible district key. Existing footprint and role identity unchanged; utility stations and scenery excluded. Phase-offset 0.9 Hz vertical light bands via one batched thin accent mesh in existing independent overlay (static in fallback); roof cap mesh in main city. No extra WebGL context, real lights or full-resolution animation redraw. Pipe toggle leaves district animation active. Pause and reduced-motion apply to both animated layers. Filter uniform restricts both cap and strip batches. Diagrammatic overlay does not share city depth buffer; thin accents may appear in front of occluding structures. This is the initial implementation; shadow removal remains #68, actual visual acceptance #70/#81.

Tests: palette coverage, source-only membership, deterministic phases, mesh counts, motion policy; packaged-browser map roof matches, static mode and independent animated sweeps. Latest deployment and screenshot acceptance pending.


## Browser regression correction
Run [45703163638](https://github.com/Sudo-RR/Physlib-knowledge-graph/actions/runs/45703163638) passed 165 unit tests and the startup assertions for all visible district roof colours, geometry membership and network counts, then failed at smoke line 42 because `#semanticKey summary` matched both the city key and the new nested district legend. The correction targets direct-child summaries and checks both controls, exact visible subject count and closing behaviour. No renderer, animation, palette, graph or deployment-gate changes. Full browser execution, deployment and visual review still pending.
