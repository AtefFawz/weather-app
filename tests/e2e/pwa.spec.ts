import { expect, test } from "@playwright/test";
import { mockApp } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockApp(page);
});

test("publishes an installable standalone manifest with app identity and icons", async ({ page }) => {
  const response = await page.request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();

  const manifest = (await response.json()) as {
    name: string;
    short_name: string;
    display: string;
    start_url: string;
    scope: string;
    icons: Array<{ src: string; sizes: string; purpose?: string }>;
    screenshots: Array<{ src: string; form_factor?: string }>;
  };

  expect(manifest.name).toContain("Aether");
  expect(manifest.short_name).toBe("Aether");
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/");
  expect(manifest.scope).toBe("/");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "icons/icon-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "icons/icon-512.png", sizes: "512x512" }),
      expect.objectContaining({ src: "icons/icon-maskable-512.png", purpose: "maskable" }),
    ]),
  );
  expect(manifest.screenshots).toEqual(
    expect.arrayContaining([expect.objectContaining({ form_factor: "narrow" }), expect.objectContaining({ src: "screenshots/aether-dashboard.png" })]),
  );
});

test("serves the PWA icons and the iOS launch artwork", async ({ page }) => {
  for (const asset of [
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/icon-maskable-512.png",
    "/icons/apple-touch-icon.png",
    "/launch/launch-1179x2556.png",
  ]) {
    const response = await page.request.get(asset);
    expect(response.ok(), `${asset} should be served`).toBeTruthy();
  }
});

test("keeps the animated launch overlay out of ordinary browser visits", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("temperature")).toBeVisible();
  await expect(page.locator(".launch-screen")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Install app" })).toBeVisible();
});
