import type { Forecast, HourSample } from "@/data/models";
import { aqiInfo, type AqiBand } from "./aqi";
import { bestWindow, type ComfortSample } from "./comfort";
import { getCondition } from "./wmo";
import { moonPhase } from "./moon";

/**
 * Rule-based "briefing" derived from the forecast. The engine is pure and language-free: it returns
 * structured facts (ids + raw numbers). Turning them into sentences is the UI layer's job, so the same
 * insights render in English and Arabic with the user's units.
 */
export type Insight =
  | { id: "aqi"; tone: "warn"; priority: number; aqi: number; band: AqiBand }
  | { id: "rainSoon"; tone: "warn"; priority: number; atMs: number; probability: number }
  | { id: "rainUntil"; tone: "info"; priority: number; untilMs: number }
  | { id: "heat"; tone: "warn"; priority: number; apparentC: number }
  | { id: "cold"; tone: "warn"; priority: number; apparentC: number }
  | { id: "windy"; tone: "warn"; priority: number; gustKmh: number }
  | { id: "uv"; tone: "warn"; priority: number; uv: number; atMs: number }
  | { id: "bestWindow"; tone: "good"; priority: number; startMs: number; endMs: number }
  | { id: "dryDay"; tone: "good"; priority: number }
  | { id: "warmerTomorrow" | "coolerTomorrow"; tone: "info"; priority: number; deltaC: number }
  | { id: "sunset"; tone: "info"; priority: number; inMs: number }
  | { id: "sunrise"; tone: "info"; priority: number; inMs: number }
  | { id: "clearNight"; tone: "good"; priority: number; moonIllumination: number };

const HOUR = 3_600_000;
export const MAX_INSIGHTS = 4;

/** Index of the hourly sample containing `now` (the latest one starting at or before it). */
export function currentHourIndex(hourly: readonly HourSample[], now: number): number {
  let index = -1;
  for (let i = 0; i < hourly.length; i += 1) {
    if ((hourly[i] as HourSample).time <= now) index = i;
    else break;
  }
  return Math.max(0, index);
}

const isWet = (h: HourSample) =>
  (h.precipProbability ?? 0) >= 50 || (h.precipitation ?? 0) >= 0.3 || getCondition(h.weatherCode).precip !== "none";
const isDry = (h: HourSample) =>
  (h.precipProbability ?? 0) < 30 && (h.precipitation ?? 0) < 0.1 && getCondition(h.weatherCode).precip === "none";

export function computeInsights(forecast: Forecast, now: number = forecast.current.time): Insight[] {
  const { hourly, daily, current, airQuality } = forecast;
  const start = currentHourIndex(hourly, now);
  const next12 = hourly.slice(start, start + 12);
  const next24 = hourly.slice(start, start + 24);
  const out: Insight[] = [];

  // Air quality
  const aqi = airQuality?.aqi;
  if (typeof aqi === "number" && aqi >= 101)
    out.push({ id: "aqi", tone: "warn", priority: 90, aqi: Math.round(aqi), band: aqiInfo(aqi).band });

  // Rain: either it is raining now (when does it stop?) or when does it start?
  const rainingNow = (current.precipitation ?? 0) > 0.1 || getCondition(current.weatherCode).precip !== "none";
  let rainInsight = false;
  if (rainingNow) {
    const stop = next12.findIndex(isDry);
    if (stop > 0) {
      out.push({ id: "rainUntil", tone: "info", priority: 85, untilMs: (next12[stop] as HourSample).time });
      rainInsight = true;
    }
  } else {
    const wet = next12.find(isWet);
    if (wet) {
      out.push({ id: "rainSoon", tone: "warn", priority: 85, atMs: wet.time, probability: Math.round(wet.precipProbability ?? 0) });
      rainInsight = true;
    }
  }

  // Temperature extremes (feels-like)
  const apparent = next12.map((h) => h.apparent).filter((v): v is number => v !== null);
  if (apparent.length > 0) {
    const hottest = Math.max(...apparent);
    const coldest = Math.min(...apparent);
    if (hottest >= 35) out.push({ id: "heat", tone: "warn", priority: 80, apparentC: Math.round(hottest) });
    else if (coldest <= 5) out.push({ id: "cold", tone: "warn", priority: 75, apparentC: Math.round(coldest) });
  }

  // Wind
  const gust = Math.max(current.windGusts ?? 0, ...next12.map((h) => h.windSpeed ?? 0));
  if (gust >= 45) out.push({ id: "windy", tone: "warn", priority: 70, gustKmh: Math.round(gust) });

  // UV (daytime only)
  const daytime = next12.filter((h) => h.isDay && h.uv !== null);
  if (daytime.length > 0) {
    const peak = daytime.reduce((a, b) => ((b.uv ?? 0) > (a.uv ?? 0) ? b : a));
    if ((peak.uv ?? 0) >= 6) out.push({ id: "uv", tone: "warn", priority: 65, uv: Math.round((peak.uv ?? 0) * 10) / 10, atMs: peak.time });
  }

  // Best window to be outside
  const samples: ComfortSample[] = next12.map((h) => ({
    apparent: h.apparent ?? h.temperature ?? 20,
    precipProbability: h.precipProbability ?? 0,
    wind: h.windSpeed ?? 0,
    uv: h.uv ?? 0,
    isDay: h.isDay,
  }));
  const window = bestWindow(samples, 2);
  if (window && window.score >= 70) {
    const first = next12[window.startIndex] as HourSample;
    out.push({ id: "bestWindow", tone: "good", priority: 60, startMs: first.time, endMs: first.time + 2 * HOUR });
  }

  // A dry day is only worth saying when nothing rain-related is already on the list.
  if (!rainInsight && !rainingNow && next24.length >= 12 && next24.every((h) => (h.precipProbability ?? 0) < 20)) {
    out.push({ id: "dryDay", tone: "good", priority: 40 });
  }

  // Tomorrow vs today
  const [today, tomorrow] = daily;
  if (today && tomorrow && today.max !== null && tomorrow.max !== null) {
    const delta = tomorrow.max - today.max;
    if (Math.abs(delta) >= 4)
      out.push({ id: delta > 0 ? "warmerTomorrow" : "coolerTomorrow", tone: "info", priority: 35, deltaC: Math.round(Math.abs(delta)) });
  }

  // Sun events
  const todays = daily.find((d) => d.sunset !== null && d.sunset > now && d.date <= now);
  if (todays?.sunset && todays.sunset - now <= 3 * HOUR) out.push({ id: "sunset", tone: "info", priority: 30, inMs: todays.sunset - now });
  const upcomingSunrise = daily.map((d) => d.sunrise).find((t): t is number => t !== null && t > now);
  if (!current.isDay && upcomingSunrise && upcomingSunrise - now <= 2 * HOUR)
    out.push({ id: "sunrise", tone: "info", priority: 30, inMs: upcomingSunrise - now });

  // Stargazing
  if (!current.isDay && (current.cloudCover ?? 100) < 30 && next12.every((h) => (h.precipProbability ?? 0) < 20)) {
    out.push({ id: "clearNight", tone: "good", priority: 25, moonIllumination: moonPhase(new Date(now)).illumination });
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, MAX_INSIGHTS);
}
