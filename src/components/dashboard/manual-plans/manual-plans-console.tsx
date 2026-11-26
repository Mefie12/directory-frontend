"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";

import {
  ApiRequestError,
  ManualPlan,
  ManualPlanListResponse,
  ManualPlanState,
  ManualPlanTier,
  getManualPlans,
} from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { RoleGuard } from "@/components/dashboard/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CADENCE_LABEL,
  INACTIVE_LABEL,
  STATE_META,
  formatMoney,
  tierLabel,
} from "./manual-plan-utils";
import { getAuthToken } from "@/lib/client-auth";

const ALL = "all";

export default function ManualPlansConsole() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ConsoleBody />
    </RoleGuard>
  );
}

function ConsoleBody() {
  const { user } = useAuth();
  // Both the backend flag (features.billing_admin) and the staff permission are required.
  const canManage = user?.features?.billing_admin === true && user?.permissions?.manage_billing === true;

  const [status, setStatus] = useState<string>(ALL);
  const [tier, setTier] = useState<string>(ALL);
  const [expiring, setExpiring] = useState<string>(ALL);
  const [needsReview, setNeedsReview] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<ManualPlanListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the free-text search so typing does not fire a request per key.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken() ?? undefined;
      setResult(
        await getManualPlans(token, {
          status: status === ALL ? "" : (status as ManualPlanState),
          plan: tier === ALL ? "" : (tier as ManualPlanTier),
          q: search,
          needsReview,
          expiringWithin: expiring === ALL ? undefined : Number(expiring),
          page,
        }),
      );
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Could not load manual plans.");
    } finally {
      setLoading(false);
    }
  }, [status, tier, expiring, needsReview, search, page]);

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, load]);

  if (user && !canManage) {
    return (
      <div className="p-2 lg:p-6">
        <div className="max-w-xl rounded-lg border bg-white p-6">
          <h1 className="text-xl font-semibold">Billing access required</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manual plans are managed by a small group of billing administrators. Ask one of them if you need a plan recorded or changed.
          </p>
        </div>
      </div>
    );
  }

  const rows = result?.data ?? [];
  const meta = result?.meta;
  const summary = result?.summary;
  const currencies = Object.entries(summary?.annualised_by_currency ?? {});
  const filtered = Boolean(search) || status !== ALL || tier !== ALL || expiring !== ALL || needsReview;

  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="p-2 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Manually billed plans</h1>
          <p className="text-sm text-gray-500">
            Plans invoiced outside the card system. Open a listing to assign or change one.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shadow-none" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={ClipboardList}
          label="Plans in force"
          value={summary ? String(summary.in_force_count) : "-"}
        />
        <SummaryCard
          icon={Wallet}
          label="Annualised value"
          value={currencies.length === 0 ? "-" : currencies.map(([code, amount]) => formatMoney(amount, code)).join("  ·  ")}
          hint="Each currency is shown separately and never converted."
        />
        <SummaryCard
          icon={CalendarClock}
          label="One-off or custom cadence"
          value={summary ? String(summary.unannualised_count) : "-"}
          hint="Counted separately because they can't be annualised."
        />
      </section>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200" role="alert">
          {error}{" "}
          <button className="underline" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              aria-label="Search by listing name or invoice reference"
              placeholder="Search listing or invoice..."
              className="pl-9 shadow-none"
              value={searchInput}
              maxLength={100}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <FilterSelect label="State" value={status} onChange={resetPage(setStatus)} width="w-[150px]">
              <SelectItem value={ALL}>All states</SelectItem>
              {(Object.keys(STATE_META) as ManualPlanState[]).map((s) => (
                <SelectItem key={s} value={s}>{STATE_META[s].label}</SelectItem>
              ))}
            </FilterSelect>
            <FilterSelect label="Tier" value={tier} onChange={resetPage(setTier)} width="w-[130px]">
              <SelectItem value={ALL}>All tiers</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="advance">Advance</SelectItem>
            </FilterSelect>
            <FilterSelect label="Ending" value={expiring} onChange={resetPage(setExpiring)} width="w-[160px]">
              <SelectItem value={ALL}>Any end date</SelectItem>
              <SelectItem value="30">Within 30 days</SelectItem>
              <SelectItem value="60">Within 60 days</SelectItem>
              <SelectItem value="90">Within 90 days</SelectItem>
            </FilterSelect>
            <Button
              variant={needsReview ? "default" : "outline"}
              className="shadow-none"
              aria-pressed={needsReview}
              onClick={() => {
                setNeedsReview((v) => !v);
                setPage(1);
              }}
            >
              Needs review
            </Button>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-black">Listing</TableHead>
                  <TableHead className="font-semibold text-black">Customer</TableHead>
                  <TableHead className="font-semibold text-black">Tier</TableHead>
                  <TableHead className="font-semibold text-black">State</TableHead>
                  <TableHead className="font-semibold text-black">Ends</TableHead>
                  <TableHead className="font-semibold text-black">Recorded price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading plans...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                      {filtered
                        ? "No plans match these filters."
                        : "No manual plans yet. Open a listing and choose Assign manual plan."}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((plan) => <PlanRow key={plan.id} plan={plan} />)
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {meta && meta.last_page > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {meta.current_page} of {meta.last_page} ({meta.total} plans)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="shadow-none" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <Button variant="outline" size="sm" className="shadow-none" disabled={page >= meta.last_page || loading} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

function PlanRow({ plan }: { plan: ManualPlan }) {
  const state = STATE_META[plan.state];
  const differs = plan.effective_plan !== null && plan.effective_plan !== plan.contracted_plan;
  const inactive = plan.inactive_reason ? INACTIVE_LABEL[plan.inactive_reason] : null;

  return (
    <TableRow className="hover:bg-gray-50/50">
      <TableCell className="font-medium">
        <div className="flex flex-wrap items-center gap-2">
          {plan.listing.slug ? (
            <Link href={`/dashboard/listings/${plan.listing.slug}`} className="text-gray-900 hover:text-[#548235] hover:underline">
              {plan.listing.name}
            </Link>
          ) : (
            plan.listing.name
          )}
          {plan.needs_review && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Needs review</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">
                  {plan.organization && <span className="block font-medium text-gray-800">{plan.organization.name}</span>}
                  {plan.customer?.email ?? "-"}
                </TableCell>
      <TableCell>
        <span className="font-medium">{tierLabel(plan.contracted_plan)}</span>
        {differs && (
          <p className="text-xs text-red-700" title={inactive ?? undefined}>
            In effect: {tierLabel(plan.effective_plan)}
          </p>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={state.className}>{state.label}</Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">{plan.ends_at_label}</TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {formatMoney(plan.price_amount, plan.currency)}
        {plan.billing_cadence ? (
          <span className="text-xs text-gray-500"> / {CADENCE_LABEL[plan.billing_cadence].toLowerCase()}</span>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

/** Same look as the dashboard stat cards: green top rule, round tinted icon. */
function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="w-full rounded-2xl border border-[#E3E8EF] border-t-4 border-t-[#93C01F] bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-normal text-[#0F1A2A]">{label}</h2>
          <p className="mt-3 break-words text-xl font-semibold text-[#0F1A2A]">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF3F9]">
          <Icon className="h-5 w-5 text-[#0F1A2A]" strokeWidth={2.2} />
        </div>
      </div>
      {hint && <p className="mt-3 text-sm text-[#65758B]">{hint}</p>}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  width,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  width: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={`${width} shadow-none`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
