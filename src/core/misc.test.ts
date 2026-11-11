import { describe, expect, it } from "vitest";
import { aqiInfo } from "./aqi";
import { bestWindow, comfortScore, type ComfortSample } from "./comfort";
import { contrastRatio, hexToRgb, mixRgb, rgbToHex } from "./color";
import { fuzzyFilter, fuzzyScore } from "./fuzzy";
import { moonPhase } from "./moon";
import { ParticleSystem } from "./particles";
import { createRng } from "./random";
import { monotonePath, monotoneTangents, monotoneValueAt } from "./spline";
import { convertTemperature, convertWind } from "./units";
import { getCondition } from "./wmo";

describe("color", () => {
  it("round-trips hex and mixes", () => {
    expect(rgbToHex(hexToRgb("#1a2b3c"))).toBe("#1a2b3c");
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(rgbToHex(mixRgb(hexToRgb("#000000"), hexToRgb("#ffffff"), 0.5))).toBe("#808080");
    expect(() => hexToRgb("nope")).toThrow(RangeError);
  });
  it("computes WCAG contrast", () => {
    expect(contrastRatio(hexToRgb("#000"), hexToRgb("#fff"))).toBeCloseTo(21, 0);
  });
});

describe("units", () => {
  it("converts temperature and wind", () => {
    expect(convertTemperature(0, "fahrenheit")).toBe(32);
    expect(convertTemperature(100, "celsius")).toBe(100);
    expect(convertWind(100, "mph")).toBeCloseTo(62.14, 1);
    expect(convertWind(36, "ms")).toBe(10);
  });
});

describe("wmo", () => {
  it("resolves known and unknown codes", () => {
    expect(getCondition(95).lightning).toBe(true);
    expect(getCondition(73).precip).toBe("snow");
    expect(getCondition(12345).key).toBe("unknown");
    expect(getCondition(null).key).toBe("unknown");
    expect(getCondition(61.0).key).toBe("lightRain");
  });
});

describe("aqi", () => {
  it("bands at the EPA boundaries", () => {
    expect(aqiInfo(0).band).toBe("good");
    expect(aqiInfo(50).band).toBe("good");
    expect(aqiInfo(51).band).toBe("moderate");
    expect(aqiInfo(151).band).toBe("unhealthy");
    expect(aqiInfo(999).band).toBe("hazardous");
    expect(aqiInfo(-5).band).toBe("good");
  });
});

describe("moon", () => {
  it("is new moon near 2000-01-06 and full about two weeks later", () => {
    expect(moonPhase(new Date("2000-01-06T18:14:00Z")).name).toBe("newMoon");
    const full = moonPhase(new Date("2000-01-21T04:40:00Z"));
    expect(full.name).toBe("fullMoon");
    expect(full.illumination).toBeGreaterThan(0.98);
  });
  it("agrees with the November 2026 lunar calendar (new ~9th, full ~24th)", () => {
    expect(moonPhase(new Date("2026-11-09T21:00:00Z")).illumination).toBeLessThan(0.02);
    expect(moonPhase(new Date("2026-11-24T14:00:00Z")).illumination).toBeGreaterThan(0.97);
  });
});

describe("spline", () => {
  const pts = [
    { x: 0, y: 10 },
    { x: 1, y: 10 },
    { x: 2, y: 30 },
    { x: 3, y: 30 },
    { x: 4, y: 5 },
  ];
  it("never overshoots the data (monotone)", () => {
    for (let x = 0; x <= 4; x += 0.05) {
      const y = monotoneValueAt(pts, x);
      expect(y).toBeGreaterThanOrEqual(5 - 1e-9);
      expect(y).toBeLessThanOrEqual(30 + 1e-9);
    }
  });
  it("passes through the sample points and has flat tangents at extrema", () => {
    for (const p of pts) expect(monotoneValueAt(pts, p.x)).toBeCloseTo(p.y, 6);
    const t = monotoneTangents(pts);
    expect(t[2]).toBe(0);
  });
  it("emits a valid path and handles degenerate input", () => {
    expect(monotonePath(pts).startsWith("M0,10C")).toBe(true);
    expect(monotonePath([])).toBe("");
    expect(monotonePath([{ x: 1, y: 2 }])).toBe("M1,2");
    expect(monotoneValueAt([], 1)).toBeNaN();
  });
});

