import { z } from "zod";
import type { Place } from "@/data/models";
import { createPersistedStore, type Store } from "./store";

export const MAX_SAVED_PLACES = 6;

const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  admin1: z.string().default(""),
  country: z.string().default(""),
  countryCode: z.string().default(""),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().default("auto"),
  source: z.enum(["default", "search", "device"]).default("search"),
});

export const appStateSchema = z.object({
  version: z.literal(2),
  temperatureUnit: z.enum(["celsius", "fahrenheit"]),
  windUnit: z.enum(["kmh", "mph", "ms"]),
  theme: z.enum(["system", "light", "dark"]),
  language: z.enum(["en", "ar"]),
  selected: placeSchema,
  saved: z.array(placeSchema).max(MAX_SAVED_PLACES),
});

export type AppState = z.infer<typeof appStateSchema>;
export type Language = AppState["language"];
export type ThemePreference = AppState["theme"];

export const DEFAULT_PLACE: Place = {
  id: "default-kafr-el-dawwar",
  name: "Kafr El-Dawwar",
  admin1: "Beheira Governorate",
  country: "Egypt",
  countryCode: "EG",
  latitude: 31.13,
  longitude: 30.13,
  timezone: "Africa/Cairo",
  source: "default",
};

export function defaultState(languageHint = typeof navigator === "undefined" ? "en" : navigator.language): AppState {
  return {
    version: 2,
    temperatureUnit: "celsius",
    windUnit: "kmh",
    theme: "system",
    language: languageHint.toLowerCase().startsWith("ar") ? "ar" : "en",
    selected: DEFAULT_PLACE,
    saved: [],
  };
}

type Reader = Pick<Storage, "getItem">;

function readJson(storage: Reader, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Build v2 state from the per-key layout used by the first version of the app (`aether-*`). */
export function migrateLegacy(storage: Reader): unknown {
  const keys = ["aether-language", "aether-theme", "aether-temperature-unit", "aether-wind-unit", "aether-location", "aether-favorites"];
  if (keys.every((key) => storage.getItem(key) === null)) return undefined;

  const base = defaultState();
  const legacyLocation = readJson(storage, "aether-location") as Record<string, unknown> | undefined;
  const legacyFavorites = readJson(storage, "aether-favorites");
  const toPlace = (value: unknown): Place | null => {
    const parsed = placeSchema.safeParse(value && typeof value === "object" ? { ...(value as object), source: "search" } : value);
    return parsed.success ? parsed.data : null;
  };

  const selected = toPlace(legacyLocation);
  const isDevice = typeof legacyLocation?.id === "string" && legacyLocation.id.startsWith("coordinates-");
  const windUnit = readJson(storage, "aether-wind-unit");

  return {
    ...base,
    language: readJson(storage, "aether-language") === "ar" ? "ar" : "en",
    theme: ["light", "dark", "system"].includes(String(readJson(storage, "aether-theme"))) ? readJson(storage, "aether-theme") : "system",
    temperatureUnit: readJson(storage, "aether-temperature-unit") === "fahrenheit" ? "fahrenheit" : "celsius",
    windUnit: windUnit === "mph" ? "mph" : "kmh",
    selected: selected
      ? { ...selected, source: isDevice ? "device" : legacyLocation?.id === "kafr-el-dawwar-eg" ? "default" : "search" }
      : base.selected,
    saved: Array.isArray(legacyFavorites)
      ? legacyFavorites
          .map(toPlace)
          .filter((p): p is Place => p !== null)
          .slice(0, MAX_SAVED_PLACES)
      : [],
  };
}

export type AppStore = Store<AppState>;

export function createAppStore(storage?: Parameters<typeof createPersistedStore>[0]["storage"]): AppStore {
  return createPersistedStore({
    key: "aether:v2:state",
    schema: appStateSchema,
    defaults: defaultState,
    migrate: migrateLegacy,
    ...(storage === undefined ? {} : { storage }),
  });
}

/* Pure state transitions: easy to test, trivially composable with store.set. */

export const samePlace = (a: Pick<Place, "latitude" | "longitude">, b: Pick<Place, "latitude" | "longitude">) =>
  Math.abs(a.latitude - b.latitude) < 0.005 && Math.abs(a.longitude - b.longitude) < 0.005;

export const isSaved = (state: AppState, place: Place) => state.saved.some((p) => samePlace(p, place));

export function toggleSaved(state: AppState, place: Place): AppState {
  if (isSaved(state, place)) return { ...state, saved: state.saved.filter((p) => !samePlace(p, place)) };
  if (state.saved.length >= MAX_SAVED_PLACES) return state;
  return { ...state, saved: [...state.saved, place] };
}

export const selectPlace = (state: AppState, place: Place): AppState => ({ ...state, selected: place });
