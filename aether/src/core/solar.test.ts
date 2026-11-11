import { describe, expect, it } from "vitest";
import { solarEvents, solarPosition } from "./solar";

const minutes = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 60_000;

describe("solarPosition", () => {
  it("puts the Sun nearly overhead at the equator on the March equinox at solar noon", () => {
    const { elevation } = solarPosition(new Date("2026-03-20T12:00:00Z"), 0, 0);
    expect(elevation).toBeGreaterThan(88);
  });

  it("puts the Sun below the horizon at local midnight", () => {
    expect(solarPosition(new Date("2026-06-21T00:00:00Z"), 30, 0).elevation).toBeLessThan(-20);
  });

  it("faces south at solar noon in the northern hemisphere", () => {
    const events = solarEvents(new Date("2026-11-10T10:00:00Z"), 31.13, 30.13);
    const { azimuth } = solarPosition(events.solarNoon, 31.13, 30.13);
    expect(Math.abs(azimuth - 180)).toBeLessThan(1);
  });

  it("is east in the morning and west in the evening", () => {
    const morning = solarPosition(new Date("2026-11-10T06:00:00Z"), 31.13, 30.13);
    const evening = solarPosition(new Date("2026-11-10T13:30:00Z"), 31.13, 30.13);
    expect(morning.azimuth).toBeGreaterThan(60);
    expect(morning.azimuth).toBeLessThan(130);
    expect(evening.azimuth).toBeGreaterThan(230);
    expect(evening.azimuth).toBeLessThan(300);
  });
});

describe("solarEvents", () => {
  it("matches published London sunrise and sunset on the June solstice (within 5 min)", () => {
    // timeanddate.com: 04:43 / 21:21 BST = 03:43 / 20:21 UTC
    const events = solarEvents(new Date("2026-06-21T12:00:00Z"), 51.5072, -0.1276);
    expect(minutes(events.sunrise!, new Date("2026-06-21T03:43:00Z"))).toBeLessThan(5);
    expect(minutes(events.sunset!, new Date("2026-06-21T20:21:00Z"))).toBeLessThan(5);
  });

  it("orders dawn < sunrise < noon < sunset < dusk", () => {
    const e = solarEvents(new Date("2026-11-10T10:00:00Z"), 31.13, 30.13);
    const t = [e.civilDawn, e.sunrise, e.solarNoon, e.sunset, e.civilDusk].map((d) => d!.getTime());
    expect([...t].sort((a, b) => a - b)).toEqual(t);
  });

  it("reports polar night and midnight sun", () => {
    expect(solarEvents(new Date("2026-12-21T12:00:00Z"), 80, 0).polar).toBe("night");
    expect(solarEvents(new Date("2026-06-21T12:00:00Z"), 80, 0).polar).toBe("day");
    expect(solarEvents(new Date("2026-12-21T12:00:00Z"), 80, 0).sunrise).toBeNull();
  });

  it("has day length about 12 h at the equator", () => {
    const e = solarEvents(new Date("2026-03-20T12:00:00Z"), 0, 0);
    const hours = (e.sunset!.getTime() - e.sunrise!.getTime()) / 3_600_000;
    expect(hours).toBeGreaterThan(11.9);
    expect(hours).toBeLessThan(12.3);
  });
});
