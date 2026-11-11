import { describe, expect, it, vi } from "vitest";
import { airQualityPayload, CAIRO, forecastPayload, geocodingPayload } from "./fixtures";
import { fetchForecast, forecastUrl, normalizeForecast, searchPlaces } from "./openmeteo";
import { forecastResponseSchema } from "./schemas";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function router(routes: Record<string, () => Response>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    for (const [fragment, make] of Object.entries(routes)) if (url.includes(fragment)) return make();
    throw new Error(`Unexpected request: ${url}`);
  }) as unknown as typeof fetch;
}

describe("forecastUrl", () => {
  it("always requests metric units and unix timestamps", () => {
    const url = new URL(forecastUrl(CAIRO));
    expect(url.searchParams.get("temperature_unit")).toBe("celsius");
    expect(url.searchParams.get("wind_speed_unit")).toBe("kmh");
    expect(url.searchParams.get("timeformat")).toBe("unixtime");
    expect(url.searchParams.get("timezone")).toBe("Africa/Cairo");
    expect(url.searchParams.get("current")).toContain("wind_gusts_10m");
  });
});

describe("normalizeForecast", () => {
  const raw = forecastResponseSchema.parse(forecastPayload());
  const forecast = normalizeForecast(CAIRO, raw, { current: airQualityPayload.current }, 1_000);

  it("converts epoch seconds to ms and zips hourly arrays", () => {
    expect(forecast.hourly).toHaveLength(168);
    expect(forecast.hourly[1]!.time - forecast.hourly[0]!.time).toBe(3_600_000);
    expect(forecast.current.time).toBe(raw.current.time * 1000);
    expect(forecast.daily).toHaveLength(7);
    expect(forecast.daily[0]!.sunrise).toBe(raw.daily.sunrise![0]! * 1000);
  });

  it("maps booleans, air quality and fetch time", () => {
    expect(typeof forecast.hourly[0]!.isDay).toBe("boolean");
    expect(forecast.airQuality?.aqi).toBe(87);
    expect(forecast.fetchedAt).toBe(1_000);
  });

  it("tolerates missing and null measurements", () => {
    const sparse = forecastResponseSchema.parse({
      timezone: "UTC",
      utc_offset_seconds: 0,
      current: { time: 1_700_000_000 },
      hourly: { time: [1_700_000_000], temperature_2m: [null] },
      daily: { time: [1_700_000_000] },
    });
    const f = normalizeForecast(CAIRO, sparse, null, 0);
    expect(f.current.temperature).toBeNull();
    expect(f.hourly[0]!.temperature).toBeNull();
    expect(f.hourly[0]!.uv).toBeNull();
    expect(f.airQuality).toBeNull();
  });
});

describe("fetchForecast", () => {
  it("combines forecast and air quality", async () => {
    const fetchImpl = router({
      "/v1/forecast": () => json(forecastPayload()),
      "/v1/air-quality": () => json(airQualityPayload),
    });
    const f = await fetchForecast(CAIRO, { fetchImpl }, () => 42);
    expect(f.airQuality?.aqi).toBe(87);
    expect(f.fetchedAt).toBe(42);
  });

  it("still succeeds when only air quality fails", async () => {
    const fetchImpl = router({
      "/v1/forecast": () => json(forecastPayload()),
      "/v1/air-quality": () => json({}, 500),
    });
    const f = await fetchForecast(CAIRO, { fetchImpl, sleep: () => Promise.resolve() });
    expect(f.airQuality).toBeNull();
    expect(f.current.temperature).not.toBeNull();
  });

  it("fails when the forecast itself fails", async () => {
    const fetchImpl = router({
      "/v1/forecast": () => json({}, 500),
      "/v1/air-quality": () => json(airQualityPayload),
    });
    await expect(fetchForecast(CAIRO, { fetchImpl, sleep: () => Promise.resolve(), retries: 0 })).rejects.toMatchObject({
      code: "server",
    });
  });
});

describe("searchPlaces", () => {
  it("normalises geocoding results and requests the chosen language", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json(geocodingPayload)) as unknown as typeof fetch;
    const places = await searchPlaces("Cairo", { language: "ar", fetchImpl });
    expect(places).toHaveLength(2);
    expect(places[0]).toMatchObject({ id: "om-360630", countryCode: "EG", timezone: "Africa/Cairo", source: "search" });
    expect(String((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0])).toContain("language=ar");
  });

  it("does not hit the network for short queries and handles empty results", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    expect(await searchPlaces(" a ", { fetchImpl })).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
    const empty = vi.fn().mockResolvedValue(json({})) as unknown as typeof fetch;
    expect(await searchPlaces("zzzzzz", { fetchImpl: empty })).toEqual([]);
  });
});
