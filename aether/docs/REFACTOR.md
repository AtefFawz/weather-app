# What changed in v2

| Area          | Before                             | After                                                                                |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| Language      | JavaScript                         | TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)      |
| Data          | Raw API objects used in components | Zod-validated, normalised domain model; typed errors; retry with jittered backoff    |
| Units         | Refetch on change                  | Always metric from the API; instant client-side conversion                           |
| Caching       | Ad-hoc                             | LRU stale-while-revalidate cache; offline-friendly                                   |
| State         | Scattered hooks + legacy keys      | One versioned, validated store with migration from legacy `aether-*` keys            |
| Visuals       | Static gradient themes             | Sky driven by real solar geometry + weather, particles, lightning, Moon phase        |
| Interaction   | Scroll                             | Time-travel scrubber, command palette (Ctrl/⌘+K or `/`), briefing, best-time-outside |
| i18n          | Untyped object                     | Typed EN/AR dictionaries with parity tests; full RTL                                 |
| Accessibility | Partial                            | Skip link, slider/combobox semantics, reduced motion, axe-clean in both themes       |
| Delivery      | None                               | PWA (installable), CI, Playwright e2e, Prettier/ESLint                               |
| Tests         | One utils file                     | ~105 unit tests + 14 e2e scenarios                                                   |

Bugs found by the new e2e suite and fixed along the way: a failed first load stayed on the loading skeleton forever; the command palette could swallow the `/` hotkey right after closing; an icon-only rain label had an invalid ARIA name; the AQI band label failed contrast in the light theme.
