import { describe, expect, it } from "vitest";
import { CAIRO, forecastPayload } from "@/data/fixtures";
import { normalizeForecast } from "@/data/openmeteo";
import { forecastResponseSchema } from "@/data/schemas";
import { dayAt, momentAt, WINDOW_HOURS, windowHours } from "./view-model";

const forecast = normalizeForecast(CAIRO, forecastResponseSchema.parse(forecastPayload()), null, 0);
const now = forecast.current.time;

describe("windowHours", () => {
  it("starts at the current hour and spans 48 hours", () => {
    const hours = windowHours(forecast, now);
    expect(hours).toHaveLength(WINDOW_HOURS);
    expect(hours[0]!.time).toBe(now);
  });
  it("shrinks gracefully near the end of the data", () => {
    const late = forecast.hourly.at(-3)!.time;
    expect(windowHours(forecast, late)).toHaveLength(3);
  });
});

describe("momentAt", () => {
  it("returns live conditions when not scrubbing", () => {
    const m = momentAt(forecast, null, now + 5 * 60_000);
    expect(m.live).toBe(true);
    expect(m.temperature).toBe(forecast.current.temperature);
    expect(m.atMs).toBe(now + 5 * 60_000);
  });
  it("returns the forecast hour when scrubbing, clamped to the window", () => {
    const m = momentAt(forecast, 3, now);
    expect(m.live).toBe(false);
    expect(m.atMs).toBe(now + 3 * 3_600_000);
    expect(momentAt(forecast, 999, now).atMs).toBe(windowHours(forecast, now).at(-1)!.time);
    expect(momentAt(forecast, -4, now).atMs).toBe(now);
  });
});

describe("dayAt", () => {
  it("finds the day containing an instant", () => {
    expect(dayAt(forecast, now)).toBe(forecast.daily[0]);
    expect(dayAt(forecast, now + 30 * 3_600_000)).toBe(forecast.daily[1]);
  });
  it("falls back to the nearest day outside the range", () => {
    expect(dayAt(forecast, now + 40 * 86_400_000)).toBe(forecast.daily.at(-1));
  });
});
