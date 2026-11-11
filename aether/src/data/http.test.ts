import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { WeatherApiError } from "./errors";
import { backoffDelay, getJson } from "./http";

const schema = z.object({ ok: z.boolean() });
const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" }, ...init });
const noSleep = () => Promise.resolve();

describe("getJson", () => {
  it("returns validated data", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ ok: true }));
    await expect(getJson("https://x.test", schema, { fetchImpl })).resolves.toEqual({ ok: true });
  });

  it("retries 5xx then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("", { status: 502 }))
      .mockResolvedValueOnce(json({ ok: true }));
    const sleep = vi.fn(noSleep);
    await expect(getJson("https://x.test", schema, { fetchImpl, sleep })).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("gives up after the configured retries with a typed error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 500 }));
    await expect(getJson("https://x.test", schema, { fetchImpl, sleep: noSleep, retries: 1 })).rejects.toMatchObject({
      code: "server",
      status: 500,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry client errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("", { status: 400 }));
    await expect(getJson("https://x.test", schema, { fetchImpl, sleep: noSleep })).rejects.toMatchObject({ code: "client" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("honours Retry-After on 429 (capped)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429, headers: { "Retry-After": "2" } }))
      .mockResolvedValueOnce(json({ ok: true }));
    const sleep = vi.fn(noSleep);
    await getJson("https://x.test", schema, { fetchImpl, sleep });
    expect(sleep).toHaveBeenCalledWith(2000, undefined);
    expect(backoffDelay(0, () => 0, 60_000)).toBe(5000);
  });

  it("maps network failures", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("offline"));
    await expect(getJson("https://x.test", schema, { fetchImpl, sleep: noSleep, retries: 0 })).rejects.toMatchObject({
      code: "network",
    });
  });

  it("rejects payloads that fail the schema, without retrying", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ ok: "yes" }));
    await expect(getJson("https://x.test", schema, { fetchImpl, sleep: noSleep })).rejects.toMatchObject({
      code: "invalid_response",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports invalid JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("<html>", { status: 200 }));
    await expect(getJson("https://x.test", schema, { fetchImpl, retries: 0 })).rejects.toBeInstanceOf(WeatherApiError);
  });

  it("times out a hung request", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))),
    );
    await expect(
      getJson("https://x.test", schema, { fetchImpl: fetchImpl as typeof fetch, timeoutMs: 20, retries: 0 }),
    ).rejects.toMatchObject({
      code: "timeout",
    });
  });

  it("propagates a caller abort as AbortError and never retries it", async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))),
    );
    const pending = getJson("https://x.test", schema, { fetchImpl: fetchImpl as typeof fetch, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("backoffDelay", () => {
  it("grows exponentially with jitter and caps at 2s", () => {
    expect(backoffDelay(0, () => 0)).toBe(150);
    expect(backoffDelay(0, () => 1)).toBe(300);
    expect(backoffDelay(10, () => 1)).toBe(2000);
    expect(backoffDelay(2, () => 0.5)).toBeGreaterThan(backoffDelay(0, () => 0.5));
  });
});
