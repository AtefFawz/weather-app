import type { z } from "zod";
import { isAbortError, WeatherApiError } from "./errors";

export interface RequestOptions {
  signal?: AbortSignal | undefined;
  /** Per-attempt timeout. */
  timeoutMs?: number;
  /** Extra attempts after the first. */
  retries?: number;
  fetchImpl?: typeof fetch;
  /** Injectable for tests. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  random?: () => number;
}

const DEFAULTS = { timeoutMs: 8000, retries: 2 } as const;

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Exponential backoff with full jitter, capped. `attempt` is 0 for the first retry. */
export function backoffDelay(attempt: number, random: () => number = Math.random, retryAfterMs?: number): number {
  if (retryAfterMs !== undefined) return Math.min(5000, retryAfterMs);
  const ceiling = Math.min(2000, 300 * 2 ** attempt);
  return Math.round(ceiling / 2 + random() * (ceiling / 2));
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

async function attemptOnce(url: string, options: RequestOptions): Promise<{ json: unknown; retryAfter?: number }> {
  const { signal, timeoutMs = DEFAULTS.timeoutMs, fetchImpl = fetch } = options;
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(new DOMException("Timed out", "TimeoutError")), timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;

  try {
    const response = await fetchImpl(url, { signal: combined, headers: { Accept: "application/json" } });
    if (!response.ok) {
      const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
      const code = response.status === 429 ? "rate_limited" : response.status >= 500 ? "server" : "client";
      const error = new WeatherApiError(code, `Weather service responded with ${response.status}`, response.status);
      throw Object.assign(error, retryAfter === undefined ? {} : { retryAfter });
    }
    try {
      return { json: await response.json() };
    } catch (cause) {
      throw new WeatherApiError("invalid_response", "Response was not valid JSON", response.status, { cause });
    }
  } catch (error) {
    if (error instanceof WeatherApiError) throw error;
    if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
    if (timeout.signal.aborted) throw new WeatherApiError("timeout", "The weather service took too long to respond", 0, { cause: error });
    if (isAbortError(error)) throw error;
    throw new WeatherApiError("network", "Unable to reach the weather service", 0, { cause: error });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET + validate + retry. Retries network failures, timeouts, 429 and 5xx with jittered exponential
 * backoff (honouring Retry-After); never retries 4xx or a caller abort.
 */
export async function getJson<S extends z.ZodType>(url: string, schema: S, options: RequestOptions = {}): Promise<z.infer<S>> {
  const { retries = DEFAULTS.retries, sleep = abortableSleep, random = Math.random, signal } = options;

  for (let attempt = 0; ; attempt += 1) {
    try {
      const { json } = await attemptOnce(url, options);
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new WeatherApiError("invalid_response", "Weather data did not match the expected format", 200, { cause: parsed.error });
      }
      return parsed.data;
    } catch (error) {
      const retryable = error instanceof WeatherApiError && error.retryable;
      if (!retryable || attempt >= retries) throw error;
      const retryAfter = (error as { retryAfter?: number }).retryAfter;
      await sleep(backoffDelay(attempt, random, retryAfter), signal);
    }
  }
}
