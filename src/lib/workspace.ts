/**
 * Dashboard workspaces (V2): a vendor or customer is either in their Personal
 * workspace (/dashboard/...) or in one organization (/dashboard/org/[orgSlug]/...).
 *
 * The URL is the source of truth for which workspace is open. The only thing
 * remembered is the last workspace used, and only to choose where /dashboard
 * lands after login.
 */

export type WorkspaceRef = { kind: "personal" } | { kind: "organization"; slug: string };

export const PERSONAL_HOME = "/dashboard";

/** Sections an organization workspace has, in sidebar order. */
export type OrganizationSection = "" | "listings" | "reviews" | "members" | "activity" | "billing" | "settings";

/** `/dashboard/org/{slug}` plus an optional sub path (no leading slash). */
export function organizationPath(slug: string, subPath = ""): string {
  const base = `/dashboard/org/${encodeURIComponent(slug)}`;
  return subPath ? `${base}/${subPath}` : base;
}

/** Organization slugs that are real routes, not organizations. */
const RESERVED_ORG_SEGMENTS = new Set(["new"]);

/** The organization slug in a dashboard path, or null for a personal path. */
export function organizationSlugFromPath(pathname: string | null): string | null {
  const match = pathname?.match(/^\/dashboard\/org\/([^/?#]+)/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  return RESERVED_ORG_SEGMENTS.has(slug) ? null : slug;
}

/** The section of an organization path (`/dashboard/org/x/reviews` → "reviews"). */
export function organizationSectionFromPath(pathname: string | null): OrganizationSection {
  const match = pathname?.match(/^\/dashboard\/org\/[^/]+\/([^/?#]+)/);
  const section = match?.[1] ?? "";
  const known: OrganizationSection[] = ["listings", "reviews", "members", "activity", "billing", "settings"];
  return (known as string[]).includes(section) ? (section as OrganizationSection) : "";
}

const storageKey = (userId: number | string) => `mefie.lastWorkspace.${userId}`;

/** The last workspace this user opened on this device, or null on first visit. */
export function readLastWorkspace(userId: number | string): WorkspaceRef | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "kind" in parsed) {
      const ref = parsed as { kind: unknown; slug?: unknown };
      if (ref.kind === "personal") return { kind: "personal" };
      if (ref.kind === "organization" && typeof ref.slug === "string" && ref.slug) {
        return { kind: "organization", slug: ref.slug };
      }
    }
  } catch {
    // Unreadable value: treat as first visit.
  }
  return null;
}

export function writeLastWorkspace(userId: number | string, workspace: WorkspaceRef): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(workspace));
  } catch {
    // Storage full or blocked: landing falls back to the default.
  }
}
