import { test, expect } from "../fixtures/guard";

// Seeded data (E2eSeeder): approved listings "Accra Sourdough Company", "Basic Bakes", "Kumasi Kente Weavers",
// an event "Accra Food Fair" and a community "Ghana Bakers Circle". Staging mode (5.4c) will run a
// structure-only subset because staging data is not controlled.

test.describe("public pages", () => {
  // The lists follow the visitor's country (cookie, else IP; a local IP falls back to the UK). The seeded
  // listings are in Ghana, so choose Ghana the way the site stores a visitor's choice.
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([{ name: "mefie_master_country", value: "GH", url: baseURL! }]);
  });

  test("the home page loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main, body").first()).toBeVisible();
  });

  test("discover loads with listings and no errors", async ({ page }) => {
    await page.goto("/discover");
    // First request after startup warms Laravel's caches, so allow it longer than the default.
    await expect(page.getByText("Accra Sourdough Company").first()).toBeVisible({ timeout: 25_000 });
  });

  test("the businesses list shows seeded businesses and not the pending one", async ({ page }) => {
    await page.goto("/businesses");
    await expect(page.getByText("Accra Sourdough Company").first()).toBeVisible();
    await expect(page.getByText("Draft Pastry Studio")).toHaveCount(0);
  });

  test("a business page shows its name and the verified organization by-line", async ({ page }) => {
    await page.goto("/businesses/accra-sourdough");
    await expect(page.getByRole("heading", { name: "Accra Sourdough Company" })).toBeVisible();
    await expect(page.getByText("Accra Bakery Group")).toBeVisible();
    await expect(page.getByText("Verified organization")).toBeVisible();
  });

  test("a business page never shows the creator's name or email", async ({ page }) => {
    await page.goto("/businesses/accra-sourdough");
    await expect(page.getByRole("heading", { name: "Accra Sourdough Company" })).toBeVisible();
    await expect(page.getByText("e2e-vendor@example.test")).toHaveCount(0);
    await expect(page.getByText("Kofi Vendor")).toHaveCount(0);
  });

  test("an unknown business is a not-found page, not a crash", async ({ page, guard }) => {
    guard.allow(404, /\/api\/listing\/does-not-exist/);
    const response = await page.goto("/businesses/does-not-exist");
    expect([200, 404]).toContain(response?.status());
  });

  test("the category page loads", async ({ page }) => {
    await page.goto("/categories/food-dining");
    await expect(page.getByText(/Food & Dining/i).first()).toBeVisible();
  });

  test("events and communities load", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByText("Accra Food Fair").first()).toBeVisible();
    await page.goto("/communities");
    await expect(page.getByText("Ghana Bakers Circle").first()).toBeVisible();
  });

  test("the event page loads", async ({ page }) => {
    await page.goto("/events/accra-food-fair");
    await expect(page.getByRole("heading", { name: "Accra Food Fair" })).toBeVisible();
  });
});

test.describe("cookie banner", () => {
  test.use({ consent: "ask" });

  test("the analytics banner appears and can be rejected", async ({ page }) => {
    await page.goto("/discover");
    const banner = page.getByRole("dialog", { name: "Cookie preferences" });
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Reject All" }).click();
    await expect(banner).toBeHidden();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("mefie_consent_v2") ?? "{}").analytics)).toBe(false);
  });
});
