import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mockApp, seedState } from "./helpers";

const CAIRO_STATE = {
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

async function openApp(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("temperature")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await mockApp(page);
  await seedState(page, CAIRO_STATE);
});

test("renders the live forecast", async ({ page }) => {
  await openApp(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cairo");
  await expect(page.getByTestId("temperature")).toHaveText(/\d+°/);
  await expect(page.getByRole("heading", { name: "Next 48 hours" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Air quality" })).toBeVisible();
  await expect(page.getByTestId("sky")).toHaveAttribute("data-daylight", /\d/);
});

test("scrubbing the chart time-travels the whole sky", async ({ page }) => {
  await openApp(page);
  const chart = page.getByTestId("hourly-chart");
  const sky = page.getByTestId("sky");
  const daylightNow = Number(await sky.getAttribute("data-daylight"));
  expect(daylightNow).toBeGreaterThan(0.5);

  await chart.focus();
  await page.keyboard.press("PageUp");
  await page.keyboard.press("PageUp");
  await expect(page.getByRole("button", { name: "Back to now" }).first()).toBeVisible();
  // 12 hours after mid-afternoon it is the middle of the night: the sky is darker.
  await expect.poll(async () => Number(await sky.getAttribute("data-daylight"))).toBeLessThan(daylightNow);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Back to now" })).toHaveCount(0);
});

test("dragging on the chart changes the selected hour", async ({ page }) => {
  await openApp(page);
  const chart = page.getByTestId("hourly-chart");
  await chart.scrollIntoViewIfNeeded();
  const box = await chart.boundingBox();
  if (!box) throw new Error("chart not laid out");
  await page.mouse.move(box.x + box.width * 0.3, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + 100, { steps: 6 });
  await page.mouse.up();
  const value = Number(await chart.getAttribute("aria-valuenow"));
  expect(value).toBeGreaterThan(10);
});

test("unit toggles convert without refetching", async ({ page }) => {
  let forecastRequests = 0;
  page.on("request", (request) => request.url().includes("/v1/forecast") && forecastRequests++);
  await openApp(page);
  await expect(page.getByTestId("temperature")).toBeVisible();
  const before = forecastRequests;
  const celsius = await page.getByTestId("temperature").innerText();
  await page.getByRole("button", { name: "°F" }).click();
  await expect(page.getByTestId("temperature")).not.toHaveText(celsius);
  expect(forecastRequests).toBe(before);
});

test("command palette searches places and runs commands", async ({ page }) => {
  await openApp(page);
  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.fill("light theme");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await expect(page.getByRole("dialog")).toBeHidden();
  await page.keyboard.press("/");
  await page.getByLabel("Search places and commands").fill("Cairo");
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("saving a place adds it to the saved list and persists", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "Save this place" }).click();
  await expect(page.getByRole("navigation", { name: "Saved places" })).toContainText("Cairo");
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Saved places" })).toContainText("Cairo");
});

test("Arabic switches to RTL with translated content", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "التبديل إلى العربية" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("heading", { name: "توقعات 7 أيام" })).toBeVisible();
});

for (const theme of ["dark", "light"] as const) {
  test(`has no detectable accessibility violations (${theme})`, async ({ page }) => {
    await seedState(page, { ...CAIRO_STATE, theme });
    await openApp(page);
    await expect(page.getByTestId("temperature")).toBeVisible();
    const results = await new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}

test("@mobile fits the viewport without horizontal scrolling", async ({ page }) => {
  await openApp(page);
  await expect(page.getByTestId("temperature")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
