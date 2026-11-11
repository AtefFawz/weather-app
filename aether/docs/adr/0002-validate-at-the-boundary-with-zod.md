# 2. Validate every external input with Zod

**Status:** accepted

**Context.** API responses and `localStorage` are untrusted: schemas change, users edit storage, old versions linger.

**Decision.** Parse API payloads and persisted state with Zod; normalise into a domain model (`data/models.ts`). Invalid storage falls back to defaults; invalid API data becomes a typed `WeatherApiError("invalid_response")`.

**Consequences.** UI code can trust its types. The cost is a small runtime dependency and some schema upkeep.
