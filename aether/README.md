# Aether

> The weather, as a living sky.

Aether turns the forecast into a sky you can read at a glance. The colours come from the **real position of the Sun** at the selected place and time, modified by the actual weather. Drag across the 48-hour chart and the whole sky travels with you.

![Dashboard](docs/screenshots/dashboard-day.png)

| Time travel                                      | Command palette                                  |
| ------------------------------------------------ | ------------------------------------------------ |
| ![Night](docs/screenshots/time-travel-night.png) | ![Palette](docs/screenshots/command-palette.png) |

| Mobile                                                             | Arabic · RTL · light                         |
| ------------------------------------------------------------------ | -------------------------------------------- |
| <img src="docs/screenshots/mobile.png" width="260" alt="Mobile" /> | ![Arabic](docs/screenshots/arabic-light.png) |

## Features

- **Live sky:** NOAA solar position, golden hour and twilight, stars, Sun and Moon (with phase), drifting clouds, fog, canvas rain/snow, lightning.
- **Time travel:** drag or use the keyboard (←/→, PageUp/PageDown, Home/End, Esc) on the 48-hour chart.
- **Briefing:** rule-based insights (rain soon, heat, UV peak, air quality, best window outside, sunset…).
- **Command palette:** `Ctrl/⌘ + K` or `/` to search places and run commands.
- **Details:** 7-day forecast, sun arc, wind compass, UV gauge, air quality, moon phase, humidity/cloud/pressure.
- **Preferences:** °C/°F, km/h · mph · m/s, light/dark/system, English/العربية (RTL), saved places, geolocation (opt-in).
- **Resilient:** stale-while-revalidate cache, offline banner, retry with backoff, installable PWA.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # format, lint, typecheck, unit tests, build
npm run e2e        # Playwright (mocked network)
```

Node 22+ (`.nvmrc`). First e2e run: `npx playwright install chromium`.
Deploying under a sub-path: `BASE_PATH=/aether/ npm run build`.

## Stack

Vite 7 · React 19 + React Compiler · TypeScript strict · Zod 4 · Vitest · Playwright + axe · vite-plugin-pwa · self-hosted fonts (Manrope, Noto Sans Arabic).

## Structure

```
src/
  core/      pure logic: solar, moon, sky, particles, insights, spline, units, format
  data/      HTTP, Zod schemas, Open-Meteo adapter, cache
  state/     versioned persisted store
  hooks/     forecast (SWR), online, clock, geolocation, hotkeys
  i18n/      typed EN/AR dictionaries
  features/  sky · forecast · search
  app/       shell, header, footer
tests/e2e/   Playwright specs
docs/        ARCHITECTURE, REFACTOR, ADRs, screenshots
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/REFACTOR.md](docs/REFACTOR.md) and [docs/adr](docs/adr).

## Honest limitations

- The Moon's on-screen position is stylised; the sky is an artistic model driven by real geometry, not a camera or an ephemeris.
- Forecasts are model output and can differ from local observations.
- Data comes from [Open-Meteo](https://open-meteo.com/) (CC BY 4.0; the free API is for non-commercial use).
- The bundled e2e tests and screenshots use mocked responses; they never call the live API.
