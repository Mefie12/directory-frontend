"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  ManualPlan,
  ManualPlanApiError,
  ManualPlanCadence,
  ManualPlanCommercialInput,
  ManualPlanTier,
  editManualPlan,
  extendManualPlan,
  grantManualPlan,
  replaceManualPlan,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CADENCE_LABEL,
  OVERRIDE_FIELDS,
  OverrideDraft,
  addDaysToDateInput,
  addYearsToDateInput,
  draftToOverrides,
  endOfDayUtcLabel,
  isoToDateInput,
  laterDate,
  overridesToDraft,
  sameOverrides,
  tierLabel,
  todayUtcDateInput,
} from "./manual-plan-utils";

export type ManualPlanFormMode = "grant" | "extend" | "replace" | "edit";

interface Props {
  mode: ManualPlanFormMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Required for `grant`. */
  listingSlug?: string;
  listingName?: string;
  /** Required for extend, replace and edit. */
  plan?: ManualPlan;
  onDone: (plan: ManualPlan) => void;
}

const dateRe = /^\d{4}-\d{2}-\d{2}$/;

const schema = z.object({
  plan: z.enum(["pro", "advance"]),
  starts_at: z.string().refine((v) => v === "" || dateRe.test(v), "Use a valid date"),
  ends_at: z.string(),
  grace_days: z
    .string()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 30), "Use 0 to 30 days"),
  price_amount: z
    .string()
    .refine((v) => v === "" || /^\d{1,10}(\.\d{1,2})?$/.test(v), "Use a number with up to 2 decimals"),
  currency: z.string().refine((v) => v === "" || /^[A-Za-z]{3}$/.test(v), "Use a 3-letter code, e.g. GBP"),
  billing_cadence: z.string(),
  invoice_reference: z.string().max(120, "At most 120 characters"),
  contract_url: z
    .string()
    .max(500, "At most 500 characters")
    .refine((v) => v === "" || v.startsWith("https://"), "Must start with https://"),
  notes: z.string().max(2000, "At most 2000 characters"),
  reason: z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500, "At most 500 characters"),
  password: z.string(),
});

type FormValues = z.infer<typeof schema>;

const COPY: Record<ManualPlanFormMode, { title: string; description: string; submit: string }> = {
  grant: {
    title: "Assign a manual plan",
    description: "Record a plan that is invoiced outside the card system. Paid features switch on for the listing owner.",
    submit: "Review and assign",
  },
  extend: {
    title: "Renew this plan",
    description: "Creates a new term that continues from the current end date. Everything you leave unchanged carries forward.",
    submit: "Review and renew",
  },
  replace: {
    title: "Change tier now",
    description: "Ends the current plan and starts the new tier immediately. The owner is told by email.",
    submit: "Review and change",
  },
  edit: {
    title: "Edit commercial details",
    description: "Dates and tier change only through renew or change tier.",
    submit: "Review and save",
  },
};

