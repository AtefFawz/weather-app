import { describe, expect, it } from "vitest";
import { contrastRatio, hexToRgb } from "./color";
import { bodyPosition, clearSkyPalette, sceneFor, skyFor } from "./sky";

const clear = sceneFor({ weatherCode: 0 });

describe("sceneFor", () => {
  it("maps clear, rain and thunderstorm codes", () => {
    expect(sceneFor({ weatherCode: 0 }).precip).toBe("none");
    expect(sceneFor({ weatherCode: 63 })).toMatchObject({ precip: "rain", lightning: false });
    expect(sceneFor({ weatherCode: 95 }).lightning).toBe(true);
    expect(sceneFor({ weatherCode: 73 }).precip).toBe("snow");
  });

  it("prefers the measured cloud cover for dry codes but keeps rain overcast", () => {
    expect(sceneFor({ weatherCode: 1, cloudCover: 80 }).cloud).toBeCloseTo(0.8);
    expect(sceneFor({ weatherCode: 63, cloudCover: 10 }).cloud).toBeGreaterThan(0.7);
  });

  it("is safe for unknown inputs", () => {
    expect(sceneFor({ weatherCode: null }).precip).toBe("none");
    expect(sceneFor({ weatherCode: 999, windKmh: Number.NaN }).wind).toBe(0);
  });
});

describe("skyFor", () => {
  it("gets lighter as the Sun rises", () => {
    const night = hexToRgb(skyFor(-30, clear).mid);
    const day = hexToRgb(skyFor(50, clear).mid);
    expect(day[0] + day[1] + day[2]).toBeGreaterThan(night[0] + night[1] + night[2]);
  });

  it("is continuous across keyframe boundaries", () => {
    for (let e = -20; e < 60; e += 0.5) {
      const a = hexToRgb(skyFor(e, clear).mid);
      const b = hexToRgb(skyFor(e + 0.5, clear).mid);
      const jump = Math.max(...a.map((v, i) => Math.abs(v - (b[i] as number))));
      expect(jump).toBeLessThan(25);
    }
  });

  it("shows stars only at night and clear skies", () => {
    expect(skyFor(-30, clear).stars).toBeGreaterThan(0.9);
    expect(skyFor(20, clear).stars).toBe(0);
    expect(skyFor(-30, sceneFor({ weatherCode: 3 })).stars).toBeLessThan(0.2);
  });

  it("dulls and darkens the sky in a storm", () => {
    const sunny = hexToRgb(skyFor(40, clear).top);
    const storm = hexToRgb(skyFor(40, sceneFor({ weatherCode: 95 })).top);
    expect(storm[0] + storm[1] + storm[2]).toBeLessThan(sunny[0] + sunny[1] + sunny[2]);
    // less blue-dominant, i.e. desaturated
    expect(storm[2] - storm[0]).toBeLessThan(sunny[2] - sunny[0]);
  });

  it("keeps white text readable on the top of the sky at every elevation and weather", () => {
    const white = hexToRgb("#ffffff");
    for (const code of [0, 3, 45, 63, 95, 73]) {
      for (let e = -30; e <= 90; e += 5) {
        // 3:1 is the WCAG threshold for large text; the hero temperature is 6 rem.
        expect(contrastRatio(white, hexToRgb(skyFor(e, sceneFor({ weatherCode: code })).top))).toBeGreaterThan(3);
      }
    }
  });
});

describe("palette + position", () => {
  it("clamps outside the keyframe range", () => {
    expect(clearSkyPalette(-90)).toEqual(clearSkyPalette(-18));
    expect(clearSkyPalette(200)).toEqual(clearSkyPalette(90));
  });

  it("places the Sun low in the east and west, high at noon", () => {
    const sunrise = bodyPosition(2, 90);
    const noon = bodyPosition(60, 180);
    const sunset = bodyPosition(2, 270);
    expect(sunrise.x).toBeLessThan(0.3);
    expect(sunset.x).toBeGreaterThan(0.7);
    expect(noon.y).toBeLessThan(sunrise.y);
    expect(noon.x).toBeCloseTo(0.5, 1);
  });
});
