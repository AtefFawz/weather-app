import { expect, test } from "@playwright/test";
import { mockApp } from "./helpers";

test("shows a friendly error with retry when the API is down and nothing is cached", async ({ page }) => {
  await mockApp(page, { forecastStatus: 500 });
  await page.goto("/");
  // The client retries 5xx with backoff before giving up, so allow for it.
  await expect(page.getByRole("alert")).toContainText("Weather is unavailable", { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("keeps showing the last forecast when a refresh fails", async ({ page }) => {
  await mockApp(page);
  await page.goto("/");
  await expect(page.getByTestId("temperature")).toBeVisible();

  await page.unroute("**/v1/forecast**");
  await page.route("**/v1/forecast**", (route) => route.fulfill({ status: 503, body: "{}" }));
  await page.getByRole("button", { name: "Refresh weather" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Showing the last forecast" })).toBeVisible();
  await expect(page.getByTestId("temperature")).toBeVisible();
});

test("says so when the connection drops but keeps the last forecast on screen", async ({ page, context }) => {
  await mockApp(page);
  await page.goto("/");
  await expect(page.getByTestId("temperature")).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByRole("status").filter({ hasText: "You’re offline" })).toBeVisible();
  await expect(page.getByTestId("temperature")).toBeVisible();
});
