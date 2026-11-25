"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, Gem, Loader2 } from "lucide-react";

import { ApiRequestError, ListingManualPlanDetail, ManualPlan, getListingManualPlan } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ManualPlanFormDialog, ManualPlanFormMode } from "./manual-plan-form-dialog";
import { ManualPlanActionDialog } from "./manual-plan-action-dialog";
import {
  CADENCE_LABEL,
  EVENT_LABEL,
  INACTIVE_LABEL,
  STATE_META,
  describeOverrides,
  formatMoney,
  formatUtcDate,
  formatUtcDateTime,
  isLivePlan,
  tierLabel,
} from "./manual-plan-utils";

interface Props {
  slug: string;
  listingName: string;
  /** Plan label already known to the page; shown to admins without billing access. */
  fallbackPlan?: string;
}

const PILL = "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#548235]/10 text-[#548235]";

/**
 * Per-listing plan section for the admin listing page. It sits inside the
 * "Listing Details" card and uses that card's row style. Admins without the
 * billing permission only see the plan label; holders see the full commercial
 * record and can assign, renew, change, edit and end a manually billed plan.
 * Laravel enforces all of it: hiding things here is only a convenience.
 */
export function ManualPlanCard({ slug, listingName, fallbackPlan }: Props) {
  const { user } = useAuth();
  // Both the backend flag (features.billing_admin) and the staff permission are required.
  const canManage = user?.features?.billing_admin === true && user?.permissions?.manage_billing === true;

  const [detail, setDetail] = useState<ListingManualPlanDetail | null>(null);
  const [loading, setLoading] = useState(canManage);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<ManualPlanFormMode | null>(null);
  const [actionMode, setActionMode] = useState<"revoke" | "review" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken") ?? undefined;
      setDetail(await getListingManualPlan(slug, token));
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Could not load this listing's plan.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, load]);

  if (!canManage) {
    return <SubscriptionHeader right={<span className={PILL}>{tierLabel(fallbackPlan)} plan</span>} />;
  }

  if (loading && !detail) {
    return (
      <div>
        <SubscriptionHeader right={<Loader2 className="h-4 w-4 animate-spin text-gray-400" />} />
        <p className="pb-2 text-sm text-gray-500" role="status">Loading plan...</p>
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div>
        <SubscriptionHeader right={null} />
        <div className="space-y-2 pb-2">
          <p className="text-sm text-red-600" role="alert">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>
        </div>
      </div>
    );
  }

  const current = detail?.current ?? null;
  const history = (detail?.history ?? []).filter((p) => p.id !== current?.id);
  const events = detail?.events ?? [];
  const canAssign = detail?.eligibility.can_assign === true;
  // Any save changes several things at once (state, history, audit trail), so reload them all.
  const afterSave = () => void load();

  return (
    <div className="pb-2">
      <SubscriptionHeader right={<span className={PILL}>{tierLabel(detail?.listing.effective_plan)} plan in effect</span>} />

      <div className="space-y-4">
        {current ? (
          <CurrentPlan
            plan={current}
            onAction={setFormMode}
            onEnd={() => setActionMode("revoke")}
            onReview={() => setActionMode("review")}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">This listing has no manually billed plan.</p>
            {canAssign ? (
              <Button size="sm" onClick={() => setFormMode("grant")}>Assign manual plan</Button>
            ) : (
              // Explained up front, so nobody fills in a long form only to be refused at the end.
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{detail?.eligibility.message ?? "A plan can't be assigned to this listing right now."}</p>
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <details className="border-t border-gray-100 pt-3 text-sm">
            <summary className="cursor-pointer font-medium text-gray-700">Previous terms ({history.length})</summary>
            <ul className="mt-3 space-y-3">
              {history.map((p) => (
                <li key={p.id} className="border-l-2 border-gray-200 pl-3">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
                    {tierLabel(p.contracted_plan)}
                    <Badge variant="outline" className={STATE_META[p.state].className}>{STATE_META[p.state].label}</Badge>
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatUtcDate(p.starts_at)} to {formatUtcDate(p.ends_at)}
                    {p.revoke_reason ? ` · ${p.revoke_reason}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        )}

        {events.length > 0 && (
          <details className="border-t border-gray-100 pt-3 text-sm">
            <summary className="cursor-pointer font-medium text-gray-700">Audit trail ({events.length})</summary>
            <ol className="mt-3 space-y-3">
              {events.map((event) => (
                <li key={event.id} className="border-l-2 border-gray-200 pl-3">
                  <p className="font-medium text-gray-900">
                    {EVENT_LABEL[event.action] ?? event.action}
                    {event.from_plan !== event.to_plan && (
                      <span className="ml-1 font-normal text-gray-500">
                        ({tierLabel(event.from_plan)} to {tierLabel(event.to_plan)})
                      </span>
                    )}
                  </p>
                  {event.reason && <p className="text-gray-600">{event.reason}</p>}
                  <p className="text-xs text-gray-400">
                    {event.actor?.name ? `${event.actor.name} · ` : "System · "}
                    {formatUtcDateTime(event.occurred_at)}
                  </p>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>

      {formMode && (
        <ManualPlanFormDialog
          mode={formMode}
          open
          onOpenChange={(open) => !open && setFormMode(null)}
          listingSlug={slug}
          listingName={listingName}
          plan={formMode === "grant" ? undefined : (current ?? undefined)}
          onDone={afterSave}
        />
      )}
      {actionMode && current && (
        <ManualPlanActionDialog
          mode={actionMode}
          plan={current}
          open
          onOpenChange={(open) => !open && setActionMode(null)}
          onDone={afterSave}
        />
      )}
    </div>
  );
}

function CurrentPlan({
  plan,
  onAction,
  onEnd,
  onReview,
}: {
  plan: ManualPlan;
  onAction: (mode: ManualPlanFormMode) => void;
  onEnd: () => void;
  onReview: () => void;
}) {
  const state = STATE_META[plan.state];
  const overrides = describeOverrides(plan.entitlement_overrides);
  const inactive = plan.inactive_reason ? INACTIVE_LABEL[plan.inactive_reason] : null;
  const live = isLivePlan(plan);

  return (
    <div className="space-y-4">
      {plan.needs_review && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Needs a decision</p>
            <p>{plan.needs_review_reason ?? "Ownership of this listing changed."}</p>
          </div>
          <Button size="sm" variant="outline" onClick={onReview}>Review</Button>
        </div>
      )}
      {inactive && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="status">{inactive}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{tierLabel(plan.contracted_plan)}</span>
        <Badge variant="outline" className={state.className}>{state.label}</Badge>
      </div>

      <div>
        {plan.customer && <DetailRow label="Customer">{plan.customer.email}</DetailRow>}
        <DetailRow label="Starts">{formatUtcDate(plan.starts_at)}</DetailRow>
        <DetailRow label="Ends">{plan.ends_at_label}</DetailRow>
        <DetailRow label="Features stay on until">{plan.grace_ends_at_label}</DetailRow>
        <DetailRow label="Recorded price">
          {formatMoney(plan.price_amount, plan.currency)}
          {plan.billing_cadence ? `, ${CADENCE_LABEL[plan.billing_cadence]}` : ""}
        </DetailRow>
        {plan.invoice_reference && <DetailRow label="Invoice">{plan.invoice_reference}</DetailRow>}
        {plan.contract_url && (
          <DetailRow label="Contract">
            <a
              href={plan.contract_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#548235] hover:underline"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </DetailRow>
        )}
        {overrides.length > 0 && <DetailRow label="Custom limits">{overrides.join(", ")}</DetailRow>}
      </div>

      {plan.notes && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Internal notes</p>
          {/* Plain text only: rendered as text, never as HTML. */}
          <p className="whitespace-pre-wrap text-sm text-gray-700">{plan.notes}</p>
        </div>
      )}

      {live && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <Button size="sm" variant="outline" onClick={() => onAction("extend")}>Renew</Button>
          <Button size="sm" variant="outline" onClick={() => onAction("replace")} disabled={plan.state === "scheduled"}>
            Change tier now
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAction("edit")}>Edit details</Button>
          <Button size="sm" variant="outline" onClick={onEnd} className="text-red-600 hover:text-red-700">End plan</Button>
        </div>
      )}
    </div>
  );
}

function SubscriptionHeader({ right }: { right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-gray-500 shrink-0">
        <Gem className="w-4 h-4 text-gray-400" />
        Subscription
      </span>
      {right}
    </div>
  );
}

/** Same row style as the "Listing Details" rows around it. */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-right text-gray-900">{children}</span>
    </div>
  );
}
