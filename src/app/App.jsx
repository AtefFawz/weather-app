import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../lib/icons';
import { usePersistentState } from '../lib/usePersistentState';
import { messages } from '../locales/messages';
import { LocationSearch } from '../features/weather/components/LocationSearch';
import { WeatherDashboard } from '../features/weather/components/WeatherDashboard';
import { useWeather } from '../features/weather/hooks/useWeather';
import { isDeviceLocation } from '../features/weather/utils/location';

const DEFAULT_LOCATION = {
  id: 'kafr-el-dawwar-eg',
  name: 'Kafr El-Dawwar',
  admin1: 'Beheira Governorate',
  country: 'Egypt',
  countryCode: 'EG',
  latitude: 31.13,
  longitude: 30.13,
  timezone: 'Africa/Cairo',
};

function resolveTheme(preference) {
  if (preference !== 'system') return preference;
  return window.matchMedia?.('(prefers-color-scheme: light)')?.matches ? 'light' : 'dark';
}

function Header({ language, t, onLanguage, theme, onTheme, onGeolocation, geoLoading, temperatureUnit, onTemperatureUnit, windSpeedUnit, onWindUnit, onSelectLocation }) {
  return (
    <header className="app-header">
      <a className="brand" href="#top" aria-label={`${t('brand')} — ${t('tagline')}`}>
        <span className="brand__mark"><Icon name="sun" size={22} /></span>
        <span className="brand__text"><strong>{t('brand')}</strong><small>{t('tagline')}</small></span>
      </a>

      <div className="header-search"><LocationSearch language={language} t={t} onSelect={onSelectLocation} /></div>

      <div className="header-controls">
        <button className="control-button location-control" type="button" onClick={onGeolocation} disabled={geoLoading}>
          <Icon name="locate" size={17} className={geoLoading ? 'spin' : ''} />
          <span>{t('useLocation')}</span>
        </button>
        <div className="unit-switch" role="group" aria-label={t('temperatureUnits')}>
          <button type="button" className={temperatureUnit === 'celsius' ? 'is-active' : ''} onClick={() => onTemperatureUnit('celsius')} aria-pressed={temperatureUnit === 'celsius'}>°C</button>
          <button type="button" className={temperatureUnit === 'fahrenheit' ? 'is-active' : ''} onClick={() => onTemperatureUnit('fahrenheit')} aria-pressed={temperatureUnit === 'fahrenheit'}>°F</button>
        </div>
        <button className="icon-button header-icon" type="button" onClick={onWindUnit} aria-label={`${t('wind')}: ${windSpeedUnit === 'kmh' ? 'km/h' : 'mph'}`} title={`${t('wind')}: ${windSpeedUnit === 'kmh' ? 'km/h' : 'mph'}`}>
          <Icon name="wind" size={18} />
        </button>
        <label className="select-control" aria-label={t('theme')}>
          <Icon name={theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor'} size={16} />
          <select value={theme} onChange={(event) => onTheme(event.target.value)}>
            <option value="system">{t('system')}</option>
            <option value="light">{t('light')}</option>
            <option value="dark">{t('dark')}</option>
          </select>
          <Icon name="chevron" size={13} />
        </label>
        <button className="language-button" type="button" onClick={onLanguage} aria-label={t('language')}>
          <Icon name="globe" size={16} /><span>{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>
      </div>
    </header>
  );
}

function SavedPlaces({ favorites, activeLocation, onSelect, onRemove, t }) {
  return (
    <section className="saved-places" aria-labelledby="saved-title">
      <div className="saved-places__heading">
        <span className="section-kicker">{t('shortlist')}</span>
        <h2 id="saved-title">{t('savedPlaces')}</h2>
      </div>
      {favorites.length === 0 ? (
        <p className="saved-empty"><Icon name="heart" size={16} />{t('noSavedPlaces')}</p>
      ) : (
        <div className="saved-list">
          {favorites.map((favorite) => {
            const active = favorite.id === activeLocation.id || (favorite.latitude === activeLocation.latitude && favorite.longitude === activeLocation.longitude);
            const favoriteName = isDeviceLocation(favorite) ? t('demoLocation') : favorite.name;
            return (
              <div className={`saved-place ${active ? 'is-active' : ''}`} key={favorite.id}>
                <button type="button" className="saved-place__select" onClick={() => onSelect(favorite)} aria-current={active ? 'true' : undefined}>
                  <Icon name="pin" size={15} />
                  <span><strong>{isDeviceLocation(favorite) ? t('demoLocation') : favorite.name}</strong><small>{isDeviceLocation(favorite) ? t('deviceLocationSubtitle') : favorite.country}</small></span>
                </button>
                <button type="button" className="saved-place__remove" onClick={() => onRemove(favorite)} aria-label={`${t('removePlace')}: ${favoriteName}`} title={t('removePlace')}>
                  <Icon name="close" size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AppFooter({ t, language }) {
  return (
    <footer className="app-footer">
      <div className="footer-brand"><span className="brand__mark brand__mark--small"><Icon name="sun" size={17} /></span><strong>{t('brand')}</strong></div>
      <p>{t('attribution')}</p>
      <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="attribution-link">
        {t('dataBy')} <strong>{t('openMeteo')}</strong><Icon name="external" size={13} />
      </a>
      <span className="footer-language">{language === 'ar' ? 'واجهة عربية وإنجليزية' : 'Built for clarity, wherever you are.'}</span>
    </footer>
  );
}

export default function App() {
  const [language, setLanguage] = usePersistentState('aether-language', 'en');
  const [theme, setTheme] = usePersistentState('aether-theme', 'system');
  const [temperatureUnit, setTemperatureUnit] = usePersistentState('aether-temperature-unit', 'celsius');
  const [windSpeedUnit, setWindSpeedUnit] = usePersistentState('aether-wind-unit', 'kmh');
  const [location, setLocation] = usePersistentState('aether-location', DEFAULT_LOCATION);
  const [favorites, setFavorites] = usePersistentState('aether-favorites', []);
  const [refreshKey, setRefreshKey] = useState(0);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [clockNow, setClockNow] = useState(() => new Date());
  const { data: weather, loading, error } = useWeather(location, { temperatureUnit, windSpeedUnit }, refreshKey);
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  const t = useMemo(() => (key) => messages[language]?.[key] || messages.en[key] || key, [language]);
  const resolvedTheme = resolveTheme(theme);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.documentElement.dataset.theme = resolvedTheme;
  }, [language, direction, resolvedTheme]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const update = () => { document.documentElement.dataset.theme = media.matches ? 'light' : 'dark'; };
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, [theme]);

  function selectLocation(nextLocation) {
    setLocation(nextLocation);
    setGeoError('');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function toggleFavorite() {
    const exists = favorites.some((favorite) => favorite.id === location.id || (
      favorite.latitude === location.latitude && favorite.longitude === location.longitude
    ));
    if (exists) {
      setFavorites(favorites.filter((favorite) => favorite.id !== location.id && !(
        favorite.latitude === location.latitude && favorite.longitude === location.longitude
      )));
    } else {
      setFavorites([location, ...favorites].slice(0, 6));
    }
  }

  function removeFavorite(favorite) {
    setFavorites(favorites.filter((item) => item.id !== favorite.id));
  }

  function useGeolocation() {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError(t('locationUnavailable'));
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          id: `coordinates-${coords.latitude.toFixed(3)}-${coords.longitude.toFixed(3)}`,
          name: '',
          source: 'geolocation',
          admin1: '',
          country: '',
          latitude: coords.latitude,
          longitude: coords.longitude,
          timezone: 'auto',
        });
        setGeoLoading(false);
      },
      (geoErrorResult) => {
        setGeoLoading(false);
        setGeoError(geoErrorResult.code === 1 ? t('locationPermission') : t('locationUnavailable'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <div className="app-shell" id="top" dir={direction}>
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      <div className="app-container">
        <Header
          language={language}
          t={t}
          onLanguage={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          theme={theme}
          onTheme={setTheme}
          onGeolocation={useGeolocation}
          geoLoading={geoLoading}
          temperatureUnit={temperatureUnit}
          onTemperatureUnit={setTemperatureUnit}
          windSpeedUnit={windSpeedUnit}
          onWindUnit={() => setWindSpeedUnit(windSpeedUnit === 'kmh' ? 'mph' : 'kmh')}
          onSelectLocation={selectLocation}
        />

        {(geoError) && <div className="inline-alert" role="alert"><Icon name="alert" size={16} />{geoError}<button type="button" onClick={() => setGeoError('')} aria-label={t('dismiss') || 'Dismiss'}><Icon name="close" size={14} /></button></div>}

        <div className="page-intro">
          <div><span className="page-intro__eyebrow"><span />{t('eyebrow')}</span><p>{t('introCopy') || (language === 'ar' ? 'كل ما تحتاج معرفته عن الطقس، في لوحة واحدة هادئة وواضحة.' : 'Real-time conditions and the days ahead, brought together in one thoughtful view.')}</p></div>
          <div className="updated-pill"><span className={`updated-pill__dot ${loading ? 'is-loading' : ''}`} />{loading ? t('refreshing') : t('forecastUpdated') || (language === 'ar' ? 'التوقعات محدثة' : 'Forecast ready')}</div>
        </div>

        <WeatherDashboard
          location={location}
          weather={weather}
          loading={loading}
          error={error}
          language={language}
          temperatureUnit={temperatureUnit}
          windSpeedUnit={windSpeedUnit}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onRefresh={() => setRefreshKey((key) => key + 1)}
          t={t}
          now={clockNow}
        />

        <SavedPlaces favorites={favorites} activeLocation={location} onSelect={selectLocation} onRemove={removeFavorite} t={t} />
        <AppFooter t={t} language={language} />
      </div>
    </div>
  );
}
