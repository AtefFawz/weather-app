import { describe, expect, it } from "vitest";
import { CAIRO, forecastPayload } from "@/data/fixtures";
import type { Forecast, HourSample } from "@/data/models";
import { normalizeForecast } from "@/data/openmeteo";
import { forecastResponseSchema } from "@/data/schemas";
import { computeInsights, currentHourIndex, MAX_INSIGHTS } from "./insights";

const HOUR = 3_600_000;
const base = (): Forecast => normalizeForecast(CAIRO, forecastResponseSchema.parse(forecastPayload()), { current: { us_aqi: 40 } }, 0);

/** Replace the next `count` hours (from "now") with a uniform sample. */
function withHours(f: Forecast, patch: Partial<HourSample>, count = 24): Forecast {
  const start = currentHourIndex(f.hourly, f.current.time);
  return { ...f, hourly: f.hourly.map((h, i) => (i >= start && i < start + count ? { ...h, ...patch } : h)) };
}

const calm: Partial<HourSample> = {
  precipProbability: 0,
  precipitation: 0,
  weatherCode: 1,
  windSpeed: 8,
  uv: 2,
  apparent: 22,
  temperature: 22,
  isDay: true,
};
const ids = (f: Forecast, now?: number) => computeInsights(f, now).map((i) => i.id);

describe("currentHourIndex", () => {
  it("finds the hour containing now, clamps at both ends", () => {
    const f = base();
    expect(currentHourIndex(f.hourly, f.hourly[5]!.time + 1000)).toBe(5);
    expect(currentHourIndex(f.hourly, 0)).toBe(0);
    expect(currentHourIndex(f.hourly, Number.MAX_SAFE_INTEGER)).toBe(f.hourly.length - 1);
    expect(currentHourIndex([], 5)).toBe(0);
  });
});

describe("computeInsights", () => {
  it("warns when rain is coming and says when", () => {
    const f = base(); // fixture: rain from index 16 (2h after "now")
    const insight = computeInsights(f).find((i) => i.id === "rainSoon");
    expect(insight).toMatchObject({ id: "rainSoon", probability: 70 });
    expect((insight as { atMs: number }).atMs).toBe(f.hourly[16]!.time);
  });

  it("says when rain will stop if it is raining now", () => {
    let f = withHours(base(), calm, 24);
    const now = f.current.time;
    f = { ...f, current: { ...f.current, precipitation: 1.2, weatherCode: 63 } };
    f = {
      ...f,
      hourly: f.hourly.map((h) =>
        h.time >= now && h.time < now + 3 * HOUR ? { ...h, precipProbability: 90, precipitation: 1, weatherCode: 63 } : h,
      ),
    };
    const rain = computeInsights(f).find((i) => i.id === "rainUntil");
    expect(rain).toBeDefined();
    expect((rain as { untilMs: number }).untilMs).toBe(now + 3 * HOUR);
  });

  it("celebrates a dry day and suggests the best window", () => {
    const f = withHours(base(), calm, 48);
    const result = ids({ ...f, current: { ...f.current, weatherCode: 1, precipitation: 0 } });
    expect(result).toContain("dryDay");
    expect(result).toContain("bestWindow");
    expect(result).not.toContain("rainSoon");
  });

  it("flags heat, cold, wind, UV and bad air quality", () => {
    const f = withHours(base(), calm, 48);
    expect(ids(withHours(f, { apparent: 41 }))).toContain("heat");
    expect(ids(withHours(f, { apparent: 1 }))).toContain("cold");
    expect(ids(withHours(f, { windSpeed: 60 }))).toContain("windy");
    expect(ids(withHours(f, { uv: 9, isDay: true }))).toContain("uv");
    expect(ids({ ...f, airQuality: { aqi: 160, pm25: 80, pm10: 90, ozone: 0, no2: 0 } })[0]).toBe("aqi");
    expect(ids({ ...f, airQuality: { aqi: 80, pm25: 8, pm10: 9, ozone: 0, no2: 0 } })).not.toContain("aqi");
  });

  it("never reports UV at night", () => {
    const f = withHours(base(), { ...calm, uv: 11, isDay: false }, 48);
    expect(ids(f)).not.toContain("uv");
  });

  it("compares tomorrow with today", () => {
    const f = base();
    const warmer = { ...f, daily: f.daily.map((d, i) => (i === 1 ? { ...d, max: (f.daily[0]!.max ?? 20) + 7 } : d)) };
    const cooler = { ...f, daily: f.daily.map((d, i) => (i === 1 ? { ...d, max: (f.daily[0]!.max ?? 20) - 6 } : d)) };
    expect(computeInsights(warmer, f.current.time + 0).find((i) => i.id === "warmerTomorrow")).toMatchObject({ deltaC: 7 });
    expect(ids(cooler)).toContain("coolerTomorrow");
  });

  it("announces sunset within 3 hours", () => {
    const f = base();
    const sunset = f.daily[0]!.sunset!;
    const insight = computeInsights(f, sunset - 90 * 60_000).find((i) => i.id === "sunset");
    expect(insight).toMatchObject({ inMs: 90 * 60_000 });
    expect(computeInsights(f, sunset - 5 * HOUR).some((i) => i.id === "sunset")).toBe(false);
  });

  it("suggests stargazing on a clear night", () => {
    const f = withHours(base(), { ...calm, isDay: false }, 48);
    const night = { ...f, current: { ...f.current, isDay: false, cloudCover: 5 } };
    expect(ids(night)).toContain("clearNight");
    expect(ids({ ...night, current: { ...night.current, cloudCover: 80 } })).not.toContain("clearNight");
  });

  it("returns at most four insights, highest priority first, and tolerates empty data", () => {
    const f = withHours(base(), { ...calm, apparent: 42, windSpeed: 70, uv: 10 }, 48);
    const list = computeInsights({ ...f, airQuality: { aqi: 180, pm25: 1, pm10: 1, ozone: 1, no2: 1 } });
    expect(list.length).toBeLessThanOrEqual(MAX_INSIGHTS);
    expect(list.map((i) => i.priority)).toEqual([...list.map((i) => i.priority)].sort((a, b) => b - a));
    expect(() => computeInsights({ ...base(), hourly: [], daily: [] })).not.toThrow();
  });
});
