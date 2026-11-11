import { Languages, LocateFixed, Moon, Search, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/button";
import type { TemperatureUnit } from "@/core/units";
import { useI18n } from "@/i18n";
import { InstallControl } from "@/features/pwa/install-control";
import { WeatherAlertControl } from "@/features/pwa/weather-alert-control";
import type { Language, ThemePreference } from "@/state/app-state";

interface Props {
  temperatureUnit: TemperatureUnit;
  theme: ThemePreference;
  language: Language;
  locating: boolean;
  onOpenPalette(): void;
  onLocate(): void;
  onTemperatureUnit(unit: TemperatureUnit): void;
  onTheme(theme: ThemePreference): void;
  onLanguage(language: Language): void;
  weatherAlertsEnabled: boolean;
  onWeatherAlertsChange(enabled: boolean): void;
}

const NEXT_THEME: Record<ThemePreference, ThemePreference> = { system: "light", light: "dark", dark: "system" };

export function Header({
  temperatureUnit,
  theme,
  language,
  locating,
  onOpenPalette,
  onLocate,
  onTemperatureUnit,
  onTheme,
  onLanguage,
  weatherAlertsEnabled,
  onWeatherAlertsChange,
}: Props) {
  const { t } = useI18n();
  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : SunMoon;
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="header">
      <a className="brand" href="#content" aria-label={`${t("brand")} — ${t("tagline")}`}>
        <img
          className="brand__mark"
          src={`${import.meta.env.BASE_URL}icons/aether-app-icon.svg`}
          alt=""
          width="34"
          height="34"
        />
        <span>{t("brand")}</span>
      </a>

      <button
        type="button"
        className="header__search"
        onClick={onOpenPalette}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K /"
      >
        <Search aria-hidden="true" />
        <span>{t("searchPlaceholder")}</span>
        <kbd>{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>

      <div className="header__controls">
        <InstallControl />
        <WeatherAlertControl enabled={weatherAlertsEnabled} onChange={onWeatherAlertsChange} />
        <Button variant="glass" size="icon" onClick={onLocate} disabled={locating} aria-label={t("useLocation")} title={t("useLocation")}>
          <LocateFixed aria-hidden="true" className={locating ? "spin" : undefined} />
        </Button>

        <div className="segmented" role="group" aria-label={t("temperatureUnits")}>
          {(["celsius", "fahrenheit"] as const).map((unit) => (
            <button key={unit} type="button" aria-pressed={temperatureUnit === unit} onClick={() => onTemperatureUnit(unit)}>
              {unit === "celsius" ? "°C" : "°F"}
            </button>
          ))}
        </div>

        <Button
          variant="glass"
          size="icon"
          onClick={() => onTheme(NEXT_THEME[theme])}
          aria-label={`${t("theme")}: ${t(theme)}`}
          title={`${t("theme")}: ${t(theme)}`}
        >
          <ThemeIcon aria-hidden="true" />
        </Button>

        <Button
          variant="glass"
          size="icon"
          onClick={() => onLanguage(language === "en" ? "ar" : "en")}
          aria-label={t("switchLanguage")}
          title={t("switchLanguage")}
          lang={language === "en" ? "ar" : "en"}
        >
          <Languages aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
