import { RefreshCw, Star, Undo2 } from "lucide-react";
import { formatDateTime, formatTemperature } from "@/core/format";
import { getCondition } from "@/core/wmo";
import { useI18n } from "@/i18n";
import type { Forecast, Place } from "@/data/models";
import { WeatherGlyph } from "./weather-glyph";
import { placeLabel } from "./place-label";
import type { Moment } from "./view-model";
import type { TemperatureUnit } from "@/core/units";
import { Button } from "@/components/button";

interface Props {
  forecast: Forecast;
  place: Place;
  moment: Moment;
  highC: number | null;
  lowC: number | null;
  unit: TemperatureUnit;
  saved: boolean;
  refreshing: boolean;
  updatedLabel: string;
  onToggleSaved(): void;
  onRefresh(): void;
  onBackToNow(): void;
}

export function Hero({
  forecast,
  place,
  moment,
  highC,
  lowC,
  unit,
  saved,
  refreshing,
  updatedLabel,
  onToggleSaved,
  onRefresh,
  onBackToNow,
}: Props) {
  const { t, language } = useI18n();
  const label = placeLabel(place, language, t);
  const condition = getCondition(moment.weatherCode);

  return (
    <section className="hero" aria-labelledby="hero-place">
      <div className="hero__meta">
        <div>
          <h1 id="hero-place" className="hero__place">
            {label.name}
          </h1>
          <p className="hero__subtitle">{label.subtitle}</p>
        </div>
        <div className="hero__actions">
          <Button
            variant="glass"
            size="icon"
            aria-pressed={saved}
            aria-label={saved ? t("removePlace") : t("savePlace")}
            title={saved ? t("removePlace") : t("savePlace")}
            onClick={onToggleSaved}
          >
            <Star aria-hidden="true" fill={saved ? "currentColor" : "none"} />
          </Button>
          <Button variant="glass" size="icon" aria-label={t("refresh")} title={t("refresh")} onClick={onRefresh} disabled={refreshing}>
            <RefreshCw aria-hidden="true" className={refreshing ? "spin" : undefined} />
          </Button>
        </div>
      </div>

      <p className="hero__time">
        <span className="pill">{formatDateTime(moment.atMs, forecast.timezone, language)}</span>
        {!moment.live && (
          <Button variant="glass" size="sm" onClick={onBackToNow}>
            <Undo2 aria-hidden="true" />
            {t("backToNow")}
          </Button>
        )}
      </p>

      <div className="hero__reading" aria-live="polite" aria-atomic="true">
        <WeatherGlyph code={moment.weatherCode} isDay={moment.isDay} className="hero__glyph" strokeWidth={1.1} />
        <div>
          <p className="hero__temp" data-testid="temperature">
            {formatTemperature(moment.temperature, unit)}
          </p>
          <p className="hero__condition">{t(condition.key)}</p>
        </div>
      </div>

      <dl className="hero__stats">
        <div>
          <dt>{t("feelsLike")}</dt>
          <dd>{formatTemperature(moment.apparent, unit)}</dd>
        </div>
        <div>
          <dt>{t("high")}</dt>
          <dd>{formatTemperature(highC, unit)}</dd>
        </div>
        <div>
          <dt>{t("low")}</dt>
          <dd>{formatTemperature(lowC, unit)}</dd>
        </div>
      </dl>

      <p className="hero__updated">{moment.live ? updatedLabel : t("forecastForHour")}</p>
    </section>
  );
}
