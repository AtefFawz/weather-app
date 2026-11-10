export function isDeviceLocation(location) {
  return location?.source === 'geolocation' || String(location?.id || '').startsWith('coordinates-');
}

export function getLocationPresentation(location, language, t) {
  if (isDeviceLocation(location)) {
    return {
      name: t('demoLocation'),
      subtitle: t('deviceLocationSubtitle'),
    };
  }

  const isDefaultLocation = location?.id === 'kafr-el-dawwar-eg';
  return {
    name: language === 'ar' && isDefaultLocation ? 'كفر الدوار' : location?.name || '—',
    subtitle: language === 'ar' && isDefaultLocation
      ? 'محافظة البحيرة، مصر'
      : [location?.admin1, location?.country].filter(Boolean).join(', ') || '—',
  };
}
