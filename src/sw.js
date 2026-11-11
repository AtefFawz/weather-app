import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { buildWeatherAlert } from './pwa/alerts.js';

const META_CACHE = 'aether-meta';
const TARGET_URL = 'https://aether.local/refresh-target';
const ALERT_URL = 'https://aether.local/last-alert';

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const base = import.meta.env.BASE_URL || '/';
registerRoute(new NavigationRoute(createHandlerBoundToURL(`${base}index.html`)));

registerRoute(
  ({ url, request }) => url.origin === 'https://api.open-meteo.com' && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'aether-forecast',
    networkTimeoutSeconds: 8,
    plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 12 })],
  }),
);

registerRoute(
  ({ url, request }) => url.origin === 'https://geocoding-api.open-meteo.com' && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'aether-geocode',
    networkTimeoutSeconds: 8,
    plugins: [new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  }),
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'aether-fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
);

function isForecastUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://api.open-meteo.com' && url.pathname.startsWith('/v1/forecast');
  } catch {
    return false;
  }
}

async function writeMeta(url, body) {
  const cache = await caches.open(META_CACHE);
  await cache.put(url, new Response(body));
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'REMEMBER_FORECAST' && isForecastUrl(data.payload?.url)) {
    const payload = {
      url: data.payload.url,
      placeName: String(data.payload.placeName || '').slice(0, 80),
      language: data.payload.language === 'ar' ? 'ar' : 'en',
      temperatureUnit: data.payload.temperatureUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
    };
    event.waitUntil(writeMeta(TARGET_URL, JSON.stringify(payload)));
  }

  if (data.type === 'ALERT_SHOWN' && typeof data.id === 'string') {
    event.waitUntil(writeMeta(ALERT_URL, data.id.slice(0, 180)));
  }
});

async function refreshSavedForecast() {
  const cache = await caches.open(META_CACHE);
  const saved = await cache.match(TARGET_URL);
  if (!saved) return;
  const meta = await saved.json();
  if (!isForecastUrl(meta.url)) return;

  const response = await fetch(meta.url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return;
  const payload = await response.json();
  const forecastCache = await caches.open('aether-forecast');
  await forecastCache.put(meta.url, response.clone());

  const alert = buildWeatherAlert({
    hourly: payload.hourly,
    daily: payload.daily,
    placeName: meta.placeName,
    language: meta.language,
    temperatureUnit: meta.temperatureUnit,
  });
  if (!alert) return;

  const previous = await cache.match(ALERT_URL);
  if (previous && (await previous.text()) === alert.id) return;

  const icon = `${base}icons/icon-192.png`;
  await self.registration.showNotification(alert.title, {
    body: alert.body,
    icon,
    badge: icon,
    tag: alert.tag,
    lang: alert.lang,
    data: { url: base },
  });
  await writeMeta(ALERT_URL, alert.id);
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'weather-refresh') event.waitUntil(refreshSavedForecast());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || base;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => 'focus' in client);
    if (existing) return existing.focus();
    return self.clients.openWindow(target);
  }));
});
