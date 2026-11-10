import { formatDay, formatTemperature } from '../../../lib/formatters';
import { getWeatherIcon, getWeatherLabel } from '../utils/weatherCode';
import { WeatherIcon } from './WeatherIcon';

function isFiniteValue(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

export function DailyForecast({ days, language, temperatureUnit, t }) {
  if (!days?.length) return null;

  const ranges = days.flatMap((day) => (
    isFiniteValue(day.min) && isFiniteValue(day.max)
      ? [Number(day.min), Number(day.max)]
      : []
  ));
  const minValue = ranges.length ? Math.min(...ranges) : 0;
  const maxValue = ranges.length ? Math.max(...ranges) : minValue;
  const span = Math.max(maxValue - minValue, 1);

  return (
    <section className="panel daily-panel" aria-labelledby="daily-title">
      <div className="section-heading">
        <div>
          <span className="section-kicker">{t('outlook') || (language === 'ar' ? 'نظرة عامة' : 'THE OUTLOOK')}</span>
          <h2 id="daily-title">{t('sevenDay')}</h2>
        </div>
        <span className="section-meta">7 {language === 'ar' ? 'أيام' : 'DAYS'}</span>
      </div>
      <div className="daily-list">
        {days.map((day, index) => {
          const validRange = isFiniteValue(day.min) && isFiniteValue(day.max);
          const low = validRange ? Number(day.min) : minValue;
          const high = validRange ? Number(day.max) : low;
          const left = validRange ? ((low - minValue) / span) * 100 : 0;
          const width = validRange ? Math.max(((high - low) / span) * 100, 7) : 0;
          return (
            <div className={`daily-row ${index === 0 ? 'daily-row--today' : ''}`} key={day.date}>
              <span className="daily-row__day">{index === 0 ? t('today') : formatDay(day.date, language)}</span>
              <div className="daily-row__condition">
                <WeatherIcon kind={getWeatherIcon(day.code)} size="xs" />
                <span>{getWeatherLabel(day.code, t)}</span>
              </div>
              <div className="daily-row__precip" title={isFiniteValue(day.precipitation) ? `${day.precipitation}%` : '—'}>
                {isFiniteValue(day.precipitation) && day.precipitation > 0 ? `${Math.round(day.precipitation)}%` : '—'}
              </div>
              <span className="daily-row__temp daily-row__temp--low">{formatTemperature(day.min, temperatureUnit)}</span>
              <div className="daily-row__range"><span style={{ insetInlineStart: `${left}%`, width: `${width}%` }} /></div>
              <span className="daily-row__temp">{formatTemperature(day.max, temperatureUnit)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
