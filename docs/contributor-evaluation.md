# Contributor evaluation: draft protocol

This is a protocol to run with Physlib contributors; it is not a report of completed user testing. Do not record personal information or screen recordings without the participant's agreement.

Use a snapshot that contains the three-module declaration pilot, and record its Physlib revision, graph version and extraction coverage. Compare the graph against a participant's normal name/text search on the same checkout. Counterbalance the order between participants and avoid giving away the answer in the task wording. Record which route was used, time if the participant agrees, whether the relevant source was reached, uncertainty or navigation problems, and useful feedback. These small tasks are exploratory and cannot establish statistical significance or prove that no duplicate exists.

## Tasks

1. Find the definition used for the simple pendulum's Lagrangian, then reach its Lean source and an API map that discusses the pendulum.
2. Starting from the Euler–Lagrange operator, find a recorded result that depends on it and inspect that result's statement and source.
3. Before implementing a kinetic-energy function for a harmonic oscillator, find an existing candidate and decide what additional checks you would need before reusing it.

## Facilitator reference for the pinned pilot

At Physlib commit `4e2182f2b6f0a54207a2fa62002c264217f875d6`, relevant starting points include `ClassicalMechanics.SimplePendulum.lagrangian`, `ClassicalMechanics.eulerLagrangeOp` / `ClassicalMechanics.eulerLagrangeOp_eq`, and `ClassicalMechanics.HarmonicOscillator.kineticEnergy`. Check against the chosen revision before a session. Some API-map references use shortened names and are labelled as unconfirmed candidates in the prototype.

Ask participants whether they understood the edge direction, the distinction between a file import and a declaration dependency, the unindexed/partial-coverage warning, the difference between an exact map reference and a candidate, and how to reach source. Test keyboard, screen reader and narrow-screen use separately. A lean-vouch edge does not cover all theorem-proof dependencies; task 2 asks for a **recorded** dependent rather than an exhaustive usage search.

After sessions, summarize observed difficulties and successes, distinguish actual results from suggestions, and link follow-up work to issues #20 and #25. Do not present this protocol as evidence that contributor evaluation has already occurred.
