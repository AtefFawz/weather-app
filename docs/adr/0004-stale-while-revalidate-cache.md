# 4. Stale-while-revalidate forecast cache in localStorage

**Status:** accepted

**Decision.** Entries are fresh for 10 minutes and usable for up to 6 hours; stale entries render immediately while a refresh runs. LRU eviction caps storage. A failed refresh keeps the last forecast visible with a banner.

**Consequences.** Instant loads, offline resilience, fewer API calls (Open-Meteo's free tier is rate-limited). The service worker deliberately does not cache API traffic, so there is a single source of truth for freshness.