describe("particles", () => {
  const base = { kind: "rain" as const, intensity: 1, wind: 0, width: 1280, height: 720, seed: 7 };
  it("scales count with intensity and is deterministic per seed", () => {
    const heavy = new ParticleSystem(base);
    const light = new ParticleSystem({ ...base, intensity: 0.2 });
    expect(heavy.count).toBeGreaterThan(light.count * 3);
    expect([...new ParticleSystem(base).x.slice(0, 5)]).toEqual([...heavy.x.slice(0, 5)]);
    expect(new ParticleSystem({ ...base, intensity: 0 }).count).toBe(0);
  });
  it("keeps every particle inside the (padded) bounds after many steps, with wind", () => {
    for (const kind of ["rain", "snow"] as const) {
      const system = new ParticleSystem({ ...base, kind, wind: 50 });
      for (let i = 0; i < 600; i += 1) system.step(1 / 60);
      for (let i = 0; i < system.count; i += 1) {
        expect(system.y[i]).toBeGreaterThanOrEqual(-21);
        expect(system.y[i]).toBeLessThanOrEqual(741);
        expect(system.x[i]).toBeGreaterThanOrEqual(-21);
        expect(system.x[i]).toBeLessThanOrEqual(1301);
      }
    }
  });
  it("clamps huge frame gaps and rescales on resize", () => {
    const system = new ParticleSystem(base);
    const y0 = system.y[0] as number;
    system.step(60);
    expect(Math.abs((system.y[0] as number) - y0)).toBeLessThan(120);
    system.resize(640, 360);
    expect(system.size).toEqual({ width: 640, height: 360 });
  });
});

describe("random", () => {
  it("is reproducible and uniform-ish", () => {
    const a = createRng(5);
    const b = createRng(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    const r = createRng(1);
    const mean = Array.from({ length: 2000 }, r).reduce((s, v) => s + v, 0) / 2000;
    expect(mean).toBeGreaterThan(0.45);
    expect(mean).toBeLessThan(0.55);
  });
});

describe("comfort", () => {
  const nice: ComfortSample = { apparent: 22, precipProbability: 0, wind: 8, uv: 3, isDay: true };
  it("scores ideal conditions 100 and penalises each discomfort", () => {
    expect(comfortScore(nice)).toBe(100);
    expect(comfortScore({ ...nice, apparent: 40 })).toBeLessThan(60);
    expect(comfortScore({ ...nice, precipProbability: 100 })).toBe(60);
    expect(comfortScore({ ...nice, isDay: false })).toBeLessThan(100);
    expect(comfortScore({ ...nice, apparent: -50, wind: 200, precipProbability: 100, uv: 15, isDay: false })).toBe(0);
  });
  it("finds the best window and keeps the earliest tie", () => {
    const samples = [nice, { ...nice, precipProbability: 90 }, nice, nice, { ...nice, apparent: 40 }];
    expect(bestWindow(samples, 2)).toMatchObject({ startIndex: 2, endIndex: 4 });
    expect(bestWindow([nice, nice, nice], 2)?.startIndex).toBe(0);
    expect(bestWindow([nice], 2)).toBeNull();
  });
});

describe("fuzzy", () => {
  it("matches subsequences, prefers prefixes, rejects non-matches", () => {
    expect(fuzzyScore("fahr", "Use Fahrenheit")).not.toBeNull();
    expect(fuzzyScore("xyz", "Use Fahrenheit")).toBeNull();
    expect(fuzzyScore("use", "Use Fahrenheit")!).toBeGreaterThan(fuzzyScore("use", "Reuse of something")!);
    expect(fuzzyScore("", "anything")).toBe(0);
  });
  it("filters and ranks, ignoring case and diacritics", () => {
    const items = ["Switch to dark theme", "Use Fahrenheit", "Refresh", "Café mode"];
    expect(fuzzyFilter(items, "dark", (s) => s)[0]).toBe("Switch to dark theme");
    expect(fuzzyFilter(items, "cafe", (s) => s)).toEqual(["Café mode"]);
    expect(fuzzyFilter(items, "  ", (s) => s)).toHaveLength(4);
  });
});
