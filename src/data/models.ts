/** Provider-independent domain model. Components and `core/` only ever see these types. */

export interface Place {
  id: string;
  name: string;
  admin1: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  /** IANA time zone, e.g. "Africa/Cairo". */
  timezone: string;
  /** How the place was chosen; device places get a localised label instead of a name. */
  source: "default" | "search" | "device";
}

export type Nullable<T> = T | null;

export interface CurrentConditions {
  /** Epoch ms */
  time: number;
  temperature: Nullable<number>;
  apparent: Nullable<number>;
  humidity: Nullable<number>;
  isDay: boolean;
  precipitation: Nullable<number>;
  weatherCode: Nullable<number>;
  cloudCover: Nullable<number>;
  pressure: Nullable<number>;
  windSpeed: Nullable<number>;
  windDirection: Nullable<number>;
  windGusts: Nullable<number>;
  uv: Nullable<number>;
}

export interface HourSample {
  /** Epoch ms at the start of the hour. */
  time: number;
  temperature: Nullable<number>;
  apparent: Nullable<number>;
  precipProbability: Nullable<number>;
  precipitation: Nullable<number>;
  weatherCode: Nullable<number>;
  isDay: boolean;
  windSpeed: Nullable<number>;
  uv: Nullable<number>;
  cloudCover: Nullable<number>;
  humidity: Nullable<number>;
}

export interface DaySample {
  /** Epoch ms at local midnight. */
  date: number;
  weatherCode: Nullable<number>;
  max: Nullable<number>;
  min: Nullable<number>;
  sunrise: Nullable<number>;
  sunset: Nullable<number>;
  uvMax: Nullable<number>;
  precipProbability: Nullable<number>;
  precipSum: Nullable<number>;
}

export interface AirQuality {
  /** US AQI */
  aqi: Nullable<number>;
  pm25: Nullable<number>;
  pm10: Nullable<number>;
  ozone: Nullable<number>;
  no2: Nullable<number>;
}

export interface Forecast {
  place: Place;
  /** Epoch ms when the data was fetched. */
  fetchedAt: number;
  timezone: string;
  utcOffsetSeconds: number;
  current: CurrentConditions;
  hourly: HourSample[];
  daily: DaySample[];
  airQuality: Nullable<AirQuality>;
}
