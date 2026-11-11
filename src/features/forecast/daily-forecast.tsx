import { CalendarDays, Droplets } from "lucide-react";
import { dayKey, formatTemperature, formatWeekday } from "@/core/format";
import type { TemperatureUnit } from "@/core/units";
import { getCondition } from "@/core/wmo";
import type { DaySample } from "@/data/models";
import { useI18n } from "@/i18n";
import { Card } from "./card";
import { WeatherGlyph } from "./weather-glyph";

interface Props {
  days: readonly DaySample[];
  timezone: string;
  unit: TemperatureUnit;
  now: number;
  activeDay: DaySample | undefined;
}

export function DailyForecast({ days, timezone, unit, now, activeDay }: Props) {
  const { t, language } = useI18n();
  const maxes = days.map((d) => d.max).filter((v): v is number => v !== null);
  const mins = days.map((d) => d.min).filter((v): v is number => v !== null);
  const lo = Math.min(...mins);
  const hi = Math.max(...maxes);
  const span = hi - lo || 1;
  const today = dayKey(now, timezone);

  return (
    <Card id="daily" title={t("dailyTitle")} icon={<CalendarDays aria-hidden="true" />} className="daily">
      <ol className="daily__list">
        {days.map((day) => {
          const isToday = dayKey(day.date, timezone) === today;
          const left = day.min === null ? 0 : ((day.min - lo) / span) * 100;
          const right = day.max === null ? 100 : ((day.max - lo) / span) * 100;
          const rain = day.precipProbability ?? 0;
          return (
            <li
              key={day.date}
              className="daily__row"
              aria-current={activeDay?.date === day.date ? "date" : undefined}
              data-active={activeDay?.date === day.date}
            >
              <span className="daily__day">{isToday ? t("today") : formatWeekday(day.date, timezone, language)}</span>
              <span className="daily__icon" title={t(getCondition(day.weatherCode).key)}>
                <WeatherGlyph code={day.weatherCode} />
                <span className="sr-only">{t(getCondition(day.weatherCode).key)}</span>
              </span>
              <span className="daily__rain">
                {rain >= 10 ? (
                  <>
                    <Droplets aria-hidden="true" /> <span aria-hidden="true">{Math.round(rain)}%</span>
                    <span className="sr-only">{`${t("precipChance")} ${Math.round(rain)}%`}</span>
                  </>
                ) : null}
              </span>
              <span className="daily__min">{formatTemperature(day.min, unit)}</span>
              <span className="daily__range" aria-hidden="true">
                <span className="daily__bar" style={{ insetInlineStart: `${left}%`, insetInlineEnd: `${100 - right}%` }} />
              </span>
              <span className="daily__max">{formatTemperature(day.max, unit)}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
