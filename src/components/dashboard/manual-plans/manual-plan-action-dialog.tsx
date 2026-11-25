"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ManualPlan, ManualPlanApiError, reviewManualPlan, revokeManualPlan } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
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
import { STATE_META, tierLabel } from "./manual-plan-utils";

type ActionMode = "revoke" | "review";

interface Props {
  mode: ActionMode;
  plan: ManualPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (plan: ManualPlan) => void;
}

const schema = z.object({
  decision: z.enum(["keep", "revoke"]),
  reason: z.string().trim().min(5, "Give a reason (at least 5 characters)").max(500, "At most 500 characters"),
  password: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function ManualPlanActionDialog({ mode, plan, open, onOpenChange, onDone }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { decision: mode === "revoke" ? "revoke" : "keep", reason: "", password: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ decision: mode === "revoke" ? "revoke" : "keep", reason: "", password: "" });
      setServerError(null);
    }
  }, [open, mode, reset]);

  const decision = watch("decision");
  const endsPlan = mode === "revoke" || decision === "revoke";
  const state = STATE_META[plan.state];

  const onSubmit = async (values: FormValues) => {
    if (endsPlan && values.password.trim() === "") {
      setError("password", { message: "Enter your password to confirm" });
      return;
    }

    const token = localStorage.getItem("authToken") ?? undefined;
    setSubmitting(true);
    setServerError(null);

    try {
      const saved =
        mode === "revoke"
          ? await revokeManualPlan(plan.id, { version: plan.version, reason: values.reason.trim(), password: values.password }, token)
          : await reviewManualPlan(
              plan.id,
              {
                version: plan.version,
                decision: values.decision,
                reason: values.reason.trim(),
                ...(values.decision === "revoke" ? { password: values.password } : {}),
              },
              token,
            );

      toast.success(mode === "revoke" || values.decision === "revoke" ? "Plan ended." : "Plan kept.");
      onDone(saved);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ManualPlanApiError) {
        const fieldErrors = error.fieldErrors;
        if (error.status === 422 && (fieldErrors.password || fieldErrors.reason)) {
          if (fieldErrors.password) setError("password", { message: fieldErrors.password[0] });
          if (fieldErrors.reason) setError("reason", { message: fieldErrors.reason[0] });
        } else {
          setServerError(error.message);
        }
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>{mode === "revoke" ? "End this plan now" : "Review ownership change"}</DialogTitle>
          <DialogDescription>
            {mode === "revoke"
              ? "Review this change before applying it."
              : "Decide whether the plan stays with the new owner."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2" noValidate>
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="font-medium text-slate-900">{plan.listing.name}</p>
            {plan.customer && <p className="text-sm text-slate-500">{plan.customer.email}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{tierLabel(plan.contracted_plan)}</Badge>
              <Badge variant="outline" className={state.className}>{state.label}</Badge>
              <span className="text-slate-500">ends {plan.ends_at_label}</span>
            </div>
          </div>

          {mode === "review" && plan.needs_review_reason && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {plan.needs_review_reason}. The plan keeps working until you decide.
            </p>
          )}

          {mode === "review" && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Decision</legend>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" value="keep" className="mt-1" {...register("decision")} />
                <span><span className="font-medium">Keep the plan.</span> <span className="text-slate-600">The new owner continues on it.</span></span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" value="revoke" className="mt-1" {...register("decision")} />
                <span><span className="font-medium">End the plan.</span> <span className="text-slate-600">The new owner is not the customer.</span></span>
              </label>
            </fieldset>
          )}

          {endsPlan && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              The listing drops to Basic immediately and the owner is emailed. Content is kept, and anything above
              the Basic limits is hidden. An ended plan can&apos;t be restarted; assign a new one instead.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="act-reason" className="text-sm font-semibold">Reason</Label>
            <Textarea id="act-reason" rows={3} maxLength={500} className="shadow-none" {...register("reason")} />
            <p className="text-xs text-slate-500">Kept in the audit trail. Up to 500 characters.</p>
            {errors.reason && <p className="text-xs text-red-600" role="alert">{errors.reason.message}</p>}
          </div>

          {endsPlan && (
            <div className="space-y-2">
              <Label htmlFor="act-password" className="text-sm font-semibold">Your password</Label>
              <Input id="act-password" type="password" className="shadow-none" autoComplete="current-password" {...register("password")} />
              <p className="text-xs text-slate-500">Confirms this change is really you.</p>
              {errors.password && <p className="text-xs text-red-600" role="alert">{errors.password.message}</p>}
            </div>
          )}

          {serverError && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant={endsPlan ? "destructive" : "default"} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {endsPlan ? "End plan" : "Keep plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
