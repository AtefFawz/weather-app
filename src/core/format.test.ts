import { describe, expect, it } from "vitest";
import {
  compassPoint,
  dayKey,
  formatClock,
  formatNumber,
  formatTemperature,
  formatWeekday,
  formatWindSpeed,
  hourOfDay,
  splitDuration,
} from "./format";

describe("temperature and wind", () => {
  it("rounds, converts and labels", () => {
    expect(formatTemperature(21.6, "celsius")).toBe("22°");
    expect(formatTemperature(21.6, "celsius", true)).toBe("22°C");
    expect(formatTemperature(0, "fahrenheit", true)).toBe("32°F");
    expect(formatTemperature(-0.4, "celsius")).toBe("0°");
    expect(formatTemperature(null, "celsius")).toBe("—");
    expect(formatTemperature(Number.NaN, "celsius")).toBe("—");
    expect(formatWindSpeed(36, "ms")).toBe("10 m/s");
    expect(formatWindSpeed(100, "mph", false)).toBe("62");
    expect(formatWindSpeed(undefined, "kmh")).toBe("—");
  });
  it("formats numbers with Western digits in both languages", () => {
    expect(formatNumber(1016.4, "ar")).toBe("1,016");
    expect(formatNumber(2.345, "en", 1)).toBe("2.3");
    expect(formatNumber(null, "en")).toBe("—");
  });
});

describe("time zones", () => {
  // 2026-11-10T12:30:00Z is 14:30 in Cairo (UTC+2) and 07:30 in New York (UTC-5)
  const t = Date.UTC(2026, 10, 10, 12, 30);
  it("formats the clock in the place's zone, not the viewer's", () => {
    expect(formatClock(t, "Africa/Cairo", "en")).toMatch(/2:30\s?PM/);
    expect(formatClock(t, "America/New_York", "en")).toMatch(/7:30\s?AM/);
    expect(formatClock(null, "UTC", "en")).toBe("—");
  });
  it("computes the local hour and day across midnight", () => {
    expect(hourOfDay(t, "Africa/Cairo")).toBe(14);
    expect(hourOfDay(Date.UTC(2026, 10, 10, 22, 0), "Africa/Cairo")).toBe(0);
    expect(dayKey(Date.UTC(2026, 10, 10, 22, 30), "Africa/Cairo")).toBe("2026-11-11");
    expect(dayKey(Date.UTC(2026, 10, 10, 22, 30), "UTC")).toBe("2026-11-10");
  });
  it("falls back gracefully for unknown or 'auto' zones", () => {
    expect(() => formatClock(t, "Not/AZone", "en")).not.toThrow();
    expect(formatClock(t, "auto", "en")).toMatch(/12:30/);
  });
  it("localises weekdays", () => {
    expect(formatWeekday(t, "Africa/Cairo", "en")).toBe("Tue");
    expect(formatWeekday(t, "Africa/Cairo", "ar")).toBe("الثلاثاء");
  });
});

describe("misc", () => {
  it("maps degrees to 8-point compass indexes", () => {
    expect(compassPoint(0)).toBe(0);
    expect(compassPoint(359)).toBe(0);
    expect(compassPoint(90)).toBe(2);
    expect(compassPoint(-45)).toBe(7);
    expect(compassPoint(null)).toBeNull();
  });
  it("splits durations", () => {
    expect(splitDuration(90 * 60_000)).toEqual({ hours: 1, minutes: 30 });
    expect(splitDuration(-5)).toEqual({ hours: 0, minutes: 0 });
  });
});
