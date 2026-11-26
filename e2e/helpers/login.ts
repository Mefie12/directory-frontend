import type { Page } from "@playwright/test";
import { ACCOUNTS, e2ePassword, type AccountKey } from "../fixtures/accounts";

/** Signs in through the real login form (the same path a person uses). */
export async function signIn(page: Page, account: AccountKey, redirect = "/dashboard"): Promise<void> {
  await page.goto(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
  // Submitting before React has hydrated makes the browser do a native form submit and reload the page,
  // which looks like "sign-in did nothing". Wait for the page to settle first.
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Enter your email").fill(ACCOUNTS[account].email);
  await page.getByPlaceholder("Enter your password").fill(e2ePassword());
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
