import { z } from "zod";

/**
 * Runtime schemas for the parts of the Open-Meteo responses we read. The provider is an external
 * system, so its payloads are parsed, never trusted. Unknown extra keys are ignored.
 */
const num = z.number().nullable();
const numArray = z.array(num);

const hourlyArray = numArray.optional();

export const forecastResponseSchema = z.object({
  timezone: z.string(),
  utc_offset_seconds: z.number(),
  current: z.object({
    time: z.number(),
    temperature_2m: num.optional(),
    apparent_temperature: num.optional(),
    relative_humidity_2m: num.optional(),
    is_day: z.number().optional(),
    precipitation: num.optional(),
    weather_code: num.optional(),
    cloud_cover: num.optional(),
    pressure_msl: num.optional(),
    wind_speed_10m: num.optional(),
    wind_direction_10m: num.optional(),
    wind_gusts_10m: num.optional(),
    uv_index: num.optional(),
  }),
  hourly: z.object({
    time: z.array(z.number()),
    temperature_2m: hourlyArray,
    apparent_temperature: hourlyArray,
    precipitation_probability: hourlyArray,
    precipitation: hourlyArray,
    weather_code: hourlyArray,
    is_day: hourlyArray,
    wind_speed_10m: hourlyArray,
    uv_index: hourlyArray,
    cloud_cover: hourlyArray,
    relative_humidity_2m: hourlyArray,
  }),
  daily: z.object({
    time: z.array(z.number()),
    weather_code: hourlyArray,
    temperature_2m_max: hourlyArray,
    temperature_2m_min: hourlyArray,
    sunrise: hourlyArray,
    sunset: hourlyArray,
    uv_index_max: hourlyArray,
    precipitation_probability_max: hourlyArray,
    precipitation_sum: hourlyArray,
  }),
});
export type ForecastResponse = z.infer<typeof forecastResponseSchema>;

export const airQualityResponseSchema = z.object({
  current: z.object({
    us_aqi: num.optional(),
    pm2_5: num.optional(),
    pm10: num.optional(),
    ozone: num.optional(),
    nitrogen_dioxide: num.optional(),
  }),
});
export type AirQualityResponse = z.infer<typeof airQualityResponseSchema>;

export const geocodingResponseSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.string().optional(),
        admin1: z.string().optional(),
        country: z.string().optional(),
        country_code: z.string().optional(),
      }),
    )
    .optional(),
});
export type GeocodingResponse = z.infer<typeof geocodingResponseSchema>;
