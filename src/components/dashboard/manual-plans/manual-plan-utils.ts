import type {
  ManualPlan,
  ManualPlanCadence,
  ManualPlanOverrides,
  ManualPlanState,
} from "@/lib/api";

export const TIER_LABEL: Record<string, string> = {
  basic: "Basic",
  pro: "Pro",
  advance: "Advance",
};

export function tierLabel(plan?: string | null): string {
  if (!plan) return "Basic";
  return TIER_LABEL[plan] ?? plan;
}

export const STATE_META: Record<ManualPlanState, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-sky-50 text-sky-700 border-sky-200" },
  active: { label: "Active", className: "bg-green-50 text-green-700 border-green-200" },
  grace: { label: "In grace period", className: "bg-amber-50 text-amber-800 border-amber-200" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-600 border-gray-200" },
  revoked: { label: "Ended by admin", className: "bg-red-50 text-red-700 border-red-200" },
};

export const CADENCE_LABEL: Record<ManualPlanCadence, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  one_off: "One-off",
  custom: "Custom",
};

export const INACTIVE_LABEL: Record<string, string> = {
  listing_suspended: "The listing is suspended, so paid features are switched off.",
  listing_rejected: "The listing is rejected, so paid features are switched off.",
};

export const EVENT_LABEL: Record<string, string> = {
  granted: "Plan assigned",
  edited: "Details edited",
  extended: "Plan renewed",
  replaced: "Tier changed",
  revoked: "Plan ended",
  reviewed: "Ownership review",
  needs_review: "Flagged for review",
  activated: "Plan switched on",
  downgraded: "Dropped to Basic",
  synced: "Plan refreshed",
};

/**
 * Per-customer limit overrides a manual plan may carry. This mirrors
 * config/plans.php for display only; Laravel validates every value and is the
 * only authority on caps and what may be unlimited.
 */
export interface OverrideField {
  key: string;
  label: string;
  kind: "int" | "bool";
  cap?: number;
  unlimitedOk?: boolean;
}

export const OVERRIDE_FIELDS: OverrideField[] = [
  { key: "gallery_images", label: "Gallery items", kind: "int", cap: 20 },
  { key: "gallery_videos", label: "Gallery videos", kind: "int", cap: 5 },
  { key: "social_handles", label: "Social handles", kind: "int", cap: 6 },
  { key: "services", label: "Services", kind: "int", cap: 200, unlimitedOk: true },
  { key: "cta_slots", label: "Promoted buttons", kind: "int", cap: 5 },
  { key: "tier_badge", label: "Tier badge", kind: "bool" },
];

export interface OverrideDraftEntry {
  enabled: boolean;
  value: string;
  unlimited: boolean;
}

export type OverrideDraft = Record<string, OverrideDraftEntry>;

export function overridesToDraft(overrides: ManualPlanOverrides | null | undefined): OverrideDraft {
  const draft: OverrideDraft = {};
  for (const field of OVERRIDE_FIELDS) {
    const has = overrides != null && Object.prototype.hasOwnProperty.call(overrides, field.key);
    const raw = has ? overrides?.[field.key] : undefined;
    draft[field.key] = {
      enabled: has,
      value: typeof raw === "number" ? String(raw) : "",
      unlimited: has && raw === null,
    };
  }
  return draft;
}

/** Turns the editor state back into the API shape. Returns null when nothing is overridden. */
export function draftToOverrides(draft: OverrideDraft): ManualPlanOverrides | null {
  const result: ManualPlanOverrides = {};
  for (const field of OVERRIDE_FIELDS) {
    const entry = draft[field.key];
    if (!entry?.enabled) continue;
    if (field.kind === "bool") {
      result[field.key] = true;
    } else if (entry.unlimited && field.unlimitedOk) {
      result[field.key] = null;
    } else if (entry.value.trim() !== "" && /^\d+$/.test(entry.value.trim())) {
      result[field.key] = Number(entry.value.trim());
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

export function sameOverrides(a: ManualPlanOverrides | null | undefined, b: ManualPlanOverrides | null | undefined): boolean {
  const normalise = (o: ManualPlanOverrides | null | undefined) =>
    JSON.stringify(
      Object.keys(o ?? {})
        .sort()
        .map((k) => [k, (o as ManualPlanOverrides)[k]]),
    );
  return normalise(a) === normalise(b);
}

export function describeOverrides(overrides: ManualPlanOverrides | null | undefined): string[] {
  if (!overrides) return [];
  return OVERRIDE_FIELDS.filter((f) => Object.prototype.hasOwnProperty.call(overrides, f.key)).map((f) => {
    const value = overrides[f.key];
    if (f.kind === "bool") return `${f.label}: on`;
    return `${f.label}: ${value === null ? "unlimited" : value}`;
  });
}

export function formatMoney(amount: string | null, currency: string | null): string {
  if (amount === null || !currency) return "Not recorded";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(Number(amount));
  } catch {
    return `${amount} ${currency}`;
  }
}

const utcDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatUtcDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "-" : utcDate.format(date);
}

export function formatUtcDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${utcDate.format(date)} ${date.toISOString().slice(11, 16)} UTC`;
}

/**
 * "14 Mar 2026 23:59 UTC" for a date-only input plus optional grace days. The
 * server stores an end date as the END of that day in UTC; this shows the same
 * instant so the admin confirms exactly what will be saved.
 */
export function endOfDayUtcLabel(dateInput: string, addDays = 0): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!match) return "-";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + addDays, 23, 59, 59));
  return `${utcDate.format(date)} 23:59 UTC`;
}

/** yyyy-mm-dd of an ISO instant, in UTC, for date inputs. */
export function isoToDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

/** Today's date in UTC as yyyy-mm-dd, matching how the server reads every date. */
export function todayUtcDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysToDateInput(dateInput: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!match) return "";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return date.toISOString().slice(0, 10);
}

/** The later of two yyyy-mm-dd dates (they sort correctly as strings). */
export function laterDate(a: string, b: string): string {
  return a >= b ? a : b;
}

export function addYearsToDateInput(dateInput: string, years: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!match) return "";
  const date = new Date(Date.UTC(Number(match[1]) + years, Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10);
}

/** The most recent plan that confers or will confer access (not ended). */
export function isLivePlan(plan: ManualPlan): boolean {
  return plan.state === "active" || plan.state === "grace" || plan.state === "scheduled";
}
