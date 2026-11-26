import { test, expect } from "../fixtures/guard";
import { signIn } from "../helpers/login";

/**
 * V2 dashboard workspaces: Personal (/dashboard/...) vs one organization
 * (/dashboard/org/[slug]/...). The e2e stack runs with organizations on and seeds
 * Kofi (vendor) owning "Accra Bakery Group" and Abena (vendorTwo) owning
 * "Kumasi Textiles"; Abena reviewed Kofi's "Accra Sourdough Company".
 */

const ORG_HOME = /\/dashboard\/org\/[^/?#]+$/;
const sidebar = (page: import("@playwright/test").Page) => page.locator('[data-sidebar="sidebar"]');
const switcher = (page: import("@playwright/test").Page) => page.getByRole("button", { name: /Switch workspace/ });

test.describe("dashboard workspaces", () => {
  // This project runs against the legacy-auth stack, where the login page probes the session routes (404 by design).
  test.beforeEach(async ({ guard }) => {
    guard.allow(404, /\/api\/session\//);
  });

  test("a vendor lands in their organization and sees only its pages", async ({ page }) => {
    await signIn(page, "vendor");
    await expect(page).toHaveURL(ORG_HOME);
    await expect(switcher(page)).toContainText("Accra Bakery Group");
    await expect(page.getByText(/Welcome back,\s*Kofi/)).toBeVisible();

    await expect(sidebar(page).getByRole("link", { name: "Listings" })).toBeVisible();
    await expect(sidebar(page).getByRole("link", { name: "Bookmarks" })).toHaveCount(0);

    await sidebar(page).getByRole("link", { name: "Listings" }).click();
    await expect(page).toHaveURL(/\/dashboard\/org\/[^/]+\/listings$/);
    await expect(page.getByText("Accra Sourdough Company").filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText("Kumasi Kente Weavers")).toHaveCount(0);

    await sidebar(page).getByRole("link", { name: "Reviews" }).click();
    await expect(page.getByRole("heading", { name: "Reviews received" })).toBeVisible();
    await expect(page.getByText("Wonderful bread.").filter({ visible: true }).first()).toBeVisible();
  });

  test("switching to Personal shows personal pages and is remembered", async ({ page }) => {
    await signIn(page, "vendor");
    await expect(page).toHaveURL(ORG_HOME);

    await switcher(page).click();
    await page.getByRole("menuitem", { name: /Personal/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(switcher(page)).toContainText("Personal");
    await expect(sidebar(page).getByRole("link", { name: "Bookmarks" })).toBeVisible();
    await expect(sidebar(page).getByRole("link", { name: "Listings" })).toHaveCount(0);

    await sidebar(page).getByRole("link", { name: "Reviews I wrote" }).click();
    await expect(page.getByRole("heading", { name: "Reviews I wrote" })).toBeVisible();

    // Reload keeps the workspace: the URL is the source of truth.
    await page.reload();
    await expect(switcher(page)).toContainText("Personal");
  });

  test("the reviewer sees the review under Reviews I wrote", async ({ page }) => {
    await signIn(page, "vendorTwo");
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/dashboard/reviews");
    await expect(page.getByRole("heading", { name: "Reviews I wrote" })).toBeVisible();
    await expect(page.getByText("Wonderful bread.").filter({ visible: true }).first()).toBeVisible();
  });

  test("old links move into the organization workspace", async ({ page }) => {
    await signIn(page, "vendor");
    await expect(page).toHaveURL(ORG_HOME);
    const orgHome = page.url();

    await page.goto("/dashboard/my-listing");
    await expect(page).toHaveURL(/\/dashboard\/org\/[^/]+\/listings$/);

    await page.goto(`${orgHome}?tab=members`);
    await expect(page).toHaveURL(/\/dashboard\/org\/[^/]+\/members$/);
  });

  test("a non-member cannot open another organization", async ({ page, guard }) => {
    // Laravel answers 404 for organizations the user does not belong to (existence is not disclosed).
    guard.allow(404, /\/api\/organizations\//);
    await signIn(page, "vendor");
    await expect(page).toHaveURL(ORG_HOME);

    // Kofi does not belong to Abena's organization.
    await page.goto("/dashboard/org/kumasi-textiles");
    await expect(page).toHaveURL(/\/dashboard\/org$/);
  });
});
