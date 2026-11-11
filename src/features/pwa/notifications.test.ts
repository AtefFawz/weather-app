import { describe, expect, it } from "vitest";
import type { Forecast } from "@/data/models";
import { hasSevereWeather } from "./use-severe-weather-alert";

function makeForecast(currentCode: number | null, nextHourCode: number | null, offsetMs = 60_000): Forecast {
  return {
    place: {
      id: "test-place",
      name: "Test Place",
      admin1: "",
      country: "",
      countryCode: "",
      latitude: 30,
      longitude: 31,
      timezone: "UTC",
      source: "search",
    },
    fetchedAt: Date.now(),
    timezone: "UTC",
    utcOffsetSeconds: 0,
    current: {
      time: Date.now(),
      temperature: 20,
      apparent: 20,
      humidity: 40,
      isDay: true,
      precipitation: 0,
      weatherCode: currentCode,
      cloudCover: 10,
      pressure: 1013,
      windSpeed: 8,
      windDirection: 180,
      windGusts: 12,
      uv: 2,
    },
    hourly: nextHourCode === null ? [] : [{
      time: Date.now() + offsetMs,
      temperature: 20,
      apparent: 20,
      precipProbability: [65, 67, 82, 95, 96, 99].includes(nextHourCode) ? 95 : 10,
      precipitation: [65, 67, 82, 95, 96, 99].includes(nextHourCode) ? 3.2 : 0,
      weatherCode: nextHourCode,
      isDay: true,
      windSpeed: 8,
      uv: 2,
      cloudCover: 90,
      humidity: 80,
    }],
    daily: [],
    airQuality: null,
  };
}

describe("foreground weather alert conditions", () => {
  it("detects a current thunderstorm", () => {
    expect(hasSevereWeather(makeForecast(95, null))).toBe(true);
  });

  it("detects intense rain in the next six hours", () => {
    expect(hasSevereWeather(makeForecast(2, 82))).toBe(true);
  });

  it("ignores ordinary weather", () => {
    expect(hasSevereWeather(makeForecast(2, 3))).toBe(false);
  });

  it("ignores severe-looking conditions outside the six-hour alert window", () => {
    expect(hasSevereWeather(makeForecast(2, 95, 7 * 60 * 60_000))).toBe(false);
  });
});
