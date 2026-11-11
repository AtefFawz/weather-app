import { describe, expect, it } from "vitest";
import { CAIRO } from "@/data/fixtures";
import { createAppStore, defaultState, isSaved, MAX_SAVED_PLACES, migrateLegacy, selectPlace, toggleSaved } from "./app-state";
import { createStore } from "./store";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

describe("createStore", () => {
  it("notifies subscribers only on change and supports updater functions", () => {
    const store = createStore(1);
    let calls = 0;
    const off = store.subscribe(() => (calls += 1));
    store.set(1);
    store.set((n) => n + 1);
    expect(store.get()).toBe(2);
    expect(calls).toBe(1);
    off();
    store.set(3);
    expect(calls).toBe(1);
  });
});

describe("persisted app store", () => {
  it("starts from defaults and persists changes", () => {
    const storage = new MemoryStorage();
    const store = createAppStore(storage);
    expect(store.get().temperatureUnit).toBe("celsius");
    store.set((s) => ({ ...s, temperatureUnit: "fahrenheit" }));
    expect(JSON.parse(storage.getItem("aether:v2:state")!).temperatureUnit).toBe("fahrenheit");
    expect(createAppStore(storage).get().temperatureUnit).toBe("fahrenheit");
  });

  it("falls back to defaults for corrupt, invalid or wrong-version data", () => {
    for (const bad of ["{oops", JSON.stringify({ version: 1 }), JSON.stringify({ ...defaultState(), windUnit: "knots" })]) {
      const storage = new MemoryStorage();
      storage.setItem("aether:v2:state", bad);
      expect(createAppStore(storage).get()).toEqual(defaultState());
    }
  });

  it("works when storage is unavailable", () => {
    const store = createAppStore(null);
    store.set((s) => ({ ...s, theme: "dark" }));
    expect(store.get().theme).toBe("dark");
  });

  it("chooses Arabic from the browser language hint", () => {
    expect(defaultState("ar-EG").language).toBe("ar");
    expect(defaultState("en-US").language).toBe("en");
  });
});

describe("legacy migration", () => {
  it("returns nothing when no legacy keys exist", () => {
    expect(migrateLegacy(new MemoryStorage())).toBeUndefined();
  });

  it("imports preferences, location and favourites from the v1 layout", () => {
    const storage = new MemoryStorage();
    storage.setItem("aether-language", JSON.stringify("ar"));
    storage.setItem("aether-theme", JSON.stringify("light"));
    storage.setItem("aether-temperature-unit", JSON.stringify("fahrenheit"));
    storage.setItem("aether-wind-unit", JSON.stringify("mph"));
    storage.setItem("aether-location", JSON.stringify({ id: "coordinates-30.04-31.24", name: "x", latitude: 30.04, longitude: 31.24 }));
    storage.setItem(
      "aether-favorites",
      JSON.stringify([{ id: "a", name: "Cairo", latitude: 30, longitude: 31, timezone: "Africa/Cairo" }, { bad: true }]),
    );
    const state = createAppStore(storage).get();
    expect(state).toMatchObject({ language: "ar", theme: "light", temperatureUnit: "fahrenheit", windUnit: "mph" });
    expect(state.selected.source).toBe("device");
    expect(state.saved).toHaveLength(1);
  });
});

describe("transitions", () => {
  it("toggles saved places and enforces the limit", () => {
    let state = defaultState("en");
    state = toggleSaved(state, CAIRO);
    expect(isSaved(state, CAIRO)).toBe(true);
    expect(isSaved(state, { ...CAIRO, latitude: CAIRO.latitude + 0.001 })).toBe(true);
    state = toggleSaved(state, CAIRO);
    expect(state.saved).toHaveLength(0);
    for (let i = 0; i < MAX_SAVED_PLACES + 2; i += 1) state = toggleSaved(state, { ...CAIRO, id: String(i), latitude: i, longitude: i });
    expect(state.saved).toHaveLength(MAX_SAVED_PLACES);
  });

  it("selects a place", () => {
    expect(selectPlace(defaultState("en"), CAIRO).selected).toBe(CAIRO);
  });
});
