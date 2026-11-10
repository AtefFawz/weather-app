import { useMemo, useEffect, useState } from 'react';
import { fetchForecast } from '../api/openMeteo';

export function useWeather(location, preferences, refreshKey) {
  const locationKey = useMemo(() => [
    location?.id,
    location?.latitude,
    location?.longitude,
    location?.timezone,
    preferences.temperatureUnit,
    preferences.windSpeedUnit,
  ].join(':'), [
    location?.id,
    location?.latitude,
    location?.longitude,
    location?.timezone,
    preferences.temperatureUnit,
    preferences.windSpeedUnit,
  ]);
  const requestKey = `${locationKey}:${refreshKey}`;
  const [requestState, setRequestState] = useState({
    locationKey: null,
    requestKey: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!location) return undefined;
    const controller = new AbortController();
    let active = true;

    fetchForecast(location, {
      temperatureUnit: preferences.temperatureUnit,
      windSpeedUnit: preferences.windSpeedUnit,
      signal: controller.signal,
    })
      .then((data) => {
        if (active) setRequestState({ locationKey, requestKey, data, error: null });
      })
      .catch((error) => {
        if (!active || error?.name === 'AbortError') return;
        setRequestState((previous) => ({
          locationKey,
          requestKey,
          data: previous.locationKey === locationKey ? previous.data : null,
          error,
        }));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [location, location?.latitude, location?.longitude, location?.timezone, preferences.temperatureUnit, preferences.windSpeedUnit, locationKey, requestKey]);

  const sameLocation = requestState.locationKey === locationKey;
  const requestSettled = requestState.requestKey === requestKey;
  return {
    data: sameLocation ? requestState.data : null,
    loading: !requestSettled,
    error: requestSettled ? requestState.error : null,
  };
}
