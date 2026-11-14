import { Droplets, Languages, LocateFixed, Moon, RefreshCw, Sun, SunMoon, Thermometer, Undo2, Wind } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatTemperature } from "@/core/format";
import { computeSky } from "@/core/sky-state";
import { placeKey } from "@/data/forecast-cache";
import type { Place } from "@/data/models";
import { Dashboard } from "@/features/forecast/dashboard";
import { placeLabel } from "@/features/forecast/place-label";
import { SavedPlaces } from "@/features/forecast/saved-places";
import { DashboardSkeleton } from "@/features/forecast/skeleton";
import { ErrorState, StatusBanner } from "@/features/forecast/status-banner";
import { updatedLabel } from "@/features/forecast/updated-label";
import { momentAt } from "@/features/forecast/view-model";
import { CommandPalette, type PaletteAction } from "@/features/search/command-palette";
import { SkyBackdrop } from "@/features/sky/sky-backdrop";
import { useForecast } from "@/hooks/use-forecast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useHotkey } from "@/hooks/use-hotkey";
import { useNow } from "@/hooks/use-now";
import { useOnline } from "@/hooks/use-online";
import { useI18n } from "@/i18n";
import { isSaved } from "@/state/app-state";
import { useAppActions, useAppState } from "@/state/context";
import { Footer } from "./footer";
import { Header } from "./header";
import { LaunchScreen } from "@/features/pwa/launch-screen";
import { readWeatherAlertsPreference } from "@/features/pwa/weather-alert-control";
import { useSevereWeatherAlert } from "@/features/pwa/use-severe-weather-alert";
import { useDocumentSettings } from "./use-document-settings";

