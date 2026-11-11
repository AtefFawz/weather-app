import { describe, expect, it } from "vitest";
import { FRESH_MS, ForecastCache, MAX_STALE_MS, placeKey } from "./forecast-cache";
import { CAIRO, forecastPayload } from "./fixtures";
import { normalizeForecast } from "./openmeteo";
import { forecastResponseSchema } from "./schemas";
import type { Forecast, Place } from "./models";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

const make = (place: Place, fetchedAt: number): Forecast =>
  normalizeForecast(place, forecastResponseSchema.parse(forecastPayload()), null, fetchedAt);

describe("ForecastCache", () => {
  it("returns fresh, then stale, then nothing as data ages", () => {
    let now = 1_000_000;
    const cache = new ForecastCache(new MemoryStorage(), () => now);
    cache.set(make(CAIRO, now));
    expect(cache.get(CAIRO)).toMatchObject({ fresh: true });
    now += FRESH_MS + 1;
    expect(cache.get(CAIRO)).toMatchObject({ fresh: false });
    now += MAX_STALE_MS;
    expect(cache.get(CAIRO)).toBeUndefined();
  });

  it("keys by coordinates rounded to 2 decimals", () => {
    expect(placeKey({ latitude: 30.0444, longitude: 31.2357 })).toBe("30.04,31.24");
    const cache = new ForecastCache(new MemoryStorage(), () => 1);
    cache.set(make(CAIRO, 1));
    expect(cache.get({ latitude: 30.0449, longitude: 31.2361 })).toBeDefined();
  });

  it("persists across instances and evicts least recently used beyond 8 entries", () => {
    const storage = new MemoryStorage();
    const a = new ForecastCache(storage, () => 1);
    for (let i = 0; i < 10; i += 1) a.set(make({ ...CAIRO, latitude: i, longitude: i }, 1));
    const b = new ForecastCache(storage, () => 1);
    expect(b.get({ latitude: 9, longitude: 9 })).toBeDefined();
    expect(b.get({ latitude: 0, longitude: 0 })).toBeUndefined();
  });

  it("survives corrupt or partially valid storage", () => {
    const storage = new MemoryStorage();
    storage.setItem("aether:v2:forecasts", "{not json");
    expect(() => new ForecastCache(storage, () => 1)).not.toThrow();
    storage.setItem("aether:v2:forecasts", JSON.stringify([{ key: "x" }, 5, null]));
    expect(new ForecastCache(storage, () => 1).get(CAIRO)).toBeUndefined();
  });

  it("works with no storage at all", () => {
    const cache = new ForecastCache(null, () => 1);
    cache.set(make(CAIRO, 1));
    expect(cache.get(CAIRO)).toBeDefined();
  });
});
