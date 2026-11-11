import { useCallback, useEffect, useReducer, useRef } from "react";
import { FRESH_MS, ForecastCache, placeKey } from "@/data/forecast-cache";
import { isAbortError, WeatherApiError } from "@/data/errors";
import type { Forecast, Place } from "@/data/models";
import { fetchForecast } from "@/data/openmeteo";

export const forecastCache = new ForecastCache();

type Fetcher = (place: Place, options: { signal: AbortSignal }) => Promise<Forecast>;

export interface ForecastState {
  status: "loading" | "ready" | "error";
  forecast: Forecast | null;
  /** Latest error. When `forecast` is also set the error is non-fatal (we show the last good data). */
  error: WeatherApiError | null;
  refreshing: boolean;
}

type Action =
  { type: "start"; keep: Forecast | null } | { type: "success"; forecast: Forecast } | { type: "failure"; error: WeatherApiError };

function reducer(state: ForecastState, action: Action): ForecastState {
  switch (action.type) {
    case "start":
      return action.keep
        ? { status: "ready", forecast: action.keep, error: null, refreshing: true }
        : { status: "loading", forecast: null, error: null, refreshing: true };
    case "success":
      return { status: "ready", forecast: action.forecast, error: null, refreshing: false };
    case "failure":
      return state.forecast
        ? { ...state, error: action.error, refreshing: false }
        : { status: "error", forecast: null, error: action.error, refreshing: false };
  }
}

const toApiError = (error: unknown) =>
  error instanceof WeatherApiError ? error : new WeatherApiError("network", "Unexpected error", 0, { cause: error });

const defaultFetcher: Fetcher = (place, { signal }) => fetchForecast(place, { signal });

/**
 * Loads the forecast for a place with stale-while-revalidate semantics:
 *  1. show the cached forecast instantly (if any),
 *  2. fetch a fresh one in the background when the cache is stale,
 *  3. keep showing the last good data if the refresh fails,
 *  4. refresh again when the tab regains focus / the network returns and the data is old.
 */
export function useForecast(place: Place, fetcher: Fetcher = defaultFetcher, cache: ForecastCache = forecastCache) {
  const [state, dispatch] = useReducer(reducer, undefined, (): ForecastState => {
    const hit = cache.get(place);
    return hit
      ? { status: "ready", forecast: hit.forecast, error: null, refreshing: false }
      : { status: "loading", forecast: null, error: null, refreshing: false };
  });
  const controller = useRef<AbortController | null>(null);
  const latest = useRef(state.forecast);

  useEffect(() => {
    latest.current = state.forecast;
  }, [state.forecast]);

  const load = useCallback(
    async (keep: Forecast | null) => {
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      dispatch({ type: "start", keep });
      try {
        const forecast = await fetcher(place, { signal: abort.signal });
        if (abort.signal.aborted) return;
        cache.set(forecast);
        dispatch({ type: "success", forecast });
      } catch (error) {
        if (abort.signal.aborted || isAbortError(error)) return;
        dispatch({ type: "failure", error: toApiError(error) });
      }
    },
    [place, fetcher, cache],
  );

  // Place changed (or first mount): show cache immediately, revalidate if needed.
  useEffect(() => {
    const hit = cache.get(place);
    if (hit?.fresh) dispatch({ type: "success", forecast: hit.forecast });
    else void load(hit ? hit.forecast : null);
    return () => controller.current?.abort();
    // `load` already depends on place; the cache hit is read at effect time on purpose.
  }, [load, cache, place]);

  // Revalidate stale data when the tab becomes visible again or connectivity returns.
  useEffect(() => {
    const revalidate = () => {
      const current = latest.current;
      if (document.visibilityState === "hidden" || !current) return;
      if (Date.now() - current.fetchedAt >= FRESH_MS) void load(current);
    };
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("online", revalidate);
    const interval = window.setInterval(revalidate, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("online", revalidate);
      window.clearInterval(interval);
    };
  }, [load]);

  const refresh = useCallback(() => void load(latest.current), [load]);

  // The first render after a place change still holds the previous place's data; never show it.
  const stale = state.forecast !== null && placeKey(state.forecast.place) !== placeKey(place);
  return stale ? { status: "loading" as const, forecast: null, error: null, refreshing: true, refresh } : { ...state, refresh };
}
