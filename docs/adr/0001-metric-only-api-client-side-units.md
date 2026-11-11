# 1. Request metric only; convert units on the client

**Status:** accepted

**Context.** Open-Meteo can return °F/mph directly, but that makes every unit change a new request and forces the cache to be keyed by unit.

**Decision.** Always request metric; convert in `core/units.ts`. Cache entries are keyed by place only.

**Consequences.** Instant unit toggles, no refetch, one cache entry per place. Conversion bugs are confined to one small, tested module.
