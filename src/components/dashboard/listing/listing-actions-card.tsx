"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { CursorClick, LockSimple } from "@phosphor-icons/react";
import { getListingInteractionStats, type ListingInteractionAction, type ListingInteractionStats } from "@/lib/api";
import { getAuthToken } from "@/lib/client-auth";
import { Button } from "@/components/ui/button";

const ACTION_LABEL: Record<ListingInteractionAction, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  website: "Website",
  directions: "Directions",
  email: "Email",
  tickets: "Tickets",
  register: "Register",
  online: "Join online",
};

const PLACEMENT_LABEL: Record<string, string> = {
  bar: "Top of the page",
  sticky: "Phone bottom bar",
  card: "Get in touch card",
  sidebar: "Contact details",
  map: "Map",
  event: "Event details",
};

const DEVICE_LABEL: Record<string, string> = { mobile: "Phones", tablet: "Tablets", desktop: "Computers" };

function changeText(total: number, previous: number): string | null {
  if (previous === 0) return total > 0 ? "First taps this month" : null;
  const percent = Math.round(((total - previous) / previous) * 100);
  if (percent === 0) return "Same as last month";
  return `${percent > 0 ? "+" : ""}${percent}% vs last month`;
}

function planName(plan: string | null): string {
  return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "a paid";
}

/** Non-zero entries of a breakdown, largest first, with readable labels. */
function breakdown(values: Record<string, number>, labels: Record<string, string>): { key: string; label: string; count: number }[] {
  return Object.entries(values)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: labels[key] ?? key, count }));
}

/**
 * V2 Phase 6.3: "Actions this month", how often visitors used this listing's contact
 * buttons. Totals on every plan; the daily chart, placements, devices and click-through
 * rate on plans with insights. Renders nothing while counting is switched off or the
 * member has no analytics access.
 */
export function ListingActionsCard({ listingSlug }: { listingSlug: string }) {
  const [state, setState] = useState<"loading" | "ready" | "hidden" | "error">("loading");
  const [stats, setStats] = useState<ListingInteractionStats | null>(null);
  // The listing page renders separate mobile and desktop columns, so ids must be unique.
  const headingId = useId();

  // Only state changes in the promise callbacks, so the effect never sets state synchronously.
  const fetchStats = useCallback(
    () =>
      getListingInteractionStats(listingSlug, getAuthToken() ?? undefined)
        .then((data) => {
          setStats(data);
          setState(data ? "ready" : "hidden");
        })
        .catch(() => setState("error")),
    [listingSlug],
  );

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const retry = () => {
    setState("loading");
    void fetchStats();
  };

  if (state === "hidden") return null;

  if (state === "loading") {
    return <div className="h-32 animate-pulse rounded-xl border border-gray-100 bg-white" aria-label="Loading contact actions" />;
  }

  if (state === "error" || !stats) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-600">
        <p>Couldn&apos;t load this month&apos;s contact actions.</p>
        <Button variant="link" size="sm" className="h-auto px-0 text-[#5F8B0A]" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  const actions = breakdown(stats.by_action, ACTION_LABEL);
  const change = changeText(stats.total, stats.previous_total);
  const insights = stats.insights;
  const peak = insights ? Math.max(1, ...insights.daily.map((day) => day.total)) : 1;

  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-gray-100 bg-white p-4" data-testid="listing-actions-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={headingId} className="text-sm font-semibold text-gray-900">
            Actions this month
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">Visitors who tapped Call, WhatsApp, Website and your other contact buttons.</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F4F9E8] text-[#5F8B0A]">
          <CursorClick className="h-4.5 w-4.5" weight="fill" aria-hidden="true" />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-gray-900" data-testid="listing-actions-total">
        {stats.total.toLocaleString()}
      </p>
      {change && <p className="text-xs text-gray-500">{change}</p>}

      {actions.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm">
          {actions.map((item) => (
            <li key={item.key} className="flex items-center justify-between">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-semibold text-gray-900">{item.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-500">No one has used your contact buttons yet this month.</p>
      )}

      {insights ? (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
          {insights.click_through_rate !== null && (
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{insights.click_through_rate}%</span> of visitors used a contact button.
            </p>
          )}
          <div
            className="flex h-16 items-end gap-0.5"
            role="img"
            aria-label={`Taps per day this month, highest ${peak} in a day`}
          >
            {insights.daily.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.total}`}
                className="flex-1 rounded-t bg-[#93C01F]/80"
                style={{ height: `${Math.max(4, (day.total / peak) * 100)}%`, opacity: day.total === 0 ? 0.25 : 1 }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <BreakdownList title="Where" items={breakdown(insights.by_placement, PLACEMENT_LABEL)} />
            <BreakdownList title="Device" items={breakdown(insights.by_device, DEVICE_LABEL)} />
          </div>
        </div>
      ) : (
        !stats.insights_available && (
          <p className="mt-4 flex items-start gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <LockSimple className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Daily trends, where taps come from and your click-through rate are on the {planName(stats.required_plan)} plan.
          </p>
        )
      )}
    </section>
  );
}

function BreakdownList({ title, items }: { title: string; items: { key: string; label: string; count: number }[] }) {
  return (
    <div>
      <p className="font-semibold text-gray-700">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-gray-400">None yet</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {items.map((item) => (
            <li key={item.key} className="flex justify-between gap-2 text-gray-600">
              <span className="truncate">{item.label}</span>
              <span className="font-medium text-gray-900">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
