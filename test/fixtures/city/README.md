# Pinned full-city regression input

Unmodified copies of the locally validated graph, imported Mathlib subset and
bridge used for the C/C.1/C.2/C.3/C.4 geometric regressions. Physlib revision
`4e2182f2b6f0a54207a2fa62002c264217f875d6`; Mathlib revision
`56a005855ea17e0b0958f73ec801ae140b0a1679`.

Tests intentionally use these fixed inputs so a clean checkout needs no ignored
`site/data` directory, and upstream additions cannot invalidate pinned count
assertions. The existing deployment workflow still extracts production snapshots
from its checked-out upstream sources. These fixtures do not change formal data.
