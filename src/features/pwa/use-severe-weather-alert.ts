import { useEffect } from "react";
import type { Forecast } from "@/data/models";
import type { Language } from "@/state/app-state";
import { placeKey } from "@/data/forecast-cache";
import { en } from "@/i18n/en";
import { ar } from "@/i18n/ar";

const ALERT_PREFIX = "aether:v2:severe-alert:";
const pendingAlerts = new Set<string>();
const THUNDERSTORM_CODES = new Set([95, 96, 99]);
const INTENSE_WEATHER_CODES = new Set([65, 67, 82]);

function localDate(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    return parts;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function hasSevereWeather(forecast: Forecast): boolean {
  if (
    forecast.current.weatherCode !== null &&
    THUNDERSTORM_CODES.has(forecast.current.weatherCode)
  )
    return true;
  const horizon = Date.now() + 6 * 60 * 60_000;
  return forecast.hourly.some((hour) => {
    if (hour.time < Date.now() || hour.time > horizon) return false;
    if (
      hour.weatherCode !== null &&
      (THUNDERSTORM_CODES.has(hour.weatherCode) ||
        INTENSE_WEATHER_CODES.has(hour.weatherCode))
    )
      return true;
    return (
      (hour.precipProbability ?? 0) >= 90 && (hour.precipitation ?? 0) >= 3
    );
  });
}

/** Foreground alerts only. Background push requires a server-side Web Push sender and VAPID keys. */
export function useSevereWeatherAlert(
  forecast: Forecast | null,
  enabled: boolean,
  language: Language,
) {
  useEffect(() => {
    if (
      !enabled ||
      !forecast ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;
    if (Date.now() - forecast.fetchedAt > 90 * 60_000) return;
    if (!("serviceWorker" in navigator) || !hasSevereWeather(forecast)) return;

    const key = `${ALERT_PREFIX}${placeKey(forecast.place)}:${localDate(forecast.timezone)}`;
    if (pendingAlerts.has(key)) return;
    try {
      const previous = localStorage.getItem(key);
      if (previous === "sent") return;
      if (previous?.startsWith("pending:")) {
        const startedAt = Number(previous.slice("pending:".length));
        if (Number.isFinite(startedAt) && Date.now() - startedAt < 60_000)
          return;
      }
      localStorage.setItem(key, `pending:${Date.now()}`);
    } catch {
      // Continue without persistent deduplication if storage is unavailable.
    }
    pendingAlerts.add(key);

    const dictionary = language === "ar" ? ar : en;
    void navigator.serviceWorker.ready
      .then(async (registration) => {
        await registration.showNotification(dictionary.severeWeatherTitle, {
          body: dictionary.severeWeatherBody,
          icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
          badge: `${import.meta.env.BASE_URL}icons/icon-badge-96.png`,
          tag: `aether-severe-${placeKey(forecast.place)}`,

          dir: language === "ar" ? "rtl" : "ltr",
          lang: language,
        });
        pendingAlerts.delete(key);
        try {
          localStorage.setItem(key, "sent");
        } catch {
          // The browser notification was still delivered; only cross-render deduplication is lost.
        }
      })
      .catch(() => {
        pendingAlerts.delete(key);
        try {
          if (localStorage.getItem(key)?.startsWith("pending:"))
            localStorage.removeItem(key);
        } catch {
          // Storage is optional; failed notification delivery must not affect the dashboard.
        }
        // Notification delivery is optional; the dashboard remains fully usable.
      });
  }, [forecast, enabled, language]);
}
