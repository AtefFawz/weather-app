import { useMemo } from "react";
import type { TemperatureUnit, WindUnit } from "@/core/units";
import type { Forecast, Place } from "@/data/models";
import { AirQualityCard } from "./air-quality-card";
import { Briefing } from "./briefing";
import { ConditionsCard } from "./conditions-card";
import { DailyForecast } from "./daily-forecast";
import { HourlyChart } from "./hourly-chart";
import { Hero } from "./hero";
import { MoonCard } from "./moon-card";
import { SunCard } from "./sun-card";
import { UvCard } from "./uv-card";
import { WindCard } from "./wind-card";
import { dayAt, momentAt, windowHours } from "./view-model";

interface Props {
  forecast: Forecast;
  place: Place;
  now: number;
  scrub: number | null;
  onScrub(index: number | null): void;
  temperatureUnit: TemperatureUnit;
  windUnit: WindUnit;
  saved: boolean;
  refreshing: boolean;
  updatedLabel: string;
  onToggleSaved(): void;
  onRefresh(): void;
  onWindUnit(unit: WindUnit): void;
}

export function Dashboard({
  forecast,
  place,
  now,
  scrub,
  onScrub,
  temperatureUnit,
  windUnit,
  saved,
  refreshing,
  updatedLabel,
  onToggleSaved,
  onRefresh,
  onWindUnit,
}: Props) {
  const moment = momentAt(forecast, scrub, now);
  const hours = useMemo(() => windowHours(forecast, now), [forecast, now]);
  const day = dayAt(forecast, moment.atMs);
  const nextDay = day ? forecast.daily[forecast.daily.indexOf(day) + 1] : undefined;
  const current = forecast.current;

  // While scrubbing, wind speed comes from the hour; gusts/direction/pressure exist only for "now".
  const gusts = moment.live ? current.windGusts : null;
  const direction = moment.live ? current.windDirection : null;

  return (
    <div className="dashboard">
      <div className="dashboard__top">
        <Hero
          forecast={forecast}
          place={place}
          moment={moment}
          highC={day?.max ?? null}
          lowC={day?.min ?? null}
          unit={temperatureUnit}
          saved={saved}
          refreshing={refreshing}
          updatedLabel={updatedLabel}
          onToggleSaved={onToggleSaved}
          onRefresh={onRefresh}
          onBackToNow={() => onScrub(null)}
        />
        <Briefing forecast={forecast} now={now} temperatureUnit={temperatureUnit} windUnit={windUnit} />
      </div>

      <HourlyChart
        hours={hours}
        latitude={forecast.place.latitude}
        longitude={forecast.place.longitude}
        timezone={forecast.timezone}
        unit={temperatureUnit}
        scrub={scrub}
        onScrub={onScrub}
      />

      <div className="dashboard__grid">
        <DailyForecast days={forecast.daily} timezone={forecast.timezone} unit={temperatureUnit} now={now} activeDay={day} />
        <div className="dashboard__tiles">
          <SunCard day={day} nextDay={nextDay} atMs={moment.atMs} timezone={forecast.timezone} />
          <WindCard speedKmh={moment.windSpeed} gustKmh={gusts} directionDeg={direction} unit={windUnit} onUnit={onWindUnit} />
          <UvCard uv={moment.uv} peak={day?.uvMax ?? null} />
          <AirQualityCard air={forecast.airQuality} />
          <MoonCard atMs={moment.atMs} />
          <ConditionsCard
            humidity={moment.humidity}
            pressure={moment.live ? current.pressure : null}
            cloudCover={moment.cloudCover}
            precipProbability={moment.precipProbability}
          />
        </div>
      </div>
    </div>
  );
}
