# Aether Weather Dashboard

Aether is a responsive weather dashboard built with React 19 and Vite. It presents current conditions, an hourly temperature outlook, a seven-day forecast, saved places, location search, geolocation, Arabic/English localization, and light/dark/system themes.

The project is designed as a front-end portfolio application with a clear service boundary, resilient request handling, accessible interactions, and no exposed API credentials.

## Product features

- **Live conditions:** temperature, feels-like temperature, humidity, wind, pressure, cloud cover, wind gusts, UV index, sunrise, and sunset.
- **City search:** debounced geocoding with keyboard navigation and location details.
- **Location access:** opt-in browser geolocation; the app never requests location access automatically.
- **Forecasts:** a 12-hour outlook and a seven-day forecast, including precipitation probability where provided by the API.
- **Saved places:** persist up to six frequently checked locations in local storage.
- **Preferences:** Celsius/Fahrenheit, km/h/mph, Arabic/English, and light/dark/system theme.
- **Resilient UI:** request cancellation, loading skeletons, retry states, network error handling, and empty search states.
- **Accessibility:** semantic landmarks, keyboard-operable search results, visible focus states, labels, and reduced-motion support.

## Tech stack

- React 19
- Vite 7
- Modern CSS with design tokens and responsive layouts
- Browser Fetch API and AbortController
- Open-Meteo Forecast and Geocoding APIs
- Node.js built-in test runner (`node:test`)
- ESLint 9

The previous Redux, Material UI, Emotion, Tailwind, Axios, Moment, and i18next layers were removed because this application does not need a global server-state store or multiple overlapping UI systems. Weather fetching now lives behind a dedicated API module and a focused React hook.

## Getting started

### Requirements

- Node.js 22 or newer (see `.nvmrc`)
- npm 10 or newer

### Install and run

```bash
npm ci
npm run dev
```

Vite starts at `http://localhost:5173`.

### Quality checks

```bash
npm run lint
npm test
npm run build
```

Or run all three in sequence:

```bash
npm run check
```

Preview the production build locally:

```bash
npm run preview
```

## Weather data provider

Aether uses:

- [Open-Meteo Forecast API](https://open-meteo.com/en/docs)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)

The public Open-Meteo endpoints used here do not require an API key for non-commercial use. Review the provider's current [terms and pricing](https://open-meteo.com/en/pricing) before using this project commercially. The application includes provider attribution in the footer. If you move to a commercial plan, update the endpoint and integration in `src/features/weather/api/openMeteo.js` according to the provider's account requirements.

No weather API key is stored in the repository or browser bundle.

## Project structure

```text
src/
├── app/
│   └── App.jsx                         # Application composition and preferences
├── features/
│   └── weather/
│       ├── api/
│       │   └── openMeteo.js             # Provider adapter and request errors
│       ├── components/
│       │   ├── DailyForecast.jsx
│       │   ├── HourlyForecast.jsx
│       │   ├── LocationSearch.jsx
│       │   ├── MetricCard.jsx
│       │   ├── WeatherDashboard.jsx
│       │   └── WeatherIcon.jsx
│       ├── hooks/
│       │   └── useWeather.js            # Request lifecycle and cancellation
│       └── utils/
│           └── weatherCode.js           # WMO code interpretation
├── lib/
│   ├── formatters.js
│   ├── icons.jsx
│   └── usePersistentState.js
├── locales/
│   └── messages.js                     # English and Arabic UI copy
├── main.jsx
└── styles.css

tests/
└── weather-utils.test.js
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data flow and design decisions.

## Deployment to GitHub Pages

The Vite production base path is configured as `/weather-app/` for the repository's GitHub Pages deployment. Local development uses `/`.

```bash
npm run deploy
```

The `deploy` script builds the app and publishes the `dist` directory using `gh-pages`. Ensure GitHub Pages is configured to serve from the `gh-pages` branch.

## Configuration

There are no required environment variables for the current non-commercial Open-Meteo integration. `.env.example` is included as a reminder that credentials should be added only if a future provider requires them. Never commit private API keys.

## Engineering notes

- API responses are validated for the fields needed by the interface before they enter the UI.
- Requests are aborted when a location or unit preference changes, preventing stale responses from overwriting newer selections.
- Search uses a debounce and AbortController to limit unnecessary geocoding requests. The result panel is capped, scrollable, closes on outside interaction, and reserves layout space so it does not cover the weather dashboard.
- Device-location identity is stored as structured data; its visible name and subtitle are resolved from the active locale, including previously saved coordinate-based locations.
- User location is requested only after an explicit action.
- Browser storage is treated as optional and guarded against unavailable or malformed values.
- Temperatures and wind values are requested from the provider in the selected units rather than converted inconsistently in presentation components.
- Forecast values are presented as model outputs; they are not represented as official warnings or guarantees.
