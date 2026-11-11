import { describe, expect, it } from "vitest";
import { computeSky } from "./sky-state";

const CAIRO = { lat: 30.0444, lon: 31.2357 };

describe("computeSky", () => {
  it("is day at noon and night at midnight in Cairo", () => {
    const noon = computeSky(CAIRO.lat, CAIRO.lon, Date.UTC(2026, 10, 10, 10, 0), { weatherCode: 0 });
    const night = computeSky(CAIRO.lat, CAIRO.lon, Date.UTC(2026, 10, 10, 22, 0), { weatherCode: 0 });
    expect(noon.elevation).toBeGreaterThan(30);
    expect(noon.sun.visible).toBe(true);
    expect(noon.moon.visible).toBe(false);
    expect(night.elevation).toBeLessThan(-20);
    expect(night.sun.visible).toBe(false);
    expect(night.colors.stars).toBeGreaterThan(0.9);
  });

  it("raises the Sun between sunrise and noon and lowers it after", () => {
    const at = (h: number) => computeSky(CAIRO.lat, CAIRO.lon, Date.UTC(2026, 10, 10, h, 0), { weatherCode: 1 });
    expect(at(8).sun.y).toBeLessThan(at(5).sun.y);
    expect(at(10).sun.y).toBeLessThan(at(14).sun.y);
    expect(at(5).sun.x).toBeLessThan(at(14).sun.x);
  });

  it("hides the Moon near new moon and carries the weather scene", () => {
    const sky = computeSky(CAIRO.lat, CAIRO.lon, Date.UTC(2026, 10, 9, 22, 0), { weatherCode: 63, windKmh: 30 });
    expect(sky.moon.phase.illumination).toBeLessThan(0.05);
    expect(sky.moon.visible).toBe(false);
    expect(sky.scene).toMatchObject({ precip: "rain", wind: 30 });
  });
});
