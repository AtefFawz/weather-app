import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeatherInfo, getWeatherLabel, getWeatherIcon } from '../src/features/weather/utils/weatherCode.js';
import { formatTemperature, formatWind, getWindDirection, getHourlyWindow } from '../src/lib/formatters.js';

test('maps common WMO weather codes to stable presentation keys', () => {
  assert.deepEqual(getWeatherInfo(0), { key: 'clear', icon: 'sun' });
  assert.deepEqual(getWeatherInfo(61), { key: 'lightRain', icon: 'rain' });
  assert.deepEqual(getWeatherInfo(95), { key: 'thunderstorm', icon: 'storm' });
});

test('unknown weather codes fail safely', () => {
  assert.deepEqual(getWeatherInfo(999), { key: 'unknown', icon: 'cloud' });
  assert.equal(getWeatherIcon(undefined), 'cloud');
});

test('weather labels use the provided locale resolver', () => {
  assert.equal(getWeatherLabel(0, (key) => ({ clear: 'Clear sky' })[key]), 'Clear sky');
});

test('formats metric and imperial values without changing source data', () => {
  assert.equal(formatTemperature(21.7), '22°C');
  assert.equal(formatTemperature(72.2, 'fahrenheit'), '72°F');
  assert.equal(formatTemperature(null), '—');
  assert.equal(formatWind(15.8, 'kmh'), '16 km/h');
  assert.equal(formatWind(10.2, 'mph'), '10 mph');
});

test('maps wind direction to compass points and Arabic labels', () => {
  assert.equal(getWindDirection(0), 'N');
  assert.equal(getWindDirection(90), 'E');
  assert.equal(getWindDirection(225, 'ar'), 'جنوب غرب');
  assert.equal(getWindDirection(360), 'N');
  assert.equal(getWindDirection(-45), 'NW');
  assert.equal(getWindDirection(undefined), '—');
});

test('selects the upcoming hourly window from current local time', () => {
  const hourly = {
    time: ['2026-11-10T08:00', '2026-11-10T09:00', '2026-11-10T10:00', '2026-11-10T11:00'],
    temperature_2m: [16, 17, 18, 19],
    precipitation_probability: [0, 10, 20, 30],
    weather_code: [0, 1, 2, 3],
  };
  const result = getHourlyWindow(hourly, '2026-11-10T09:00', 3);
  assert.equal(result.length, 3);
  assert.equal(result[0].temperature, 17);
  assert.equal(result[2].weatherCode, 3);
});

test('normalizes provider errors for network failures and rate limits', async () => {
  const { fetchForecast, WeatherApiError } = await import('../src/features/weather/api/openMeteo.js');
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('busy', { status: 429 });
    await assert.rejects(
      fetchForecast({ latitude: 30, longitude: 31 }, {}),
      (error) => error instanceof WeatherApiError && error.code === 'rate_limited',
    );

    globalThis.fetch = async () => { throw new TypeError('offline'); };
    await assert.rejects(
      fetchForecast({ latitude: 30, longitude: 31 }, {}),
      (error) => error instanceof WeatherApiError && error.code === 'network_error',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('builds a location-aware forecast request with chosen units', async () => {
  const { fetchForecast } = await import('../src/features/weather/api/openMeteo.js');
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  try {
    globalThis.fetch = async (url) => {
      requestedUrl = new URL(url);
      return new Response(JSON.stringify({ current: {}, hourly: {}, daily: {}, timezone: 'Africa/Cairo' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const result = await fetchForecast(
      { latitude: 31.2, longitude: 29.9, timezone: 'Africa/Cairo' },
      { temperatureUnit: 'fahrenheit', windSpeedUnit: 'mph' },
    );
    assert.equal(result.timezone, 'Africa/Cairo');
    assert.equal(requestedUrl.searchParams.get('temperature_unit'), 'fahrenheit');
    assert.equal(requestedUrl.searchParams.get('wind_speed_unit'), 'mph');
    assert.equal(requestedUrl.searchParams.get('timezone'), 'Africa/Cairo');
    assert.ok(requestedUrl.searchParams.get('current').includes('temperature_2m'));
    assert.equal(requestedUrl.searchParams.get('forecast_days'), '7');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('maps geocoding search results into stable application locations', async () => {
  const { searchLocations } = await import('../src/features/weather/api/openMeteo.js');
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  try {
    globalThis.fetch = async (url) => {
      requestedUrl = new URL(url);
      return new Response(JSON.stringify({
        results: [{
          id: 123,
          name: 'Cairo',
          admin1: 'Cairo Governorate',
          country: 'Egypt',
          country_code: 'EG',
          latitude: 30.0444,
          longitude: 31.2357,
          timezone: 'Africa/Cairo',
        }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    const locations = await searchLocations('Cairo', { language: 'ar' });
    assert.equal(locations.length, 1);
    assert.equal(locations[0].name, 'Cairo');
    assert.equal(locations[0].countryCode, 'EG');
    assert.equal(locations[0].timezone, 'Africa/Cairo');
    assert.equal(requestedUrl.searchParams.get('language'), 'ar');
    assert.equal(requestedUrl.searchParams.get('count'), '5');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('short location queries do not make unnecessary geocoding requests', async () => {
  const { searchLocations } = await import('../src/features/weather/api/openMeteo.js');
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new Error('Fetch should not be called'); };
    assert.deepEqual(await searchLocations(' A '), []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('keeps device-location labels synchronized with the active interface language', async () => {
  const { getLocationPresentation, isDeviceLocation } = await import('../src/features/weather/utils/location.js');
  const { messages } = await import('../src/locales/messages.js');
  const legacyPersistedLocation = {
    id: 'coordinates-30.044-31.236',
    name: 'موقعك الحالي',
    latitude: 30.044,
    longitude: 31.236,
  };

  assert.equal(isDeviceLocation(legacyPersistedLocation), true);
  assert.deepEqual(getLocationPresentation(legacyPersistedLocation, 'en', (key) => messages.en[key]), {
    name: 'Your location',
    subtitle: 'Based on your device location',
  });
  assert.deepEqual(getLocationPresentation(legacyPersistedLocation, 'ar', (key) => messages.ar[key]), {
    name: 'موقعك الحالي',
    subtitle: 'استنادًا إلى موقع جهازك',
  });
});

test('keeps the selected city name while localizing only the default city label', async () => {
  const { getLocationPresentation } = await import('../src/features/weather/utils/location.js');
  const { messages } = await import('../src/locales/messages.js');
  const translate = (language) => (key) => messages[language][key];

  assert.deepEqual(getLocationPresentation({ id: 'cairo-eg', name: 'Cairo', admin1: 'Cairo Governorate', country: 'Egypt' }, 'ar', translate('ar')), {
    name: 'Cairo',
    subtitle: 'Cairo Governorate, Egypt',
  });
  assert.equal(getLocationPresentation({ id: 'kafr-el-dawwar-eg', name: 'Kafr El-Dawwar', admin1: 'Beheira Governorate', country: 'Egypt' }, 'ar', translate('ar')).name, 'كفر الدوار');
});
