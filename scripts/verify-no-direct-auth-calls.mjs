// V2 Phase 5.2b gate: the browser must not call Laravel directly with a bearer token, because
// once the session lives in an httpOnly cookie on this site's origin the browser has no token
// to send and the cookie is never sent to Laravel. Authenticated calls go through src/app/api.
// Run: npm run verify:no-direct-auth-calls
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

// Every entry needs a reason. The list only shrinks: 5.2c removes the sign-in flows,
// the rest are endpoints that do not exist in Laravel (dead code paths) or are parked.
const ALLOW = {
  "src/app/(private)/auth/signup/page.tsx": "sign-up and OTP flow, moves in 5.2c",
  "src/app/(private)/auth/verify/page.tsx": "email OTP flow, moves to /api/session/verify in 5.2c",
  "src/app/(private)/dashboard/settings/page.tsx": "delete_account is parked (route/verb bug, see rescope 4.1 item 13)",
  "src/app/(private)/claim/[id]/page.tsx": "public /show call; left because of an uncommitted local hotfix in this file",
  "src/app/(private)/dashboard/my-events/page.tsx": "GET /api/user/events/saved has no Laravel route (dead)",
  "src/app/(private)/dashboard/my-events/[slug]/page.tsx": "GET /api/events/{slug} has no Laravel route (dead)",
  "src/app/(private)/dashboard/monetization/page.tsx": "GET /api/admin/monetization has no Laravel route (dead)",
  "src/components/dashboard/home/vendor-home.tsx": "GET /api/listing/{id} has no Laravel route (dead)",
  "src/components/dashboard/home/customer-home.tsx": "GET /api/events/recommended has no Laravel route (dead)",
  "src/components/about/testimonial-carousel.tsx": "public GET /api/ratings; the token is optional and the page works anonymously",
  "src/components/ux/universal-slug-page.tsx": "public /show and /socials; the token is optional, embedded data is the fallback",
  "src/components/verify/verify-email.tsx": "unused component",
  "src/components/ux/testRoleChange.tsx": "unused debug component",
  "src/context/bookmark-context.tsx": "GET /api/listings/{id} fallback has no Laravel route (dead)",
  "src/app/(private)/dashboard/users/[id]/page.tsx": "DELETE /api/users/{id} has no Laravel route (dead)",
};

const SKIP_DIRS = ["src/app/api", "src/lib/bff"].map((p) => p.split("/").join(sep));
const DIRECT = /\$\{(?:API_URL|API_BASE_URL|BASE_URL|apiUrl|API_BASE|getApiUrl\(\))\}\/api\//;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.some((skip) => path === skip)) walk(path, out);
    } else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

const failures = [];
const used = new Set();

for (const file of walk("src")) {
  const key = file.split(sep).join("/");
  const text = readFileSync(file, "utf8");
  // File level on purpose: headers are often built in a variable well before the fetch.
  if (!/Authorization/.test(text)) continue;
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || !DIRECT.test(line)) return;
    if (key in ALLOW) {
      used.add(key);
      return;
    }
    failures.push(`${key}:${i + 1}  direct call in a file that sends Authorization: ${trimmed.slice(0, 90)}`);
  });
}

const stale = Object.keys(ALLOW).filter((key) => !used.has(key));

if (failures.length || stale.length) {
  if (failures.length) console.error(`Direct authenticated calls to Laravel:\n- ${failures.join("\n- ")}`);
  if (stale.length) console.error(`Stale allowlist entries (remove them):\n- ${stale.join("\n- ")}`);
  process.exit(1);
}
console.log(`No unlisted direct authenticated calls (${used.size} allowlisted files).`);
