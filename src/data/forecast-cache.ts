import type { Forecast, Place } from "./models";

const STORAGE_KEY = "aether:v2:forecasts";
const MAX_ENTRIES = 8;

/** Data younger than this needs no revalidation. */
export const FRESH_MS = 10 * 60_000;
/** Data older than this is too stale to show without a clear warning. */
export const MAX_STALE_MS = 6 * 3_600_000;

export const placeKey = (place: Pick<Place, "latitude" | "longitude">) => `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

interface Entry {
  key: string;
  forecast: Forecast;
}

/**
 * Small LRU forecast cache persisted to localStorage. It enables stale-while-revalidate: on load (or
 * offline) the last forecast for a place is shown immediately while a fresh one is fetched.
 */
export class ForecastCache {
  private entries: Entry[] = [];

  constructor(
    private readonly storage: StorageLike | null = safeStorage(),
    private readonly now: () => number = Date.now,
  ) {
    this.load();
  }

  get(place: Pick<Place, "latitude" | "longitude">): { forecast: Forecast; ageMs: number; fresh: boolean } | undefined {
    const key = placeKey(place);
    const entry = this.entries.find((e) => e.key === key);
    if (!entry) return undefined;
    const ageMs = Math.max(0, this.now() - entry.forecast.fetchedAt);
    if (ageMs > MAX_STALE_MS) return undefined;
    return { forecast: entry.forecast, ageMs, fresh: ageMs < FRESH_MS };
  }

  set(forecast: Forecast): void {
    const key = placeKey(forecast.place);
    this.entries = [{ key, forecast }, ...this.entries.filter((e) => e.key !== key)].slice(0, MAX_ENTRIES);
    this.save();
  }

  clear(): void {
    this.entries = [];
    this.save();
  }

  private load(): void {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      this.entries = parsed.filter(isEntry).slice(0, MAX_ENTRIES);
    } catch {
      this.entries = [];
    }
  }

  private save(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // Quota or private mode: the in-memory copy still works for this session.
    }
  }
}

function isEntry(value: unknown): value is Entry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Partial<Entry>;
  const f = e.forecast;
  return (
    typeof e.key === "string" &&
    !!f &&
    typeof f.fetchedAt === "number" &&
    Array.isArray(f.hourly) &&
    Array.isArray(f.daily) &&
    typeof f.current?.time === "number" &&
    typeof f.place?.latitude === "number"
  );
}

function safeStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
