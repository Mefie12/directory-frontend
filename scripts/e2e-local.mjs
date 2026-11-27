// V2 Phase 5.4a: runs the Playwright smoke tests against a full local stack.
//   npm run e2e:local [-- <playwright args>]
// Seeds a throwaway database, starts Laravel (:8110) and two Next.js servers (:3101 legacy token mode,
// :3102 cookie mode), runs the suite, then stops everything. See md files/V2-phase5-playwright-smoke-spec.md.
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envFile = resolve(root, "e2e/.env.e2e");
const backendDir = resolve(root, process.env.E2E_BACKEND_DIR ?? "../directory-backend");
const dbName = process.env.E2E_DB_NAME ?? "mefie_e2e";
const nextMode = process.env.E2E_NEXT_MODE ?? "start";

const BACKEND_PORT = 8110;
const LEGACY_PORT = 3101;
const COOKIE_PORT = 3102;
const API_URL = `http://127.0.0.1:${BACKEND_PORT}`;

function fail(message) {
  console.error(`\ne2e: ${message}\n`);
  process.exit(1);
}

// ── Preconditions ──────────────────────────────────────────────────────────
if (!existsSync(resolve(backendDir, "artisan"))) {
  fail(`Laravel not found at ${backendDir}. Set E2E_BACKEND_DIR to the directory-backend folder.`);
}
if (!/e2e|testing/.test(dbName)) fail(`The database name "${dbName}" must contain "e2e" or "testing": it is wiped on every run.`);

if (!existsSync(envFile)) {
  const generated = randomBytes(18).toString("base64url");
  writeFileSync(envFile, `E2E_PASSWORD=${generated}\n`, { mode: 0o600 });
  console.log(`e2e: created ${envFile} with a generated test password (untracked).`);
}
const fileEnv = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);
const password = process.env.E2E_PASSWORD ?? fileEnv.E2E_PASSWORD;
if (!password || password.length < 12) fail("E2E_PASSWORD must be at least 12 characters (set it in e2e/.env.e2e).");

// ── Environments ───────────────────────────────────────────────────────────
const backendEnv = {
  ...process.env,
  APP_ENV: "local",
  APP_DEBUG: "false",
  APP_URL: API_URL,
  DB_DATABASE: dbName,
  E2E_SEED_ALLOWED: "true",
  E2E_PASSWORD: password,
  // Throwaway stores: never touch the developer's Redis or sessions.
  CACHE_STORE: "file",
  SESSION_DRIVER: "file",
  QUEUE_CONNECTION: "sync",
  MAIL_MAILER: "log",
  BROADCAST_CONNECTION: "log",
  MEDIA_DISK: "public",
  RATE_LIMIT_MULTIPLIER: "100",
  // The built-in PHP server handles one request at a time by default; a page fires many in parallel.
  PHP_CLI_SERVER_WORKERS: "4",
  ORGANIZATIONS_ENABLED: "true",
  ORGANIZATIONS_OWNERSHIP_SOURCE: "organization",
  ORGANIZATIONS_TEAMS_ENABLED: "true",
  ORGANIZATIONS_LIFECYCLE_ENABLED: "true",
  ORG_VERIFICATION_PUBLIC: "true",
  VIEW_DEDUPE_ENABLED: "true",
};

const frontendBase = {
  ...process.env,
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_PUBLIC_API_URL: API_URL,
  API_URL,
  NEXT_TELEMETRY_DISABLED: "1",
  // V2 Phase 6.1: the listing action bar is tested switched on.
  NEXT_PUBLIC_LISTING_ACTION_BAR: "true",
};

const children = [];
function start(label, command, args, options) {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], detached: true, ...options });
  children.push(child);
  // Server output goes to test-results/stack-<label>.log (and the terminal with E2E_VERBOSE=1).
  mkdirSync(resolve(root, "test-results"), { recursive: true });
  const log = createWriteStream(resolve(root, `test-results/stack-${label}.log`));
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  child.stdout.on("data", (chunk) => process.env.E2E_VERBOSE && process.stdout.write(`[${label}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.env.E2E_VERBOSE && process.stderr.write(`[${label}] ${chunk}`));
  child.on("exit", (code) => {
    if (code && !stopping) console.error(`e2e: ${label} exited early with code ${code}`);
  });
  return child;
}

let stopping = false;
function stopAll() {
  stopping = true;
  for (const child of children) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
}
process.on("SIGINT", () => {
  stopAll();
  process.exit(130);
});

async function waitFor(url, label, timeoutMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error(`${label} did not come up at ${url} within ${timeoutMs / 1000}s`);
}

function run(label, command, args, options) {
  console.log(`e2e: ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) fail(`${label} failed (exit ${result.status}).`);
}

