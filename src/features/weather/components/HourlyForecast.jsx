import { formatHour, formatTemperature } from '../../../lib/formatters';
import { getWeatherIcon } from '../utils/weatherCode';
import { WeatherIcon } from './WeatherIcon';

function isFiniteValue(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

export function HourlyForecast({ items, language, temperatureUnit, t }) {
  if (!items?.length) return null;

  const chartItems = items
    .map((item, index) => ({ item, index, value: Number(item.temperature) }))
    .filter(({ item }) => isFiniteValue(item.temperature));
  const values = chartItems.map(({ value }) => value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : min;
  const range = Math.max(max - min, 1);
  const pointFor = ({ item, index, value }) => {
    const x = 18 + (index * 664) / Math.max(items.length - 1, 1);
    const y = 92 - (((value - min) / range) * 50);
    return { x, y, key: item.time };
  };
  const chartPoints = chartItems.map(pointFor);
  const points = chartPoints.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <section className="panel hourly-panel" aria-labelledby="hourly-title">
      <div className="section-heading">
        <div>
          <span className="section-kicker">{t('nextHours')}</span>
          <h2 id="hourly-title">{t('hourlyForecast')}</h2>
        </div>
        <span className="section-meta">12 {language === 'ar' ? 'ساعة' : 'HOURS'}</span>
      </div>
      <div className="hourly-chart" aria-hidden="true">
        <svg viewBox="0 0 700 112" preserveAspectRatio="none">
          <defs>
            <linearGradient id="temperature-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity=".2" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {chartPoints.length > 0 && (
            <>
              <polyline points={`18,110 ${points} 682,110`} fill="url(#temperature-area)" stroke="none" />
              <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {chartPoints.map(({ key, x, y }) => (
                <circle key={key} cx={x} cy={y} r="3.6" fill="var(--panel)" stroke="var(--accent)" strokeWidth="2" />
              ))}
            </>
          )}
        </svg>
      </div>
      <div className="hourly-list">
        {items.map((item, index) => (
          <div className={`hourly-item ${index === 0 ? 'hourly-item--now' : ''}`} key={item.time}>
            <span className="hourly-item__time">{index === 0 ? t('now') || (language === 'ar' ? 'الآن' : 'Now') : formatHour(item.time, language)}</span>
            <WeatherIcon kind={getWeatherIcon(item.weatherCode)} size="sm" isDay={item.isDay !== 0} />
            <strong>{formatTemperature(item.temperature, temperatureUnit)}</strong>
            {isFiniteValue(item.probability) && item.probability > 0
              ? <small className="hourly-item__rain">{Math.round(item.probability)}%</small>
              : <small className="hourly-item__rain hourly-item__rain--empty">—</small>}
          </div>
        ))}
      </div>
      <div className="hourly-legend"><span className="legend-dot" />{language === 'ar' ? 'احتمال الهطول' : 'Precipitation chance'}</div>
    </section>
  );
}
