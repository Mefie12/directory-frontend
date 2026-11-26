/** Accounts created by the backend's E2eSeeder. The password comes from E2E_PASSWORD (never committed). */
export const ACCOUNTS = {
  admin: { email: "e2e-admin@example.test", name: "Eden", landing: /\/dashboard/ },
  vendor: { email: "e2e-vendor@example.test", name: "Kofi", landing: /\/dashboard/ },
  vendorTwo: { email: "e2e-vendor2@example.test", name: "Abena", landing: /\/dashboard/ },
  customer: { email: "e2e-customer@example.test", name: "Esi", landing: /\/(dashboard|discover)/ },
  agent: { email: "e2e-agent@example.test", name: "Yaw", landing: /\/dashboard/ },
} as const;

export type AccountKey = keyof typeof ACCOUNTS;

export function e2ePassword(): string {
  const password = process.env.E2E_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("E2E_PASSWORD is not set. Copy e2e/.env.e2e.example to e2e/.env.e2e and set it (npm run e2e:local loads it).");
  }
  return password;
}
