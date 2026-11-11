import type { Page } from "@playwright/test";
import { airQualityPayload, forecastPayload, geocodingPayload } from "../../src/data/fixtures";

/** The fixture forecast is anchored to this instant (12:10 UTC = 14:10 in Cairo, mid-afternoon). */
export const NOW = new Date("2026-11-10T12:10:00Z");

export interface MockOptions {
  /** Make the forecast endpoint fail with this status. */
  forecastStatus?: number;
  /** Override the forecast payload (e.g. to force a different weather code). */
  forecast?: unknown;
}

/** Freeze the clock and answer every Open-Meteo request from fixtures: tests never touch the network. */
export async function mockApp(page: Page, options: MockOptions = {}) {
  await page.clock.setFixedTime(NOW);
  await page.route("**/v1/forecast**", (route) =>
    options.forecastStatus
      ? route.fulfill({ status: options.forecastStatus, body: "{}" })
      : route.fulfill({ json: options.forecast ?? forecastPayload() }),
  );
  await page.route("**/v1/air-quality**", (route) => route.fulfill({ json: airQualityPayload }));
  await page.route("**/v1/search**", (route) => route.fulfill({ json: geocodingPayload }));
}

export async function seedState(page: Page, state: Record<string, unknown>) {
  await page.addInitScript((value) => {
    // Seed once: later page loads must see what the app itself persisted.
    if (!localStorage.getItem("aether:v2:state")) localStorage.setItem("aether:v2:state", JSON.stringify(value));
  }, state);
}
