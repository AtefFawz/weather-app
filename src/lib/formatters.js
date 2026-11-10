export function formatTemperature(value, unit = 'celsius') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const rounded = Math.round(Number(value));
  return `${rounded}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

export function formatWind(value, unit = 'kmh') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const suffix = unit === 'mph' ? 'mph' : 'km/h';
  return `${Math.round(Number(value))} ${suffix}`;
}

export function formatClock(value, locale = 'en') {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function getLocalClock(timezone, locale = 'en', now = new Date()) {
  if (!timezone) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: timezone,
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(now);
  }
}

export function formatDay(value, locale = 'en') {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
}

export function formatHour(value, locale = 'en') {
  if (!value) return '—';
  const [hourString] = value.split('T').slice(1);
  const hour = Number(hourString?.slice(0, 2));
  if (Number.isNaN(hour)) return '—';
  const date = new Date(2000, 0, 1, hour);
  return new Intl.DateTimeFormat(locale, { hour: 'numeric' }).format(date);
}

export function getWindDirection(degrees, locale = 'en') {
  if (degrees === null || degrees === undefined || !Number.isFinite(Number(degrees))) return '—';
  const directions = locale === 'ar'
    ? ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب']
    : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const normalized = ((Number(degrees) % 360) + 360) % 360;
  return directions[Math.round(normalized / 45) % 8];
}

export function getHourlyWindow(hourly, currentTime, count = 12) {
  if (!hourly?.time?.length) return [];
  const currentHour = String(currentTime || '').slice(0, 13);
  let startIndex = hourly.time.findIndex((time) => time >= currentHour);
  if (startIndex < 0) startIndex = 0;
  return hourly.time.slice(startIndex, startIndex + count).map((time, offset) => {
    const index = startIndex + offset;
    return {
      time,
      temperature: hourly.temperature_2m?.[index],
      probability: hourly.precipitation_probability?.[index],
      weatherCode: hourly.weather_code?.[index],
      isDay: hourly.is_day?.[index],
      humidity: hourly.relative_humidity_2m?.[index],
    };
  });
}
