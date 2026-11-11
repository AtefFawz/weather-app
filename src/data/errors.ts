export type WeatherErrorCode = "network" | "timeout" | "rate_limited" | "server" | "client" | "invalid_response";

export class WeatherApiError extends Error {
  readonly code: WeatherErrorCode;
  readonly status: number;
  /** Whether retrying the same request might succeed. */
  readonly retryable: boolean;

  constructor(code: WeatherErrorCode, message: string, status = 0, options?: ErrorOptions) {
    super(message, options);
    this.name = "WeatherApiError";
    this.code = code;
    this.status = status;
    this.retryable = code === "network" || code === "timeout" || code === "rate_limited" || code === "server";
  }
}

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException ? error.name === "AbortError" : (error as { name?: string } | null)?.name === "AbortError";
