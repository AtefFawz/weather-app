import {
  Clock,
  Leaf,
  Moon,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Snowflake,
  TrendingDown,
  TrendingUp,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { computeInsights } from "@/core/insights";
import type { TemperatureUnit, WindUnit } from "@/core/units";
import type { Forecast } from "@/data/models";
import { useI18n } from "@/i18n";
import { Card } from "./card";
import { describeInsight, type InsightIcon } from "./insight-text";

const ICONS: Record<InsightIcon, LucideIcon> = {
  umbrella: Umbrella,
  sun: Sun,
  thermometer: Thermometer,
  snowflake: Snowflake,
  wind: Wind,
  leaf: Leaf,
  sparkles: Sparkles,
  sunset: Sunset,
  sunrise: Sunrise,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  clock: Clock,
  moon: Moon,
};

interface Props {
  forecast: Forecast;
  now: number;
  temperatureUnit: TemperatureUnit;
  windUnit: WindUnit;
}

export function Briefing({ forecast, now, temperatureUnit, windUnit }: Props) {
  const { t, language } = useI18n();
  const views = computeInsights(forecast, now).map((insight) =>
    describeInsight(insight, { t, language, timezone: forecast.timezone, temperatureUnit, windUnit }),
  );

  return (
    <Card id="briefing" title={t("briefing")} icon={<Sparkles aria-hidden="true" />} className="briefing">
      {views.length === 0 ? (
        <p className="muted">{t("briefingEmpty")}</p>
      ) : (
        <ul className="briefing__list">
          {views.map((view) => {
            const Icon = ICONS[view.icon];
            return (
              <li key={view.id} className={`briefing__item briefing__item--${view.tone}`}>
                <span className="briefing__icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>{view.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