const COMMON_CURRENCIES = ["GBP", "EUR", "USD", "GHS", "NGN", "ZAR", "CAD", "AUD"];

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function ManualPlanFormDialog({
  mode,
  open,
  onOpenChange,
  listingSlug,
  listingName,
  plan,
  onDone,
}: Props) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<OverrideDraft>(() => overridesToDraft(plan?.entitlement_overrides));
  const [extraError, setExtraError] = useState<string | null>(null);

  const defaults = useMemo<FormValues>(() => {
    const currentEnd = isoToDateInput(plan?.ends_at);
    return {
      plan: (plan?.contracted_plan ?? "pro") as ManualPlanTier,
      // A new plan starts today unless the admin backdates it (for example to
      // record a customer who has already been paying).
      starts_at: mode === "grant" ? todayUtcDateInput() : "",
      ends_at:
        mode === "extend"
          ? addYearsToDateInput(laterDate(currentEnd, todayUtcDateInput()), 1)
          : mode === "replace"
            ? laterDate(currentEnd, todayUtcDateInput())
            : "",
      grace_days: "",
      price_amount: plan?.price_amount ?? "",
      currency: plan?.currency ?? "",
      billing_cadence: plan?.billing_cadence ?? "",
      invoice_reference: plan?.invoice_reference ?? "",
      contract_url: plan?.contract_url ?? "",
      notes: plan?.notes ?? "",
      reason: "",
      password: "",
    };
  }, [mode, plan]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    getValues,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (open) {
      reset(defaults);
      setDraft(overridesToDraft(plan?.entitlement_overrides));
      setStep("form");
      setExtraError(null);
    }
  }, [open, defaults, plan, reset]);

  const values = watch();
  const overridesNow = draftToOverrides(draft);
  const overridesChanged = !sameOverrides(plan?.entitlement_overrides, overridesNow);
  const needsPassword = mode !== "edit" || overridesChanged;
  const showTier = mode === "grant" || mode === "replace";
  const showDates = mode !== "edit";

  // The allowed end-date window, mirrored from the server rules (Laravel decides):
  // not before the start, not in the past, and at most three years long.
  const today = todayUtcDateInput();
  const termStart =
    mode === "grant"
      ? values.starts_at || today
      : mode === "extend"
        ? laterDate(addDaysToDateInput(isoToDateInput(plan?.ends_at), 1), today)
        : today;
  const minEnd = laterDate(termStart, today);
  const maxEnd = addYearsToDateInput(termStart, 3);

  /** Only what changed for edits; everything meaningful for the other modes. */
  const buildCommercial = (v: FormValues): ManualPlanCommercialInput => {
    const next: ManualPlanCommercialInput = {};
    const consider = <K extends keyof ManualPlanCommercialInput>(
      key: K,
      value: ManualPlanCommercialInput[K],
      original: ManualPlanCommercialInput[K] | undefined,
    ) => {
      if (mode === "edit") {
        if (value !== (original ?? null)) next[key] = value;
      } else if (value !== null && value !== undefined) {
        next[key] = value;
      }
    };

    consider("price_amount", nullable(v.price_amount), plan?.price_amount);
    consider("currency", nullable(v.currency)?.toUpperCase() ?? null, plan?.currency);
    consider("billing_cadence", (nullable(v.billing_cadence) as ManualPlanCadence | null), plan?.billing_cadence);
    consider("invoice_reference", nullable(v.invoice_reference), plan?.invoice_reference);
    consider("contract_url", nullable(v.contract_url), plan?.contract_url);
    consider("notes", nullable(v.notes), plan?.notes);

    if (mode === "grant" ? overridesNow !== null : overridesChanged) {
      next.entitlement_overrides = overridesNow;
    }
    return next;
  };

  const validateExtra = (v: FormValues): boolean => {
    let ok = true;
    if (showDates && !dateRe.test(v.ends_at)) {
      setError("ends_at", { message: "Choose an end date" });
      ok = false;
    }
    if (showDates && dateRe.test(v.ends_at)) {
      if (mode === "grant" && v.starts_at && v.ends_at < v.starts_at) {
        setError("ends_at", { message: "The end date can't be before the start date." });
        ok = false;
      } else if (v.ends_at < today) {
        setError("ends_at", { message: "The end date can't be in the past." });
        ok = false;
      } else if (v.ends_at < minEnd) {
        setError("ends_at", {
          message:
            mode === "extend"
              ? "The new end date must be after the current term ends."
              : "The end date can't be before the start date.",
        });
        ok = false;
      } else if (v.ends_at > maxEnd) {
        setError("ends_at", { message: "A plan can't run for more than 3 years." });
        ok = false;
      }
    }
    if (needsPassword && v.password.trim() === "") {
      setError("password", { message: "Enter your password to confirm" });
      ok = false;
    }
    if (nullable(v.price_amount) && !nullable(v.currency) && !plan?.currency) {
      setError("currency", { message: "Add a currency for the price" });
      ok = false;
    }
    return ok;
  };

  const onReview = (v: FormValues) => {
    if (!validateExtra(v)) return;
    setStep("confirm");
  };

  const mapServerErrors = (error: ManualPlanApiError): boolean => {
    let mapped = false;
    for (const [field, messages] of Object.entries(error.fieldErrors)) {
      const name = field.split(".")[0] as keyof FormValues | "entitlement_overrides";
      if (name === "entitlement_overrides") {
        setExtraError(messages[0] ?? "Check the limit overrides");
        mapped = true;
      } else if (name in defaults) {
        setError(name, { message: messages[0] });
        mapped = true;
      }
    }
    return mapped;
  };

  const confirm = async () => {
    const v = getValues();
    const token = localStorage.getItem("authToken") ?? undefined;
    const commercial = buildCommercial(v);
    const graceDays = v.grace_days === "" ? undefined : Number(v.grace_days);
    setSubmitting(true);
    setExtraError(null);

    try {
      let saved: ManualPlan;
      if (mode === "grant") {
        if (!listingSlug) throw new Error("Missing listing");
        saved = await grantManualPlan(
          listingSlug,
          {
            plan: v.plan,
            starts_at: v.starts_at || undefined,
            ends_at: v.ends_at,
            grace_days: graceDays,
            reason: v.reason.trim(),
            password: v.password,
            ...commercial,
          },
          token,
        );
      } else if (mode === "extend" && plan) {
        saved = await extendManualPlan(
          plan.id,
          {
            version: plan.version,
            ends_at: v.ends_at,
            grace_days: graceDays,
            reason: v.reason.trim(),
            password: v.password,
            ...commercial,
          },
          token,
        );
      } else if (mode === "replace" && plan) {
        saved = await replaceManualPlan(
          plan.id,
          {
            version: plan.version,
            plan: v.plan,
            ends_at: v.ends_at,
            grace_days: graceDays,
            reason: v.reason.trim(),
            password: v.password,
            ...commercial,
          },
          token,
        );
      } else if (mode === "edit" && plan) {
        saved = await editManualPlan(
          plan.id,
          {
            version: plan.version,
            reason: v.reason.trim(),
            ...(needsPassword ? { password: v.password } : {}),
            ...commercial,
          },
          token,
        );
      } else {
        throw new Error("Missing plan");
      }

      toast.success("Saved.");
      onDone(saved);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ManualPlanApiError) {
        // Field problems send the admin back to the form; other errors stay on this step.
        if (error.status === 422 && mapServerErrors(error)) {
          setStep("form");
        } else {
          setExtraError(error.message);
        }
      } else {
        setExtraError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copy = COPY[mode];
  const graceDaysNumber = values.grace_days === "" ? (plan?.grace_days ?? 7) : Number(values.grace_days);
  const currencyCode = (values.currency || plan?.currency || "").toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {listingName && (
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="font-medium text-slate-900">{listingName}</p>
            {plan && (
              <p className="text-sm text-slate-500">
                Current: {tierLabel(plan.contracted_plan)}, ends {plan.ends_at_label}
              </p>
            )}
          </div>
        )}

        {step === "confirm" ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Review before saving</p>
              <dl className="mt-3 space-y-2 text-sm">
                <SummaryRow label="Tier">{tierLabel(showTier ? values.plan : plan?.contracted_plan)}</SummaryRow>
                {showDates && (
                  <>
                    <SummaryRow label="Ends">{endOfDayUtcLabel(values.ends_at)}</SummaryRow>
                    <SummaryRow label="Features stay on until">
                      {endOfDayUtcLabel(values.ends_at, graceDaysNumber)}
                    </SummaryRow>
                  </>
                )}
                {nullable(values.price_amount) && (
                  <SummaryRow label="Recorded price">
                    {values.price_amount} {currencyCode}
                    {values.billing_cadence ? `, ${CADENCE_LABEL[values.billing_cadence as ManualPlanCadence] ?? values.billing_cadence}` : ""}
                  </SummaryRow>
                )}
                <SummaryRow label="Custom limits">{overridesNow ? "Set for this customer" : "None"}</SummaryRow>
                <SummaryRow label="Reason">{values.reason}</SummaryRow>
              </dl>
            </div>
            <p className="text-xs text-slate-500">All dates are in UTC. This is recorded in the audit trail.</p>
            {extraError && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{extraError}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("form")} disabled={submitting}>Back</Button>
              <Button onClick={confirm} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm and save
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onReview)} className="space-y-6 py-2" noValidate>
            {showTier && (
              <Field label="Tier" error={errors.plan?.message}>
                <Select value={values.plan} onValueChange={(v) => setValue("plan", v as ManualPlanTier)}>
                  <SelectTrigger id="mp-plan" className="w-full shadow-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="advance">Advance</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            {showDates && (
              <div className="grid gap-4 sm:grid-cols-3">
                {mode === "grant" && (
                  <Field label="Starts" hint="Defaults to today; earlier to backdate" error={errors.starts_at?.message}>
                    <Input
                      id="mp-starts"
                      type="date"
                      className="shadow-none"
                      {...register("starts_at", {
                        // Keep the end date valid when the start moves past it.
                        onChange: (e) => {
                          const start = e.target.value as string;
                          if (start && getValues("ends_at") && getValues("ends_at") < start) {
                            setValue("ends_at", "");
                          }
                        },
                      })}
                    />
                  </Field>
                )}
                <Field
                  label="Ends"
                  hint={values.ends_at ? `Until ${endOfDayUtcLabel(values.ends_at)}` : "End of that day, UTC"}
                  error={errors.ends_at?.message}
                >
                  <Input id="mp-ends" type="date" className="shadow-none" min={minEnd} max={maxEnd} {...register("ends_at")} />
                </Field>
                <Field label="Grace days" hint={`Default ${plan?.grace_days ?? 7}`} error={errors.grace_days?.message}>
                  <Input id="mp-grace" className="shadow-none" inputMode="numeric" placeholder="7" {...register("grace_days")} />
                </Field>
              </div>
            )}

            <Section title="What the customer pays" hint="Record only. Nothing here charges anyone.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Price" error={errors.price_amount?.message}>
                  <Input id="mp-price" className="shadow-none" inputMode="decimal" placeholder="1200.00" {...register("price_amount")} />
                </Field>
                <Field label="Currency" error={errors.currency?.message}>
                  <Input id="mp-currency" list="mp-currencies" maxLength={3} placeholder="GBP" className="uppercase shadow-none" {...register("currency")} />
                  <datalist id="mp-currencies">
                    {COMMON_CURRENCIES.map((code) => <option key={code} value={code} />)}
                  </datalist>
                </Field>
                <Field label="Billing cadence" error={errors.billing_cadence?.message}>
                  <Select
                    value={values.billing_cadence || "none"}
                    onValueChange={(v) => setValue("billing_cadence", v === "none" ? "" : v)}
                  >
                    <SelectTrigger id="mp-cadence" className="w-full shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      {(Object.keys(CADENCE_LABEL) as ManualPlanCadence[]).map((c) => (
                        <SelectItem key={c} value={c}>{CADENCE_LABEL[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Invoice reference" error={errors.invoice_reference?.message}>
                  <Input id="mp-invoice" className="shadow-none" {...register("invoice_reference")} />
                </Field>
                <Field label="Contract link" hint="Must start with https://" error={errors.contract_url?.message}>
                  <Input id="mp-contract" type="url" className="shadow-none" placeholder="https://" {...register("contract_url")} />
                </Field>
              </div>
              <Field label="Internal notes" hint="Never shown to the customer" error={errors.notes?.message}>
                <Textarea id="mp-notes" rows={3} className="shadow-none" {...register("notes")} />
              </Field>
            </Section>

            <Section title="Custom limits" hint="Applied on top of the tier while this plan runs. Leave unticked to use the tier limits.">
              <div className="grid gap-3 sm:grid-cols-2">
                {OVERRIDE_FIELDS.map((field) => {
                  const entry = draft[field.key];
                  return (
                    <div key={field.key} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <Checkbox
                        id={`ov-${field.key}`}
                        checked={entry.enabled}
                        onCheckedChange={(checked) =>
                          setDraft((d) => ({ ...d, [field.key]: { ...d[field.key], enabled: checked === true } }))
                        }
                      />
                      <Label htmlFor={`ov-${field.key}`} className="flex-1 text-sm font-normal">{field.label}</Label>
                      {field.kind === "int" && entry.enabled && !entry.unlimited && (
                        <Input
                          aria-label={`${field.label} limit`}
                          className="h-8 w-20 shadow-none"
                          inputMode="numeric"
                          placeholder={field.cap ? `max ${field.cap}` : ""}
                          value={entry.value}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [field.key]: { ...d[field.key], value: e.target.value } }))
                          }
                        />
                      )}
                      {field.kind === "int" && field.unlimitedOk && entry.enabled && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Checkbox
                            checked={entry.unlimited}
                            onCheckedChange={(checked) =>
                              setDraft((d) => ({ ...d, [field.key]: { ...d[field.key], unlimited: checked === true } }))
                            }
                          />
                          Unlimited
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
              {extraError && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{extraError}</p>
              )}
            </Section>

            <Section title="Confirm this change">
              <Field label="Reason" hint="Kept in the audit trail. Up to 500 characters." error={errors.reason?.message}>
                <Textarea
                  id="mp-reason"
                  rows={3}
                  maxLength={500}
                  className="shadow-none"
                  placeholder="e.g. Migrated from offline billing"
                  {...register("reason")}
                />
              </Field>
              {needsPassword && (
                <Field label="Your password" hint="Confirms this change is really you." error={errors.password?.message}>
                  <Input id="mp-password" type="password" className="shadow-none" autoComplete="current-password" {...register("password")} />
                </Field>
              )}
            </Section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{copy.submit}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t pt-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900 break-words">{children}</dd>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
