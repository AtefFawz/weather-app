/** WMO Weather interpretation codes used by Open-Meteo. */
const WEATHER_CODES = {
  0: { key: 'clear', icon: 'sun' },
  1: { key: 'mainlyClear', icon: 'sun-cloud' },
  2: { key: 'partlyCloudy', icon: 'cloud-sun' },
  3: { key: 'overcast', icon: 'cloud' },
  45: { key: 'fog', icon: 'fog' },
  48: { key: 'rimeFog', icon: 'fog' },
  51: { key: 'lightDrizzle', icon: 'rain' },
  53: { key: 'drizzle', icon: 'rain' },
  55: { key: 'heavyDrizzle', icon: 'rain' },
  56: { key: 'freezingDrizzle', icon: 'rain' },
  57: { key: 'heavyFreezingDrizzle', icon: 'rain' },
  61: { key: 'lightRain', icon: 'rain' },
  63: { key: 'rain', icon: 'rain' },
  65: { key: 'heavyRain', icon: 'rain-heavy' },
  66: { key: 'freezingRain', icon: 'rain' },
  67: { key: 'heavyFreezingRain', icon: 'rain-heavy' },
  71: { key: 'lightSnow', icon: 'snow' },
  73: { key: 'snow', icon: 'snow' },
  75: { key: 'heavySnow', icon: 'snow' },
  77: { key: 'snowGrains', icon: 'snow' },
  80: { key: 'lightShowers', icon: 'rain' },
  81: { key: 'showers', icon: 'rain' },
  82: { key: 'heavyShowers', icon: 'rain-heavy' },
  85: { key: 'snowShowers', icon: 'snow' },
  86: { key: 'heavySnowShowers', icon: 'snow' },
  95: { key: 'thunderstorm', icon: 'storm' },
  96: { key: 'thunderstormHail', icon: 'storm' },
  99: { key: 'heavyThunderstormHail', icon: 'storm' },
};

export function getWeatherInfo(code) {
  return WEATHER_CODES[Number(code)] || { key: 'unknown', icon: 'cloud' };
}

export function getWeatherLabel(code, translate) {
  return translate(getWeatherInfo(code).key);
}

export function getWeatherIcon(code) {
  return getWeatherInfo(code).icon;
}
