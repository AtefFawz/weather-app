import { createContext, use, useMemo, type ReactNode } from "react";
import type { Place } from "@/data/models";
import type { TemperatureUnit, WindUnit } from "@/core/units";
import { selectPlace, toggleSaved, type AppState, type AppStore, type Language, type ThemePreference } from "./app-state";
import { useStore } from "./store";

const StoreContext = createContext<AppStore | null>(null);

export function AppStateProvider({ store, children }: { store: AppStore; children: ReactNode }) {
  return <StoreContext value={store}>{children}</StoreContext>;
}

function useAppStore(): AppStore {
  const store = use(StoreContext);
  if (!store) throw new Error("useAppState must be used inside <AppStateProvider>");
  return store;
}

export function useAppState<S>(selector: (state: AppState) => S): S {
  return useStore(useAppStore(), selector);
}

export interface AppActions {
  setTemperatureUnit(unit: TemperatureUnit): void;
  setWindUnit(unit: WindUnit): void;
  setTheme(theme: ThemePreference): void;
  setLanguage(language: Language): void;
  selectPlace(place: Place): void;
  toggleSaved(place: Place): void;
}

export function useAppActions(): AppActions {
  const store = useAppStore();
  return useMemo<AppActions>(
    () => ({
      setTemperatureUnit: (temperatureUnit) => store.set((s) => ({ ...s, temperatureUnit })),
      setWindUnit: (windUnit) => store.set((s) => ({ ...s, windUnit })),
      setTheme: (theme) => store.set((s) => ({ ...s, theme })),
      setLanguage: (language) => store.set((s) => ({ ...s, language })),
      selectPlace: (place) => store.set((s) => selectPlace(s, place)),
      toggleSaved: (place) => store.set((s) => toggleSaved(s, place)),
    }),
    [store],
  );
}
