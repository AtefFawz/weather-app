import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeatherAlert } from '../src/pwa/alerts.js';

const now = new Date(2026, 10, 11, 13, 10);

function hourly(partial) {
  return {
    time: ['2026-11-11T10:00', '2026-11-11T15:00', '2026-11-11T18:00'],
    weather_code: [1, 1, 1],
    precipitation_probability: [0, 10, 10],
    temperature_2m: [28, 31, 29],
    ...partial,
  };
}

test('alerts on a thunderstorm in the next few hours', () => {
  const alert = buildWeatherAlert({
    hourly: hourly({ weather_code: [1, 95, 1] }),
    placeName: 'Kafr El-Dawwar',
    now,
  });
  assert.equal(alert.kind, 'storm');
  assert.match(alert.title, /Kafr El-Dawwar/);
  assert.match(alert.body, /15:00/);
});

test('rain probability outranks a later heat spike', () => {
  const alert = buildWeatherAlert({
    hourly: hourly({
      precipitation_probability: [0, 80, 10],
      temperature_2m: [28, 31, 42],
    }),
    now,
  });
  assert.equal(alert.kind, 'rain');
});

test('ignores hours that already passed', () => {
  const alert = buildWeatherAlert({
    hourly: hourly({ weather_code: [95, 1, 1], precipitation_probability: [90, 0, 0] }),
    daily: { uv_index_max: [2], time: ['2026-11-11'] },
    now,
  });
  assert.equal(alert, null);
});

test('falls back to a high UV day when the sky stays calm', () => {
  const alert = buildWeatherAlert({
    hourly: hourly(),
    daily: { uv_index_max: [9.4], time: ['2026-11-11'] },
    language: 'ar',
    placeName: 'كفر الدوار',
    now,
  });
  assert.equal(alert.kind, 'uv');
  assert.equal(alert.lang, 'ar');
  assert.match(alert.body, /9/);
});

test('uses the fahrenheit heat threshold', () => {
  const alert = buildWeatherAlert({
    hourly: hourly({ temperature_2m: [90, 105, 100] }),
    temperatureUnit: 'fahrenheit',
    now,
  });
  assert.equal(alert.kind, 'heat');
  assert.match(alert.body, /105°F/);
});
