// V2 Phase 5.3c: checks for the Vercel shared-cache rules and a gate that routes can only be
// shared through the helper. Run: npm run verify:public-cache
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync("src/lib/public-cache.ts", "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const lib = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

check("parses Laravel's public policy", () => {
  assert.deepEqual(lib.parseSharedPolicy("public, s-maxage=60, stale-while-revalidate=300"), { sMaxAge: 60, swr: 300 });
  assert.deepEqual(lib.parseSharedPolicy("public, s-maxage=300"), { sMaxAge: 300, swr: 0 });
});
check("anything not clearly public is not shared", () => {
  for (const value of [null, "", "no-cache, private", "private, no-store", "public", "public, max-age=60", "public, s-maxage=0", "public, s-maxage=60, private", "no-store, s-maxage=60"]) {
    assert.equal(lib.parseSharedPolicy(value), null, String(value));
  }
});
check("shared headers: browsers revalidate, the CDN holds the copy", () => {
  const headers = lib.sharedHeaders({ sMaxAge: 60, swr: 300 });
  assert.equal(headers["Cache-Control"], "public, max-age=0, must-revalidate");
  assert.equal(headers["Vercel-CDN-Cache-Control"], "max-age=60, stale-while-revalidate=300");
  assert.equal(lib.sharedHeaders({ sMaxAge: 30, swr: 0 })["Vercel-CDN-Cache-Control"], "max-age=30");
});
const ok = { status: 200, upstreamCacheControl: "public, s-maxage=60, stale-while-revalidate=300", authenticated: false, cacheable: true };
check("an eligible response is shared", () => {
  assert.ok(lib.responseHeadersFor(ok)["Vercel-CDN-Cache-Control"]);
});
check("signed-in callers are never shared", () => {
  assert.deepEqual(lib.responseHeadersFor({ ...ok, authenticated: true }), lib.PRIVATE_HEADERS);
});
check("a response not fixed by the URL (cookie, IP, dropped params) is never shared", () => {
  assert.deepEqual(lib.responseHeadersFor({ ...ok, cacheable: false }), lib.PRIVATE_HEADERS);
});
check("errors are never shared", () => {
  for (const status of [301, 400, 401, 404, 422, 429, 500, 502, 504]) {
    assert.deepEqual(lib.responseHeadersFor({ ...ok, status }), lib.PRIVATE_HEADERS, String(status));
  }
});
check("when Laravel does not say public, nothing is shared (its flag is the master switch)", () => {
  assert.deepEqual(lib.responseHeadersFor({ ...ok, upstreamCacheControl: "no-cache, private" }), lib.PRIVATE_HEADERS);
  assert.deepEqual(lib.responseHeadersFor({ ...ok, upstreamCacheControl: null }), lib.PRIVATE_HEADERS);
});

// Gate: only the helper may emit shared-cache headers from a proxy route.
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (name === "route.ts") out.push(path);
  }
  return out;
}
// Pre-existing, reviewed routes that set their own shared headers or Next data-cache revalidation.
const LEGACY = {
  "src/app/api/listing/[listing_slug]/services/route.ts": "public service list; own s-maxage 60, reviewed",
  "src/app/api/listings_by_geolocation/route.ts": "Next data cache keyed by IP and master country in the upstream URL, never shared across visitors",
  "src/app/api/country-context/route.ts": "country catalogue fetch with revalidate 60",
  "src/app/api/all_users/route.ts": "private, no-store (the pattern this gate protects)",
};
check("only the helper (or a reviewed legacy route) sets shared-cache headers or revalidation", () => {
  const offenders = [];
  for (const file of walk("src/app/api")) {
    const key = file.split("\\").join("/");
    if (key in LEGACY) continue;
    const text = readFileSync(file, "utf8");
    if (/s-maxage|Vercel-CDN-Cache-Control|CDN-Cache-Control|public,|revalidate\s*:|next:\s*\{\s*revalidate/.test(text)) {
      offenders.push(key);
    }
  }
  assert.deepEqual(offenders, [], `shared caching outside lib/bff/public-cache.ts: ${offenders.join(", ")}`);
});
check("proxy routes using the helper never read cookies themselves", () => {
  for (const file of walk("src/app/api")) {
    const text = readFileSync(file, "utf8");
    if (text.includes("proxyPublicGet")) assert.ok(!/cookies\.get|cookies\(\)/.test(text), file);
  }
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
