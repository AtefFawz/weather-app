import { test } from "@playwright/test";
import { forecastPayload } from "../../src/data/fixtures";
import { mockApp, seedState } from "./helpers";

// Regenerates docs/screenshots. Run with: SCREENSHOTS=1 npx playwright test screenshots
test.skip(!process.env["SCREENSHOTS"], "set SCREENSHOTS=1 to regenerate docs/screenshots");

const STATE = {
  version: 2,
  temperatureUnit: "celsius",
  windUnit: "kmh",
  theme: "dark",
  language: "en",
  selected: {
    id: "360630",
    name: "Cairo",
    admin1: "Cairo Governorate",
    country: "Egypt",
    countryCode: "EG",
    latitude: 30.04,
    longitude: 31.24,
    timezone: "Africa/Cairo",
    source: "search",
  },
  saved: [],
};

test.use({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1.5 });

test("capture", async ({ page }) => {
  await mockApp(page, { forecast: forecastPayload() });
  await seedState(page, STATE);
  await page.goto("/");
  await page.getByTestId("temperature").waitFor();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "docs/screenshots/dashboard-day.png", fullPage: true });

  await page.getByTestId("hourly-chart").focus();
  for (let i = 0; i < 2; i++) await page.keyboard.press("PageUp");
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "docs/screenshots/time-travel-night.png" });
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("cai");
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/screenshots/command-palette.png" });
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "docs/screenshots/mobile.png" });

  await seedState(page, { ...STATE, language: "ar", theme: "light" });
  await page.reload();
  await page.getByTestId("temperature").waitFor();
  await page.waitForTimeout(1500);
  await page.setViewportSize({ width: 1360, height: 900 });
  await page.screenshot({ path: "docs/screenshots/arabic-light.png" });
});
