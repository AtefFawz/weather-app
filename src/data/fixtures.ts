import type { Place } from "./models";

export const CAIRO: Place = {
  id: "om-360630",
  name: "Cairo",
  admin1: "Cairo Governorate",
  country: "Egypt",
  countryCode: "EG",
  latitude: 30.0444,
  longitude: 31.2357,
  timezone: "Africa/Cairo",
  source: "search",
};

/**
 * Deterministic provider payload shaped like Open-Meteo's response with `timeformat=unixtime`.
 * `startSeconds` is local midnight of day one (UTC+2). Used by unit tests and the Playwright suite.
 */
export function forecastPayload(startSeconds = Date.UTC(2026, 10, 10, 0, 0) / 1000 - 2 * 3600, utcOffsetSeconds = 7200) {
  const hours = 7 * 24;
  const time = Array.from({ length: hours }, (_, i) => startSeconds + i * 3600);
  const localHour = (i: number) => i % 24;
  const temp = (i: number) => Math.round((18 + 7 * Math.sin(((localHour(i) - 9) / 24) * 2 * Math.PI)) * 10) / 10;
  const isDay = (i: number) => (localHour(i) >= 6 && localHour(i) < 17 ? 1 : 0);
  const code = (i: number) => (i >= 16 && i < 21 ? 61 : i >= 21 && i < 26 ? 3 : localHour(i) < 12 ? 1 : 2);

  const nowIndex = 14;
  return {
    latitude: 30.04,
    longitude: 31.24,
    timezone: "Africa/Cairo",
    utc_offset_seconds: utcOffsetSeconds,
    current: {
      time: time[nowIndex],
      temperature_2m: temp(nowIndex),
      apparent_temperature: temp(nowIndex) - 1.5,
      relative_humidity_2m: 54,
      is_day: isDay(nowIndex),
      precipitation: 0,
      weather_code: code(nowIndex),
      cloud_cover: 35,
      pressure_msl: 1016.4,
      wind_speed_10m: 14.2,
      wind_direction_10m: 315,
      wind_gusts_10m: 27.5,
      uv_index: 3.4,
    },
    hourly: {
      time,
      temperature_2m: time.map((_, i) => temp(i)),
      apparent_temperature: time.map((_, i) => temp(i) - 1.5),
      precipitation_probability: time.map((_, i) => (i >= 16 && i < 21 ? 70 : 5)),
      precipitation: time.map((_, i) => (i >= 16 && i < 21 ? 0.6 : 0)),
      weather_code: time.map((_, i) => code(i)),
      is_day: time.map((_, i) => isDay(i)),
      wind_speed_10m: time.map((_, i) => 10 + (i % 7)),
      uv_index: time.map((_, i) => (isDay(i) ? Math.max(0, 6 - Math.abs(localHour(i) - 12)) : 0)),
      cloud_cover: time.map((_, i) => (i >= 16 && i < 26 ? 90 : 30)),
      relative_humidity_2m: time.map(() => 55),
    },
    daily: {
      time: Array.from({ length: 7 }, (_, d) => startSeconds + d * 86400),
      weather_code: [2, 61, 3, 1, 0, 2, 3],
      temperature_2m_max: [25, 23, 22, 24, 26, 25, 22],
      temperature_2m_min: [14, 15, 13, 12, 14, 15, 13],
      sunrise: Array.from({ length: 7 }, (_, d) => startSeconds + d * 86400 + 6 * 3600 + 20 * 60),
      sunset: Array.from({ length: 7 }, (_, d) => startSeconds + d * 86400 + 16 * 3600 + 50 * 60),
      uv_index_max: [6, 4, 3, 6, 6, 5, 3],
      precipitation_probability_max: [70, 80, 20, 5, 0, 10, 30],
      precipitation_sum: [2, 5, 0.2, 0, 0, 0, 0.5],
    },
  };
}

export const airQualityPayload = {
  current: { us_aqi: 87, pm2_5: 24.1, pm10: 48.3, ozone: 62, nitrogen_dioxide: 18.4 },
};

export const geocodingPayload = {
  results: [
    {
      id: 360630,
      name: "Cairo",
      latitude: 30.04,
      longitude: 31.24,
      timezone: "Africa/Cairo",
      admin1: "Cairo Governorate",
      country: "Egypt",
      country_code: "EG",
    },
    {
      id: 4180439,
      name: "Cairo",
      latitude: 33.03,
      longitude: -83.96,
      timezone: "America/New_York",
      admin1: "Georgia",
      country: "United States",
      country_code: "US",
    },
  ],
};
