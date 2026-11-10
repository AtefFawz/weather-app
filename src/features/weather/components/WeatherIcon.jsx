export function WeatherIcon({ kind = 'cloud', size = 'lg', className = '', isDay = true }) {
  const displayKind = isDay ? kind : kind.replace('sun', 'moon');
  const classNames = `weather-icon weather-icon--${size} weather-icon--${kind} ${className}`.trim();
  const cloud = <path className="weather-cloud" d="M75 72H29a17 17 0 0 1-2-34 22 22 0 0 1 42 5h5a14.5 14.5 0 0 1 1 29Z" />;

  return (
    <svg className={classNames} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      {displayKind.includes('moon') && (
        <path className="weather-moon" d="M68 18c-2.5 18.5-17.4 33.2-36 35.5 5.1 11.3 16.4 19.2 30.2 19.2C80 72.7 94 58.7 94 41.9c0-9.1-4-17.3-10.4-23-4.8-1.9-10.1-2.2-15.6-.9Z" transform="translate(-12 -2)" />
      )}
      {displayKind.includes('sun') && displayKind !== 'sun' && (
        <>
          <circle className="weather-sun" cx="60" cy="31" r="15" />
          <path className="weather-rays" d="M60 7v7m0 34v7M36 31h7m34 0h7M43 14l5 5m24 24 5 5m0-34-5 5M48 43l-5 5" />
        </>
      )}
      {displayKind === 'sun' && <><circle className="weather-sun" cx="48" cy="48" r="25" /><path className="weather-rays" d="M48 8v8m0 64v8M8 48h8m64 0h8M19.7 19.7l5.7 5.7m45.2 45.2 5.7 5.7m0-56.6-5.7 5.7M25.4 70.6l-5.7 5.7" /></>}
      {displayKind.includes('cloud') || ['fog', 'rain', 'rain-heavy', 'snow', 'storm'].includes(displayKind) ? cloud : null}
      {kind === 'fog' && <path className="weather-rain" d="M18 32h60M24 42h48" />}
      {(kind === 'rain' || kind === 'rain-heavy' || kind === 'storm') && (
        <path className="weather-rain" d="m34 62-5 10m22-10-5 10m22-10-5 10" />
      )}
      {kind === 'snow' && <><path className="weather-snow" d="M34 65v16m-7-12 14 8m0-8-14 8M60 65v16m-7-12 14 8m0-8-14 8" /></>}
      {kind === 'storm' && <path className="weather-lightning" d="m52 55-12 20h11l-5 13 18-24H53l7-9" />}
    </svg>
  );
}
