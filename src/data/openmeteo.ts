import { getJson, type RequestOptions } from "./http";
import type { AirQuality, CurrentConditions, DaySample, Forecast, HourSample, Place } from "./models";
import {
  airQualityResponseSchema,
  forecastResponseSchema,
  geocodingResponseSchema,
  type AirQualityResponse,
  type ForecastResponse,
  type GeocodingResponse,
} from "./schemas";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

type Request = Pick<RequestOptions, "signal" | "fetchImpl" | "sleep" | "random" | "timeoutMs" | "retries">;

const CURRENT = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "is_day",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "uv_index",
];
const HOURLY = [
  "temperature_2m",
  "apparent_temperature",
  "precipitation_probability",
  "precipitation",
  "weather_code",
  "is_day",
  "wind_speed_10m",
  "uv_index",
  "cloud_cover",
  "relative_humidity_2m",
];
const DAILY = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "sunrise",
  "sunset",
  "uv_index_max",
  "precipitation_probability_max",
  "precipitation_sum",
];

export function forecastUrl(place: Pick<Place, "latitude" | "longitude" | "timezone">): string {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: CURRENT.join(","),
    hourly: HOURLY.join(","),
    daily: DAILY.join(","),
    // Always metric: unit conversion is a presentation concern, so toggling units never refetches.
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    // Epoch seconds avoid parsing zone-less local timestamps.
    timeformat: "unixtime",
    timezone: place.timezone || "auto",
    forecast_days: "7",
  }).toString();
  return url.toString();
}

export function airQualityUrl(place: Pick<Place, "latitude" | "longitude">): string {
  const url = new URL(AIR_QUALITY_URL);
  url.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide",
  }).toString();
  return url.toString();
}

const ms = (seconds: number) => seconds * 1000;
const at = <T>(array: readonly T[] | undefined, index: number): T | null => (array ? (array[index] ?? null) : null);
const msOrNull = (seconds: number | null): number | null => (seconds === null ? null : ms(seconds));

export function normalizeForecast(place: Place, raw: ForecastResponse, air: AirQualityResponse | null, fetchedAt: number): Forecast {
  const c = raw.current;
  const current: CurrentConditions = {
    time: ms(c.time),
    temperature: c.temperature_2m ?? null,
    apparent: c.apparent_temperature ?? null,
    humidity: c.relative_humidity_2m ?? null,
    isDay: c.is_day === undefined ? true : c.is_day === 1,
    precipitation: c.precipitation ?? null,
    weatherCode: c.weather_code ?? null,
    cloudCover: c.cloud_cover ?? null,
    pressure: c.pressure_msl ?? null,
    windSpeed: c.wind_speed_10m ?? null,
    windDirection: c.wind_direction_10m ?? null,
    windGusts: c.wind_gusts_10m ?? null,
    uv: c.uv_index ?? null,
  };

  const h = raw.hourly;
  const hourly: HourSample[] = h.time.map((time, i) => ({
    time: ms(time),
    temperature: at(h.temperature_2m, i),
    apparent: at(h.apparent_temperature, i),
    precipProbability: at(h.precipitation_probability, i),
    precipitation: at(h.precipitation, i),
    weatherCode: at(h.weather_code, i),
    isDay: at(h.is_day, i) !== 0,
    windSpeed: at(h.wind_speed_10m, i),
    uv: at(h.uv_index, i),
    cloudCover: at(h.cloud_cover, i),
    humidity: at(h.relative_humidity_2m, i),
  }));

  const d = raw.daily;
  const daily: DaySample[] = d.time.map((time, i) => ({
    date: ms(time),
    weatherCode: at(d.weather_code, i),
    max: at(d.temperature_2m_max, i),
    min: at(d.temperature_2m_min, i),
    sunrise: msOrNull(at(d.sunrise, i)),
    sunset: msOrNull(at(d.sunset, i)),
    uvMax: at(d.uv_index_max, i),
    precipProbability: at(d.precipitation_probability_max, i),
    precipSum: at(d.precipitation_sum, i),
  }));

  const airQuality: AirQuality | null = air
    ? {
        aqi: air.current.us_aqi ?? null,
        pm25: air.current.pm2_5 ?? null,
        pm10: air.current.pm10 ?? null,
        ozone: air.current.ozone ?? null,
        no2: air.current.nitrogen_dioxide ?? null,
      }
    : null;

  return { place, fetchedAt, timezone: raw.timezone, utcOffsetSeconds: raw.utc_offset_seconds, current, hourly, daily, airQuality };
}

/**
 * Fetch the forecast and (best effort) air quality in parallel. Air quality is optional: if only that
 * request fails the dashboard still renders, without the AQI card.
 */
export async function fetchForecast(place: Place, request: Request = {}, now: () => number = Date.now): Promise<Forecast> {
  const [forecast, air] = await Promise.allSettled([
    getJson(forecastUrl(place), forecastResponseSchema, request),
    getJson(airQualityUrl(place), airQualityResponseSchema, { ...request, retries: 1 }),
  ]);
  if (forecast.status === "rejected") throw forecast.reason;
  if (air.status === "rejected" && request.signal?.aborted) throw air.reason;
  return normalizeForecast(place, forecast.value, air.status === "fulfilled" ? air.value : null, now());
}

export function normalizePlaces(raw: GeocodingResponse): Place[] {
  return (raw.results ?? []).map((item) => ({
    id: `om-${item.id}`,
    name: item.name,
    admin1: item.admin1 ?? "",
    country: item.country ?? "",
    countryCode: item.country_code ?? "",
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone ?? "auto",
    source: "search",
  }));
}

export async function searchPlaces(query: string, options: Request & { language?: "en" | "ar" } = {}): Promise<Place[]> {
  const name = query.trim();
  if (name.length < 2) return [];
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({ name, count: "6", language: options.language ?? "en", format: "json" }).toString();
  return normalizePlaces(await getJson(url.toString(), geocodingResponseSchema, { ...options, retries: 1 }));
}
