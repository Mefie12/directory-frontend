"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrganizationBilling, type OrganizationPlan } from "@/lib/api";
import { formatMoney, formatUtcDate, tierLabel } from "@/components/dashboard/manual-plans/manual-plan-utils";
import { getAuthToken } from "@/lib/client-auth";
import { organizationPath } from "@/lib/workspace";

const token = () => getAuthToken() ?? undefined;

const STATE_STYLE: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Starts soon", className: "bg-blue-50 text-blue-700 border-blue-200" },
  active: { label: "Active", className: "bg-green-50 text-green-700 border-green-200" },
  grace: { label: "Renewal due", className: "bg-amber-50 text-amber-800 border-amber-200" },
  expired: { label: "Ended", className: "bg-gray-100 text-gray-600 border-gray-200" },
  revoked: { label: "Ended", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

/**
 * Billing tab for Owners and members with the billing toggle (permission
 * billing.manage). Shows the plans invoiced to this organization with price and
 * invoice reference. Nothing here can be changed: Mefie records plans, so changes
 * go through the support contact.
 */
export function OrganizationBilling({ slug }: { slug: string }) {
  const [plans, setPlans] = useState<OrganizationPlan[] | null>(null);
  const [contact, setContact] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrganizationBilling(slug, token())
      .then((result) => {
        if (cancelled) return;
        setPlans(result.data);
        setContact(result.meta_extra?.contact_email ?? null);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (failed) return <p className="text-sm text-red-600">We couldn&apos;t load billing.</p>;
  if (!plans) return <Skeleton className="h-40 w-full rounded-2xl" />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Plans are billed per listing and invoiced to this organization.
        {contact && (
          <>
            {" "}To renew or change one, contact{" "}
            <a href={`mailto:${contact}`} className="text-[#548235] hover:underline">
              {contact}
            </a>
            .
          </>
        )}
      </p>

      {plans.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
          No paid plans yet. Your listings are on the free Basic plan.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          {plans.map((plan) => {
            const state = STATE_STYLE[plan.state] ?? STATE_STYLE.expired;
            return (
              <li key={plan.id} className="space-y-1 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    {plan.listing.slug ? (
                      <Link href={`${organizationPath(slug, "listings")}/${plan.listing.slug}`} className="font-medium text-[#1F3A4C] hover:underline">
                        {plan.listing.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-[#1F3A4C]">{plan.listing.name}</span>
                    )}
                    <p className="text-xs text-gray-500">
                      {tierLabel(plan.plan)} · {formatUtcDate(plan.starts_at)} to {formatUtcDate(plan.ends_at)}
                    </p>
                  </div>
                  <Badge variant="outline" className={state.className}>
                    {state.label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  {plan.price_amount ? formatMoney(plan.price_amount, plan.currency) : "No price recorded"}
                  {plan.billing_cadence && ` · ${plan.billing_cadence}`}
                  {plan.invoice_reference && ` · Invoice ${plan.invoice_reference}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
