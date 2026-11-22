"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrganizationApiError } from "@/lib/api";
import { ORG_ENTITY_KIND_LABEL, type OrgEntityKind } from "@/types/organization";

const ENTITY_KINDS = Object.keys(ORG_ENTITY_KIND_LABEL) as OrgEntityKind[];

const organizationSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(255, "Use 255 characters or fewer."),
  country: z.string().trim().min(1, "Choose the organization's country."),
  entity_kind: z.enum(ENTITY_KINDS as [OrgEntityKind, ...OrgEntityKind[]]).nullable(),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address.")]),
  primary_phone: z.string().trim().max(30, "Use 30 characters or fewer."),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

type FieldName = keyof OrganizationFormValues;

interface Props {
  initialValues?: Partial<OrganizationFormValues>;
  /** Show the contact fields (settings only). */
  showContact?: boolean;
  submitLabel: string;
  onSubmit: (values: OrganizationFormValues) => Promise<void>;
  onCancel?: () => void;
}

/**
 * Create / edit an organization profile (V2 Phase 1). Name and country are
 * required (owner decision Q5). Server validation errors are shown next to
 * the matching field.
 */
export function OrganizationForm({ initialValues, showContact = false, submitLabel, onSubmit, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    mode: "onBlur",
    defaultValues: {
      name: initialValues?.name ?? "",
      country: initialValues?.country ?? "",
      entity_kind: initialValues?.entity_kind ?? null,
      email: initialValues?.email ?? "",
      primary_phone: initialValues?.primary_phone ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof OrganizationApiError && error.status === 422) {
        let mapped = false;
        (Object.entries(error.fieldErrors) as [string, string[]][]).forEach(([field, messages]) => {
          if (field in organizationSchema.shape) {
            setError(field as FieldName, { message: messages[0] });
            mapped = true;
          }
        });
        if (!mapped) toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="org-name">Organization name</Label>
        <Input id="org-name" {...register("name")} aria-invalid={!!errors.name} className={errors.name ? "border-red-500" : ""} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Country</Label>
        <Controller
          control={control}
          name="country"
          render={({ field }) => (
            <CountryDropdown
              defaultValue={field.value}
              onChange={(country) => field.onChange(country.name)}
              placeholder="Search for a country"
              className={errors.country ? "border-red-500" : ""}
            />
          )}
        />
        {errors.country && <p className="text-sm text-red-600">{errors.country.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Type of organization <span className="font-normal text-gray-400">(optional)</span></Label>
        <Controller
          control={control}
          name="entity_kind"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={(value) => field.onChange(value === "" ? null : value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_KINDS.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {ORG_ENTITY_KIND_LABEL[kind]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {showContact && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="org-email">Contact email <span className="font-normal text-gray-400">(optional)</span></Label>
            <Input id="org-email" type="email" {...register("email")} aria-invalid={!!errors.email} className={errors.email ? "border-red-500" : ""} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-phone">Contact phone <span className="font-normal text-gray-400">(optional)</span></Label>
            <Input id="org-phone" {...register("primary_phone")} aria-invalid={!!errors.primary_phone} className={errors.primary_phone ? "border-red-500" : ""} />
            {errors.primary_phone && <p className="text-sm text-red-600">{errors.primary_phone.message}</p>}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="bg-[#93C01F] text-white hover:bg-[#82ab1b]">
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