async function assertPortFree(port, label) {
  await new Promise((done, reject) => {
    const probe = createServer();
    probe.once("error", () => reject(new Error(`Port ${port} (${label}) is already in use: a previous run or another server is still running. Stop it and retry.`)));
    probe.once("listening", () => probe.close(() => done()));
    probe.listen(port, "127.0.0.1");
  });
}

let exitCode = 1;
try {
  await assertPortFree(BACKEND_PORT, "Laravel");
  await assertPortFree(LEGACY_PORT, "Next.js legacy");
  await assertPortFree(COOKIE_PORT, "Next.js cookie");

  // 1. Database
  run(`seeding ${dbName} (wiped and rebuilt)`, "php", ["artisan", "e2e:seed", "--fresh"], { cwd: backendDir, env: backendEnv });

  // 2. Backend
  start("laravel", "php", ["artisan", "serve", "--host=127.0.0.1", `--port=${BACKEND_PORT}`], { cwd: backendDir, env: backendEnv });
  await waitFor(`${API_URL}/api/categories`, "Laravel");

  // 3. Frontend
  if (nextMode === "start" && !process.env.E2E_SKIP_BUILD) {
    // `next build` rewrites tsconfig.json (reformats it and adds the .next-e2e type folders); put it back.
    const tsconfigPath = resolve(root, "tsconfig.json");
    const tsconfigBefore = readFileSync(tsconfigPath, "utf8");
    run("building the frontend (set E2E_SKIP_BUILD=1 to reuse the last build)", "npx", ["next", "build"], { cwd: root, env: frontendBase });
    writeFileSync(tsconfigPath, tsconfigBefore);
  }
  const nextArgs = (port) => (nextMode === "dev" ? ["next", "dev", "-p", String(port)] : ["next", "start", "-p", String(port)]);
  start("next-legacy", "npx", nextArgs(LEGACY_PORT), { cwd: root, env: { ...frontendBase, PORT: String(LEGACY_PORT) } });
  start("next-cookie", "npx", nextArgs(COOKIE_PORT), { cwd: root, env: { ...frontendBase, PORT: String(COOKIE_PORT), AUTH_COOKIE_ENABLED: "true" } });
  await waitFor(`http://127.0.0.1:${LEGACY_PORT}/`, "Next.js (legacy mode)");
  await waitFor(`http://127.0.0.1:${COOKIE_PORT}/`, "Next.js (cookie mode)");

  // 3b. Warm Laravel's cold caches (category availability queries take several seconds the first time and would
  // trip the proxy's 10 s timeout during the first test).
  console.log("e2e: warming caches");
  for (const path of [
    "categories?is_top=true", "categories_with_listings", "countries_dropdown",
    "business_categories?country=Ghana", "event_categories?country=Ghana", "community_categories?country=Ghana",
    "business_categories", "event_categories", "community_categories",
    "listings_by_geolocation?per_page=12", "discover_events?preset=this_week&per_page=15&country=Ghana",
    "curated_collections?country=Ghana", "country_context",
  ]) {
    await fetch(`${API_URL}/api/${path}`, { headers: { Accept: "application/json" } }).catch(() => undefined);
  }

  // 4. Tests
  console.log("e2e: running Playwright");
  const result = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      E2E_PASSWORD: password,
      E2E_LEGACY_URL: `http://127.0.0.1:${LEGACY_PORT}`,
      E2E_COOKIE_URL: `http://127.0.0.1:${COOKIE_PORT}`,
    },
  });
  exitCode = result.status ?? 1;
} catch (error) {
  console.error(`\ne2e: ${error.message}\n`);
} finally {
  stopAll();
}
process.exit(exitCode);
