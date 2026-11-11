import { describe, expect, it } from "vitest";
import { createTranslator } from "@/i18n";
import { describeInsight, type InsightContext } from "./insight-text";

const ctx = (language: "en" | "ar", temperatureUnit: "celsius" | "fahrenheit" = "celsius"): InsightContext => ({
  t: createTranslator(language),
  language,
  timezone: "Africa/Cairo",
  temperatureUnit,
  windUnit: "kmh",
});
const at = Date.UTC(2026, 10, 10, 14, 0); // 16:00 Cairo

describe("describeInsight", () => {
  it("renders rain in the place's local time", () => {
    const view = describeInsight({ id: "rainSoon", tone: "warn", priority: 85, atMs: at, probability: 70 }, ctx("en"));
    expect(view.text).toMatch(/4:00\s?PM/);
    expect(view.text).toContain("70%");
    expect(view.icon).toBe("umbrella");
  });

  it("uses the chosen temperature unit for absolute values", () => {
    const hot = describeInsight({ id: "heat", tone: "warn", priority: 80, apparentC: 40 }, ctx("en", "fahrenheit"));
    expect(hot.text).toContain("104°F");
  });

  it("scales temperature differences without adding 32", () => {
    const view = describeInsight({ id: "warmerTomorrow", tone: "info", priority: 35, deltaC: 5 }, ctx("en", "fahrenheit"));
    expect(view.text).toContain("9°");
    expect(view.text).not.toContain("41");
  });

  it("renders every insight id in both languages without leftover placeholders", () => {
    const insights = [
      { id: "aqi", tone: "warn", priority: 1, aqi: 160, band: "unhealthy" },
      { id: "rainSoon", tone: "warn", priority: 1, atMs: at, probability: 60 },
      { id: "rainUntil", tone: "info", priority: 1, untilMs: at },
      { id: "heat", tone: "warn", priority: 1, apparentC: 38 },
      { id: "cold", tone: "warn", priority: 1, apparentC: 2 },
      { id: "windy", tone: "warn", priority: 1, gustKmh: 60 },
      { id: "uv", tone: "warn", priority: 1, uv: 8, atMs: at },
      { id: "bestWindow", tone: "good", priority: 1, startMs: at, endMs: at + 7_200_000 },
      { id: "dryDay", tone: "good", priority: 1 },
      { id: "warmerTomorrow", tone: "info", priority: 1, deltaC: 5 },
      { id: "coolerTomorrow", tone: "info", priority: 1, deltaC: 5 },
      { id: "sunset", tone: "info", priority: 1, inMs: 5_400_000 },
      { id: "sunrise", tone: "info", priority: 1, inMs: 600_000 },
      { id: "clearNight", tone: "good", priority: 1, moonIllumination: 0.2 },
    ] as const;
    for (const language of ["en", "ar"] as const) {
      for (const insight of insights) {
        const { text } = describeInsight(insight, ctx(language));
        expect(text.length).toBeGreaterThan(5);
        expect(text).not.toMatch(/\{\w+\}/);
      }
    }
  });
});