export function Shell() {
  const { t, language } = useI18n();
  const actions = useAppActions();
  const temperatureUnit = useAppState((s) => s.temperatureUnit);
  const windUnit = useAppState((s) => s.windUnit);
  const theme = useAppState((s) => s.theme);
  const place = useAppState((s) => s.selected);
  const saved = useAppState((s) => s.saved);
  const state = useAppState((s) => s);

  useDocumentSettings(language, theme);

  const { forecast, status, error, refreshing, refresh } = useForecast(place);
  const now = useNow();
  const online = useOnline();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrubState, setScrubState] = useState<{ key: string; index: number } | null>(null);
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(readWeatherAlertsPreference);
  useSevereWeatherAlert(forecast, weatherAlertsEnabled, language);

  const key = placeKey(place);
  // The scrub position belongs to a place: switching place returns to "now" without an effect.
  const scrub = scrubState?.key === key ? scrubState.index : null;
  const setScrub = useCallback((index: number | null) => setScrubState(index === null ? null : { key, index }), [key]);

  const geo = useGeolocation(actions.selectPlace);
  const togglePalette = useCallback(() => setPaletteOpen((open) => !open), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  useHotkey(
    "k",
    (event) => {
      event.preventDefault();
      togglePalette();
    },
    { mod: true, allowInInput: true },
  );
  useHotkey("/", (event) => {
    event.preventDefault();
    openPalette();
  });

  const moment = forecast ? momentAt(forecast, scrub, now) : null;
  const atMinute = Math.floor((moment?.atMs ?? now) / 60_000);
  const lat = forecast?.place.latitude ?? place.latitude;
  const lon = forecast?.place.longitude ?? place.longitude;
  const code = moment?.weatherCode ?? 1;
  const cloud = moment?.cloudCover ?? null;
  const wind = moment?.windSpeed ?? null;
  // The React Compiler memoises this; SkyBackdrop is memo()-ed on the result.
  const sky = computeSky(lat, lon, atMinute * 60_000, { weatherCode: code, cloudCover: cloud, windKmh: wind });

  const label = forecast ? updatedLabel(now - forecast.fetchedAt, t) : "";
  const placeName = placeLabel(place, language, t).name;

  const title = moment ? `${formatTemperature(moment.temperature, temperatureUnit)} ${placeName} · ${t("brand")}` : null;
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  const paletteActions = useMemo<PaletteAction[]>(() => {
    const list: PaletteAction[] = [
      {
        id: "locate",
        label: t("useLocation"),
        icon: <LocateFixed aria-hidden="true" />,
        keywords: "gps device near me geolocation",
        run: geo.locate,
      },
      { id: "refresh", label: t("refresh"), icon: <RefreshCw aria-hidden="true" />, keywords: "reload update", run: refresh },
      { id: "now", label: t("backToNow"), icon: <Undo2 aria-hidden="true" />, keywords: "live reset time", run: () => setScrub(null) },
      {
        id: "unit-c",
        label: t("useCelsius"),
        icon: <Thermometer aria-hidden="true" />,
        keywords: "temperature metric",
        run: () => actions.setTemperatureUnit("celsius"),
      },
      {
        id: "unit-f",
        label: t("useFahrenheit"),
        icon: <Thermometer aria-hidden="true" />,
        keywords: "temperature imperial",
        run: () => actions.setTemperatureUnit("fahrenheit"),
      },
      {
        id: "wind-kmh",
        label: t("windUnitKmh"),
        icon: <Wind aria-hidden="true" />,
        keywords: "speed",
        run: () => actions.setWindUnit("kmh"),
      },
      {
        id: "wind-mph",
        label: t("windUnitMph"),
        icon: <Wind aria-hidden="true" />,
        keywords: "speed",
        run: () => actions.setWindUnit("mph"),
      },
      { id: "wind-ms", label: t("windUnitMs"), icon: <Wind aria-hidden="true" />, keywords: "speed", run: () => actions.setWindUnit("ms") },
      {
        id: "theme-light",
        label: t("themeLight"),
        icon: <Sun aria-hidden="true" />,
        keywords: "appearance",
        run: () => actions.setTheme("light"),
      },
      {
        id: "theme-dark",
        label: t("themeDark"),
        icon: <Moon aria-hidden="true" />,
        keywords: "appearance night",
        run: () => actions.setTheme("dark"),
      },
      {
        id: "theme-system",
        label: t("themeSystem"),
        icon: <SunMoon aria-hidden="true" />,
        keywords: "appearance auto",
        run: () => actions.setTheme("system"),
      },
      {
        id: "language",
        label: t("switchLanguage"),
        icon: <Languages aria-hidden="true" />,
        keywords: "arabic english عربي",
        run: () => actions.setLanguage(language === "en" ? "ar" : "en"),
      },
      {
        id: "save",
        label: isSaved(state, place) ? t("removePlace") : t("savePlace"),
        icon: <Droplets aria-hidden="true" />,
        keywords: "favorite star bookmark",
        run: () => actions.toggleSaved(place),
      },
    ];
    return list;
  }, [t, geo.locate, refresh, actions, language, state, place, setScrub]);

  const selectPlace = (next: Place) => actions.selectPlace(next);

  return (
    <>
      <SkyBackdrop sky={sky} />
      <div className="app">
        <a className="skip-link" href="#content">
          {t("skipToContent")}
        </a>
        <Header
          temperatureUnit={temperatureUnit}
          theme={theme}
          language={language}
          locating={geo.loading}
          onOpenPalette={openPalette}
          onLocate={geo.locate}
          onTemperatureUnit={actions.setTemperatureUnit}
          onTheme={actions.setTheme}
          onLanguage={actions.setLanguage}
          weatherAlertsEnabled={weatherAlertsEnabled}
          onWeatherAlertsChange={setWeatherAlertsEnabled}
        />

        <main id="content" tabIndex={-1} className="main">
          {geo.failure && (
            <p className="banner banner--warn" role="alert">
              <span>{geo.failure === "denied" ? t("locationDenied") : t("locationUnavailable")}</span>
              <button type="button" className="banner__dismiss" onClick={geo.clearFailure}>
                {t("dismiss")}
              </button>
            </p>
          )}
          <StatusBanner online={online} error={error} hasData={forecast !== null} updatedLabel={label} onRetry={refresh} />
          <SavedPlaces places={saved} selected={place} onSelect={selectPlace} onRemove={actions.toggleSaved} />

          {forecast && moment ? (
            <Dashboard
              forecast={forecast}
              place={place}
              now={now}
              scrub={scrub}
              onScrub={setScrub}
              temperatureUnit={temperatureUnit}
              windUnit={windUnit}
              saved={isSaved(state, place)}
              refreshing={refreshing}
              updatedLabel={label}
              onToggleSaved={() => actions.toggleSaved(place)}
              onRefresh={refresh}
              onWindUnit={actions.setWindUnit}
            />
          ) : status === "error" && error ? (
            <ErrorState error={error} onRetry={refresh} />
          ) : (
            <DashboardSkeleton />
          )}
        </main>
        <Footer />
      </div>

      <LaunchScreen />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        actions={paletteActions}
        saved={saved}
        selected={place}
        onSelectPlace={selectPlace}
      />
    </>
  );
}
