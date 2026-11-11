const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export class WeatherApiError extends Error {
  constructor(message, code = 'request_failed', status = 0) {
    super(message);
    this.name = 'WeatherApiError';
    this.code = code;
    this.status = status;
  }
}

async function requestJson(url, signal) {
  let response;
  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new WeatherApiError('Unable to reach the weather service.', 'network_error');
  }

  if (!response.ok) {
    throw new WeatherApiError(
      `Weather service returned ${response.status}.`,
      response.status === 429 ? 'rate_limited' : 'http_error',
      response.status,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new WeatherApiError('The weather service returned an invalid response.', 'invalid_response');
  }
}

export async function searchLocations(query, { language = 'en', signal } = {}) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name: trimmed,
    count: '5',
    language: language === 'ar' ? 'ar' : 'en',
    format: 'json',
  }).toString();

  const payload = await requestJson(url, signal);
  return (payload.results || []).map((item) => ({
    id: `${item.id}-${item.latitude}-${item.longitude}`,
    name: item.name,
    admin1: item.admin1 || '',
    country: item.country || '',
    countryCode: item.country_code || '',
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone || 'auto',
  }));
}

export function buildForecastUrl(location, {
  temperatureUnit = 'celsius',
  windSpeedUnit = 'kmh',
} = {}) {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'uv_index',
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'weather_code',
      'is_day',
      'relative_humidity_2m',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_probability_max',
    ].join(','),
    timezone: location.timezone || 'auto',
    forecast_days: '7',
    temperature_unit: temperatureUnit,
    wind_speed_unit: windSpeedUnit,
  }).toString();

  return url;
}

export async function fetchForecast(location, options = {}) {
  const url = buildForecastUrl(location, options);
  const payload = await requestJson(url, options.signal);
  if (!payload.current || !payload.daily || !payload.hourly) {
    throw new WeatherApiError('Weather data is incomplete.', 'incomplete_data');
  }

  return payload;
}
