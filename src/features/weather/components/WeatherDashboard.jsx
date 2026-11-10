import { useMemo } from 'react';
import { Icon } from '../../../lib/icons';
import { formatTemperature, formatWind, getHourlyWindow, getLocalClock, getWindDirection } from '../../../lib/formatters';
import { getWeatherIcon, getWeatherLabel } from '../utils/weatherCode';
import { DailyForecast } from './DailyForecast';
import { HourlyForecast } from './HourlyForecast';
import { MetricCard } from './MetricCard';
import { WeatherIcon } from './WeatherIcon';
import { getLocationPresentation } from '../utils/location';

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

function WeatherError({ t, onRetry, error }) {
  const messageKey = error?.code === 'rate_limited' ? 'rateLimited' : 'weatherError';
  return (
    <div className="weather-error" role="alert">
      <span className="weather-error__icon"><Icon name="alert" size={22} /></span>
      <div>
        <strong>{t(messageKey)}</strong>
        <p>{t('loadingDetails')}</p>
        <button type="button" className="button button--secondary button--small" onClick={onRetry}>{t('retry')}</button>
      </div>
    </div>
  );
}

export function WeatherDashboard({
  location, weather, loading, error, language, temperatureUnit, windSpeedUnit,
  favorites, onToggleFavorite, onRefresh, t, now,
}) {
  const current = weather?.current;
  const daily = weather?.daily;
  const hourly = weather?.hourly;
  const hourlyItems = useMemo(() => getHourlyWindow(hourly, current?.time, 12), [hourly, current?.time]);
  const currentCode = current?.weather_code;
  const description = current ? getWeatherLabel(currentCode, t) : '';
  const { name: locationName, subtitle: locationSubtitle } = getLocationPresentation(location, language, t);
  const saved = favorites.some((favorite) => favorite.id === location.id || (
    favorite.latitude === location.latitude && favorite.longitude === location.longitude
  ));
  const today = daily ? {
    sunrise: daily.sunrise?.[0],
    sunset: daily.sunset?.[0],
    uv: daily.uv_index_max?.[0],
  } : {};
  const dayRows = daily?.time?.map((date, index) => ({
    date,
    code: daily.weather_code?.[index],
    max: daily.temperature_2m_max?.[index],
    min: daily.temperature_2m_min?.[index],
    precipitation: daily.precipitation_probability_max?.[index],
  })) || [];
  const sunrise = today.sunrise ? today.sunrise.slice(-5) : '—';
  const sunset = today.sunset ? today.sunset.slice(-5) : '—';

  return (
    <main className="dashboard-main">
      <div className="dashboard-title-row">
        <div>
          <span className="section-kicker">{t('weatherBriefing') || 'YOUR WEATHER BRIEFING'}</span>
          <h1>{t('currentWeather')}</h1>
        </div>
        <div className="dashboard-actions">
          <button className={`button button--secondary button--small favorite-button ${saved ? 'is-saved' : ''}`} type="button" onClick={onToggleFavorite} aria-pressed={saved}>
            <Icon name="heart" size={16} />{saved ? t('saved') || 'Saved' : t('savePlace')}
          </button>
          <button className="icon-button refresh-button" type="button" onClick={onRefresh} disabled={loading} aria-label={t('refresh')} title={t('refresh')}>
            <Icon name="refresh" size={17} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {error && !weather && <WeatherError t={t} onRetry={onRefresh} error={error} />}

      <div className={`weather-layout ${loading && !weather ? 'weather-layout--loading' : ''} ${error && !weather ? 'weather-layout--error' : ''}`}>
        <section className="current-card">
          <div className="current-card__texture" aria-hidden="true" />
          <div className="current-card__topline">
            <span className="live-indicator"><span />{t('liveConditions') || 'CURRENT CONDITIONS'}</span>
            <span className="current-card__timezone">{t('localTime')}</span>
          </div>
          <div className="current-card__identity">
            <div>
              <h2>{locationName}</h2>
              <p>{locationSubtitle}</p>
              <span className="current-card__date">{weather ? getLocalClock(weather.timezone, language, now) : '—'}</span>
            </div>
            <div className="current-card__save"><Icon name="pin" size={17} />{t('selected') || 'SELECTED LOCATION'}</div>
          </div>
          {loading && !current ? (
            <div className="current-card__temperature"><Skeleton className="skeleton-temp" /><Skeleton className="skeleton-icon" /></div>
          ) : current ? (
            <div className="current-card__temperature">
              <div className="current-card__temperature-value">{formatTemperature(current.temperature_2m, temperatureUnit)}</div>
              <WeatherIcon kind={getWeatherIcon(currentCode)} size="hero" isDay={current.is_day === 1} />
            </div>
          ) : null}
          <div className="current-card__condition">
            <div>
              <strong>{description || (loading ? t('loading') : '—')}</strong>
              <span>{t('feelsLike')} <b>{current ? formatTemperature(current.apparent_temperature, temperatureUnit) : '—'}</b></span>
            </div>
            {current && <span className="current-card__humidity"><Icon name="droplet" size={15} />{hasNumber(current.relative_humidity_2m) ? `${Math.round(current.relative_humidity_2m)}%` : '—'}</span>}
          </div>
          <div className="current-card__footer">
            <span><Icon name="sunrise" size={16} />{t('sunrise')} <b>{sunrise}</b></span>
            <span><Icon name="sunset" size={16} />{t('sunset')} <b>{sunset}</b></span>
          </div>
        </section>

        <section className="highlights-column" aria-labelledby="highlights-title">
          <div className="section-heading section-heading--compact">
            <div><span className="section-kicker">{t('atAGlance') || 'AT A GLANCE'}</span><h2 id="highlights-title">{t('todayHighlights')}</h2></div>
          </div>
          <div className="metrics-grid">
            {loading && !current ? (
              Array.from({ length: 6 }, (_, index) => <Skeleton className="metric-skeleton" key={index} />)
            ) : current ? (
              <>
                <MetricCard icon="droplet" label={t('humidity')} value={hasNumber(current.relative_humidity_2m) ? `${Math.round(current.relative_humidity_2m)}%` : '—'} detail={t('humidityHint') || (language === 'ar' ? 'الرطوبة النسبية' : 'Relative humidity')} accent="blue" />
                <MetricCard icon="wind" label={t('wind')} value={formatWind(current.wind_speed_10m, windSpeedUnit)} detail={`${getWindDirection(current.wind_direction_10m, language)} · ${t('direction') || 'direction'}`} accent="teal" />
                <MetricCard icon="gauge" label={t('pressure')} value={hasNumber(current.pressure_msl) ? `${Math.round(current.pressure_msl)} hPa` : '—'} detail={t('seaLevel') || (language === 'ar' ? 'عند سطح البحر' : 'Sea level')} accent="violet" />
                <MetricCard icon="sun" label={t('uvIndex')} value={hasNumber(today.uv) ? Number(today.uv).toFixed(1) : '—'} detail={t('dailyMaximum') || (language === 'ar' ? 'أعلى قيمة اليوم' : "Today's maximum")} accent="amber" />
                <MetricCard icon="cloud" label={t('cloudCover')} value={hasNumber(current.cloud_cover) ? `${Math.round(current.cloud_cover)}%` : '—'} detail={t('totalCloudCover')} accent="slate" />
                <MetricCard icon="wind" label={t('gusts')} value={formatWind(current.wind_gusts_10m, windSpeedUnit)} detail={t('peakWind') || (language === 'ar' ? 'هبات الرياح القصوى' : 'Peak wind gusts')} accent="coral" />
              </>
            ) : null}
          </div>
        </section>
      </div>

      {error && weather && (
        <div className="stale-notice" role="status"><Icon name="alert" size={16} />{t('staleData') || 'Showing the last available data. Refresh to try again.'}</div>
      )}

      {weather && (
        <div className="forecast-layout">
          <HourlyForecast items={hourlyItems} language={language} temperatureUnit={temperatureUnit} t={t} />
          <DailyForecast days={dayRows} language={language} temperatureUnit={temperatureUnit} t={t} />
        </div>
      )}
    </main>
  );
}
