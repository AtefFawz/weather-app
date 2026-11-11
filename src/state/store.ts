import { useSyncExternalStore } from "react";
import type { z } from "zod";

type Listener = () => void;
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface Store<T> {
  get(): T;
  set(update: T | ((previous: T) => T)): void;
  subscribe(listener: Listener): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(update) {
      const next = typeof update === "function" ? (update as (p: T) => T)(state) : update;
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}

interface PersistOptions<S extends z.ZodType> {
  key: string;
  schema: S;
  defaults: () => z.infer<S>;
  /** Optional hook to build state from older storage layouts before the first validated read. */
  migrate?: (storage: StorageLike) => unknown;
  storage?: StorageLike | null;
}

/**
 * A store whose value is validated on load and written back on change. Anything missing, malformed
 * or from an incompatible version silently falls back to defaults rather than crashing the app.
 */
export function createPersistedStore<S extends z.ZodType>(options: PersistOptions<S>): Store<z.infer<S>> {
  const storage = options.storage === undefined ? safeStorage() : options.storage;
  const read = (): z.infer<S> => {
    try {
      const raw = storage?.getItem(options.key);
      const candidate: unknown = raw ? JSON.parse(raw) : storage ? options.migrate?.(storage) : undefined;
      const parsed = options.schema.safeParse(candidate);
      if (parsed.success) return parsed.data;
    } catch {
      // fall through to defaults
    }
    return options.defaults();
  };

  const store = createStore<z.infer<S>>(read());
  store.subscribe(() => {
    try {
      storage?.setItem(options.key, JSON.stringify(store.get()));
    } catch {
      // Quota / private mode: state still works in memory.
    }
  });
  return store;
}

function safeStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
