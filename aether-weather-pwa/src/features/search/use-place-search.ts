import { useEffect, useState } from "react";
import { isAbortError, WeatherApiError } from "@/data/errors";
import type { Place } from "@/data/models";
import { searchPlaces } from "@/data/openmeteo";

export interface PlaceSearchState {
  results: Place[];
  loading: boolean;
  error: boolean;
}

const IDLE: PlaceSearchState = { results: [], loading: false, error: false };

/** Debounced geocoding with cancellation; every keystroke supersedes the previous in-flight request. */
export function usePlaceSearch(query: string, language: "en" | "ar", delayMs = 250): PlaceSearchState {
  const trimmed = query.trim();
  const [state, setState] = useState<{ query: string; value: PlaceSearchState }>({ query: "", value: IDLE });

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setState({ query: trimmed, value: { results: [], loading: true, error: false } });
      searchPlaces(trimmed, { language, signal: controller.signal })
        .then((results) => setState({ query: trimmed, value: { results, loading: false, error: false } }))
        .catch((error: unknown) => {
          if (isAbortError(error)) return;
          const failure = error instanceof WeatherApiError || error instanceof Error;
          setState({ query: trimmed, value: { results: [], loading: false, error: failure } });
        });
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, language, delayMs]);

  // Derived during render: short queries are idle, and results never outlive the query that made them.
  if (trimmed.length < 2) return IDLE;
  if (state.query !== trimmed) return { results: state.value.results, loading: true, error: false };
  return state.value;
}
