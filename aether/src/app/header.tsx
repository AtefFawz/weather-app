import { Languages, LocateFixed, Moon, Search, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/button";
import type { TemperatureUnit } from "@/core/units";
import { useI18n } from "@/i18n";
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
}: Props) {
  const { t } = useI18n();
  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : SunMoon;
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="header">
      <a className="brand" href="#main" aria-label={`${t("brand")} — ${t("tagline")}`}>
        <svg viewBox="0 0 32 32" className="brand__mark" aria-hidden="true">
          <circle cx="16" cy="16" r="6.5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8" />
          </g>
        </svg>
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
