# Architecture and engineering decisions

## 1. Feature-oriented organization

The application is intentionally organized by capability rather than by technical layer alone.

- `features/weather/api` owns communication with Open-Meteo and translates transport/provider failures into a small application error type.
- `features/weather/hooks` owns the weather request lifecycle, cancellation, loading state, and errors.
- `features/weather/components` owns the weather-specific presentation.
- `lib` contains reusable browser and formatting utilities that are not coupled to a weather screen.
- `locales` contains the UI copy and is the single source for English and Arabic labels.
- `app` composes the application and owns cross-feature preferences and saved locations.

This keeps provider-specific response details out of visual components and makes it possible to replace the weather provider without rewriting the dashboard.

## 2. Data flow

1. A location is selected from search, saved places, the default location, or the browser geolocation permission flow.
2. `useWeather` calls `fetchForecast` with the selected coordinates and unit preferences.
3. The API adapter builds a typed-by-contract request, checks the HTTP response, parses JSON, and validates the required response sections.
4. The hook aborts the previous request when its inputs change and prevents stale results from updating the screen.
5. Components format and render the current, hourly, and daily data without owning network logic.

Search follows the same boundary through `searchLocations`, with a debounce in `LocationSearch` and cancellation on query changes.

## 3. State ownership

- Weather data is remote state and stays inside `useWeather`.
- Selected location, favorites, units, language, and theme are user preferences composed at the application level.
- Preferences are persisted through `usePersistentState`, which guards reads and writes because browser storage can be disabled or malformed.
- There is no global Redux store because the application currently has one weather dashboard and no cross-route workflows that benefit from a heavier state container.

## 4. Resilience

- `AbortController` cancels obsolete weather and geocoding requests.
- API failures are normalized into readable error codes.
- The interface distinguishes initial loading, refresh, network failure, rate limiting, and no search results.
- Browser geolocation is opt-in and has separate permission and availability failure states.
- Unknown WMO codes fall back to a safe generic condition.
- Missing measurements render as an em dash rather than `NaN` or misleading zero values.

## 5. Accessibility and localization

- The location search exposes combobox/listbox semantics and supports arrow keys, Enter, and Escape.
- The layout uses semantic landmarks and labelled sections.
- Buttons that only show icons have accessible names.
- The application sets `lang` and `dir` at the document root when the selected language changes.
- Arabic uses RTL layout while preserving numerical and icon direction where appropriate.
- Motion is restrained and disabled under `prefers-reduced-motion`.

## 6. Styling strategy

CSS custom properties define page, panel, text, border, accent, and semantic colors. The light and dark palettes share the same components, avoiding duplicated markup or theme-specific component trees. Responsive breakpoints adapt the header controls, dashboard columns, metric cards, and forecast rows.

## 7. Provider and usage boundary

The public Open-Meteo endpoints are used for non-commercial access. Provider terms can change; confirm the current plan and attribution requirements before commercial use. Provider URLs and mapping logic are isolated in `src/features/weather/api/openMeteo.js`.
