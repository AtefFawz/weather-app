import { currentHourIndex } from "@/core/insights";
import type { DaySample, Forecast, HourSample, Nullable } from "@/data/models";

export const WINDOW_HOURS = 48;

/** The 48 hours starting at the current hour: the range the chart shows and the scrubber travels. */
export function windowHours(forecast: Forecast, now: number, count = WINDOW_HOURS): HourSample[] {
  const start = currentHourIndex(forecast.hourly, now);
  return forecast.hourly.slice(start, start + count);
}

export interface Moment {
  /** Instant the dashboard is "looking at". */
  atMs: number;
  /** True when showing live conditions rather than a scrubbed forecast hour. */
  live: boolean;
  temperature: Nullable<number>;
  apparent: Nullable<number>;
  weatherCode: Nullable<number>;
  isDay: boolean;
  cloudCover: Nullable<number>;
  windSpeed: Nullable<number>;
  humidity: Nullable<number>;
  uv: Nullable<number>;
  precipProbability: Nullable<number>;
}

/** Live conditions, or the forecast for hour `scrub` of the window when the user is time-travelling. */
export function momentAt(forecast: Forecast, scrub: number | null, now: number): Moment {
  const hours = windowHours(forecast, now);
  const hour = scrub === null ? undefined : hours[Math.min(Math.max(scrub, 0), hours.length - 1)];
  if (!hour) {
    const c = forecast.current;
    return {
      atMs: now,
      live: true,
      temperature: c.temperature,
      apparent: c.apparent,
      weatherCode: c.weatherCode,
      isDay: c.isDay,
      cloudCover: c.cloudCover,
      windSpeed: c.windSpeed,
      humidity: c.humidity,
      uv: c.uv,
      precipProbability: hours[0]?.precipProbability ?? null,
    };
  }
  return {
    atMs: hour.time,
    live: false,
    temperature: hour.temperature,
    apparent: hour.apparent,
    weatherCode: hour.weatherCode,
    isDay: hour.isDay,
    cloudCover: hour.cloudCover,
    windSpeed: hour.windSpeed,
    humidity: hour.humidity,
    uv: hour.uv,
    precipProbability: hour.precipProbability,
  };
}

const DAY_MS = 86_400_000;

/** The daily entry covering an instant (falls back to the nearest day). */
export function dayAt(forecast: Forecast, atMs: number): DaySample | undefined {
  const { daily } = forecast;
  const exact = daily.find((d) => atMs >= d.date && atMs < d.date + DAY_MS);
  if (exact) return exact;
  return [...daily].sort((a, b) => Math.abs(a.date - atMs) - Math.abs(b.date - atMs))[0];
}

export const hasMeasurement = (value: Nullable<number>): value is number => value !== null && Number.isFinite(value);
