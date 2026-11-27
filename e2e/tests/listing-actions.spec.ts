import { test, expect } from "../fixtures/guard";
import { signIn } from "../helpers/login";

/**
 * V2 Phase 6.1: the free listing action bar (md files/V2-phase6-listing-actions-cta-spec.md §4.1).
 * Runs on a desktop and a phone project; the e2e stack builds with NEXT_PUBLIC_LISTING_ACTION_BAR=true.
 * Seeded "Accra Sourdough Company" has a phone, an email and a street address (no website or WhatsApp);
 * "Accra Food Fair" is an event with a venue and no ticket link.
 */

const BUSINESS = "/businesses/accra-sourdough";
const EVENT = "/events/accra-food-fair";

test.describe("listing action bar", () => {
  test("a business shows its contact actions and a closing card", async ({ page, isMobile }) => {
    await page.goto(BUSINESS);
    const bar = page.getByRole("group", { name: "Get in touch" }).filter({ visible: true }).first();
    await expect(bar).toBeVisible();
    await expect(bar.getByText("Call", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Directions/ }).filter({ visible: true }).first()).toHaveAttribute(
      "href",
      /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/,
    );

    await expect(page.getByRole("heading", { name: "Get in touch", exact: true })).toBeVisible();

    if (!isMobile) {
      // Desktop can't dial: Call shows the number to copy instead of a tel: link (spec Q-6).
      await bar.getByRole("button", { name: /Call/ }).click();
      await expect(page.getByRole("dialog").getByRole("link", { name: "241234567" })).toHaveAttribute("href", "tel:241234567");
    } else {
      await expect(bar.getByRole("link", { name: /Call/ })).toHaveAttribute("href", "tel:241234567");
    }
  });

  test("on a phone the actions stick to the bottom after scrolling, and the WhatsApp floater steps aside", async ({ page, isMobile, guard }) => {
    test.skip(!isMobile, "The sticky bar is mobile-only.");
    // This project runs against the legacy-auth stack, where the login page probes the session routes (404 by design).
    guard.allow(404, /\/api\/session\//);
    await signIn(page, "customer", BUSINESS);
    await expect(page).toHaveURL(new RegExp(BUSINESS));
    await expect(page.getByRole("link", { name: "Chat with us on WhatsApp" })).toBeVisible();

    await page.mouse.wheel(0, 1500);
    // A test id: once hidden the bar is aria-hidden and inert, so role queries can't see inside it (by design).
    const sticky = page.getByTestId("sticky-listing-actions");
    await expect(sticky).toHaveAttribute("aria-hidden", "false");
    await expect(page.getByRole("link", { name: "Chat with us on WhatsApp" })).toHaveCount(0);

    await page.mouse.wheel(0, -5000);
    await expect(sticky).toHaveAttribute("aria-hidden", "true");
    await expect(page.getByRole("link", { name: "Chat with us on WhatsApp" })).toBeVisible();
  });

  test("an event offers directions to its venue", async ({ page }) => {
    await page.goto(EVENT);
    const bar = page.getByRole("group", { name: "Get in touch" }).filter({ visible: true }).first();
    await expect(bar.getByRole("link", { name: /Directions/ })).toBeVisible();
    await expect(bar.getByText("Call", { exact: true })).toHaveCount(0);
  });
});

/**
 * V2 Phase 6.3: a visitor's tap is counted and shows on the listing team's dashboard.
 * Counting dedupes a visitor (IP + user agent) for 30 minutes, and the e2e cache outlives
 * a run, so this test uses a user agent of its own each run.
 */
test.describe("contact-action counts", () => {
  test.use({
    userAgent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 run-${Date.now()}`,
  });

  test("a visitor's tap shows in the listing team's dashboard", async ({ page, isMobile, guard }) => {
    test.skip(isMobile, "One project is enough; the phone bar is covered above.");
    // This project runs against the legacy-auth stack, where the login page probes the session routes (404 by design).
    guard.allow(404, /\/api\/session\//);

    await page.goto(BUSINESS);
    const bar = page.getByRole("group", { name: "Get in touch" }).filter({ visible: true }).first();
    const reported = page.waitForResponse(
      (response) => response.url().includes("/interactions") && response.request().method() === "POST",
    );
    await bar.getByRole("button", { name: /Call/ }).click();
    expect((await reported).status()).toBe(204);

    await signIn(page, "vendor");
    await expect(page).toHaveURL(/\/dashboard\/org\/[^/?#]+$/);
    await page.goto(`${page.url()}/listings/accra-sourdough`);

    const card = page.getByTestId("listing-actions-card").filter({ visible: true });
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { name: "Actions this month" })).toBeVisible();
    await expect(card.getByTestId("listing-actions-total")).not.toHaveText("0");
    await expect(card.getByText("Call", { exact: true })).toBeVisible();
  });
});
