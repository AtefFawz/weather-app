# 3. The sky is a pure function rendered through CSS variables

**Status:** accepted

**Context.** A "living sky" that animates per React render would be janky and untestable.

**Decision.** `computeSky()` returns plain data; the backdrop writes it to CSS custom properties and lets the browser interpolate (`@property`). Only rain/snow use canvas, driven by a typed-array particle system with a seeded RNG.

**Consequences.** The sky is unit-testable (continuity, contrast, polar edge cases), cheap to render, and time travel is free. The Moon's position is stylised, not an ephemeris.
