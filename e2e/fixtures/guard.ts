/* eslint-disable react-hooks/rules-of-hooks -- Playwright's fixture callback is named `use`, which is not a React Hook */
import { test as base, expect, type ConsoleMessage, type Page, type Request, type Response } from "@playwright/test";

/**
 * The guard that makes these smoke tests (spec section 3): every test fails on
 *  - an uncaught page error (this is what the 5.2c getAuthToken self-recursion looked like),
 *  - a console.error that is not on the reviewed allowlist below,
 *  - a same-origin response with status 5xx,
 *  - an unexpected same-origin /api 4xx (declare expected ones with guard.allow),
 *  - a failed same-origin request (aborted navigations are ignored).
 */
export type Guard = {
  /** Declare that a response with this status for a URL matching the pattern is expected in this test. */
  allow(status: number, urlPattern: RegExp): void;
};

// Each entry must say why it is safe to ignore. Keep this list short and review it in 5.4c.
const CONSOLE_ALLOWLIST: { pattern: RegExp; reason: string }[] = [
  // Resource-load noise is judged by the response listener below, so the console line adds nothing.
  { pattern: /^Failed to load resource:/, reason: "covered by the response check" },
  // Reviewed 2026-11-26 (5.4a): pusher-js logs this when its socket is torn down while a send is still queued
  // (sign-out or navigation). Third-party client noise; the app has no user-visible effect. Revisit if Pusher
  // channels become load-bearing again (the role-change broadcast is currently commented out).
  { pattern: /^WebSocket is already in CLOSING or CLOSED state\.?$/, reason: "pusher-js teardown noise" },
];

function sameOrigin(page: Page, url: string): boolean {
  try {
    const base = new URL(page.url() === "about:blank" ? url : page.url());
    return new URL(url).origin === base.origin;
  } catch {
    return false;
  }
}

export const test = base.extend<{ guard: Guard; consent: "denied" | "ask" }>({
  /** Most tests start with the analytics banner already answered (rejected) so it cannot cover buttons; set "ask" to see it. */
  consent: ["denied", { option: true }],

  page: async ({ page, consent }, use) => {
    if (consent === "denied") {
      await page.addInitScript(() => {
        if (!window.localStorage.getItem("mefie_consent_v2")) {
          window.localStorage.setItem(
            "mefie_consent_v2",
            JSON.stringify({ version: 2, analytics: false, marketing: false, updatedAt: new Date().toISOString() }),
          );
        }
      });
    }
    await use(page);
  },

  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      const allowed: { status: number; urlPattern: RegExp }[] = [];

      page.on("pageerror", (error) => problems.push(`page error: ${error.message.split("\n")[0]}`));

      page.on("console", (message: ConsoleMessage) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (CONSOLE_ALLOWLIST.some((entry) => entry.pattern.test(text))) return;
        problems.push(`console.error: ${text.split("\n")[0].slice(0, 200)}`);
      });

      page.on("response", (response: Response) => {
        const url = response.url();
        const status = response.status();
        if (!sameOrigin(page, url)) return;
        if (allowed.some((entry) => entry.status === status && entry.urlPattern.test(url))) return;
        const isApi = new URL(url).pathname.startsWith("/api/");
        if (status >= 500 || (isApi && status >= 400)) {
          problems.push(`${status} ${response.request().method()} ${new URL(url).pathname}`);
        }
      });

      page.on("requestfailed", (request: Request) => {
        const failure = request.failure()?.errorText ?? "";
        if (failure.includes("ERR_ABORTED") || failure.includes("NS_BINDING_ABORTED")) return;
        if (!sameOrigin(page, request.url())) return;
        problems.push(`request failed: ${request.method()} ${new URL(request.url()).pathname} (${failure})`);
      });

      await use({ allow: (status, urlPattern) => allowed.push({ status, urlPattern }) });

      expect(problems, `The page misbehaved:\n- ${problems.join("\n- ")}`).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
