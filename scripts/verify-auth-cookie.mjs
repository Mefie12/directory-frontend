// V2 Phase 5.2a: unit checks for the pure cookie/CSRF helpers (no test framework in this repo).
// Run: npm run verify:auth-cookie
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync("src/lib/auth-cookie.ts", "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const lib = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check("cookie name is __Host- only over https", () => {
  assert.equal(lib.sessionCookieName(true), "__Host-mefie_session");
  assert.equal(lib.sessionCookieName(false), "mefie_session");
});
check("lifetime matches the 720-minute Sanctum token", () => assert.equal(lib.SESSION_MAX_AGE_SECONDS, 43200));
check("the flag is off unless exactly 'true'", () => {
  assert.equal(lib.authCookieEnabled({}), false);
  assert.equal(lib.authCookieEnabled({ AUTH_COOKIE_ENABLED: "1" }), false);
  assert.equal(lib.authCookieEnabled({ AUTH_COOKIE_ENABLED: "true" }), true);
});
check("tokenFromBody finds every shape the backend has used", () => {
  assert.equal(lib.tokenFromBody({ token: "a" }), "a");
  assert.equal(lib.tokenFromBody({ access_token: "b" }), "b");
  assert.equal(lib.tokenFromBody({ jwt: "c" }), "c");
  assert.equal(lib.tokenFromBody({ data: { token: "d" } }), "d");
  assert.equal(lib.tokenFromBody({ data: { access_token: "e" } }), "e");
  assert.equal(lib.tokenFromBody({}), null);
  assert.equal(lib.tokenFromBody(null), null);
  assert.equal(lib.tokenFromBody({ token: "" }), null);
});
check("stripTokens removes the token at every depth and keeps the rest", () => {
  const out = lib.stripTokens({ message: "ok", token: "x", user: { id: 1, access_token: "y" }, data: { token: "z", name: "n" } });
  assert.deepEqual(out, { message: "ok", user: { id: 1 }, data: { name: "n" } });
});
check("readSessionToken reads either cookie name", () => {
  assert.equal(lib.readSessionToken((n) => (n === "__Host-mefie_session" ? "s" : undefined)), "s");
  assert.equal(lib.readSessionToken((n) => (n === "mefie_session" ? "p" : undefined)), "p");
  assert.equal(lib.readSessionToken(() => undefined), null);
});
const base = { host: "site.test", usesCookie: true, isSessionRoute: false };
check("CSRF: safe methods always pass", () => {
  assert.equal(lib.csrfAllowed({ ...base, method: "GET", origin: null, referer: null }), true);
});
check("CSRF: a cookie POST needs a same-host Origin", () => {
  assert.equal(lib.csrfAllowed({ ...base, method: "POST", origin: "https://site.test", referer: null }), true);
  assert.equal(lib.csrfAllowed({ ...base, method: "POST", origin: "https://evil.test", referer: null }), false);
  assert.equal(lib.csrfAllowed({ ...base, method: "POST", origin: null, referer: null }), false);
});
check("CSRF: falls back to Referer when Origin is absent", () => {
  assert.equal(lib.csrfAllowed({ ...base, method: "DELETE", origin: null, referer: "https://site.test/dashboard" }), true);
  assert.equal(lib.csrfAllowed({ ...base, method: "DELETE", origin: null, referer: "https://evil.test/x" }), false);
});
check("CSRF: a bearer-header request is not a CSRF risk", () => {
  assert.equal(lib.csrfAllowed({ ...base, usesCookie: false, method: "POST", origin: null, referer: null }), true);
});
check("CSRF: session routes are always checked (login CSRF)", () => {
  assert.equal(lib.csrfAllowed({ ...base, usesCookie: false, isSessionRoute: true, method: "POST", origin: "https://evil.test", referer: null }), false);
  assert.equal(lib.csrfAllowed({ ...base, usesCookie: false, isSessionRoute: true, method: "POST", origin: "https://site.test", referer: null }), true);
});
check("CSRF: a malformed Origin is rejected", () => {
  assert.equal(lib.csrfAllowed({ ...base, method: "POST", origin: "not a url", referer: null }), false);
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}\n     ${error.message}`);
  }
}
if (failed > 0) process.exit(1);
console.log(`${checks.length} checks passed`);
