"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
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
import type { OrganizationMembership } from "@/types/organization";

/** Minimum an organization needs for the picker (memberships or eligible_organizations). */
type PickableOrganization = Pick<OrganizationMembership, "id" | "slug" | "name">;

export type OrganizationChoice =
  | { mode: "existing"; organizationId: number }
  | { mode: "new"; name: string; country: string };

const NEW_ORGANIZATION = "__new__";

interface Props {
  /** Organizations the user may choose (listing.create for listings, claim.submit for claims). */
  organizations: PickableOrganization[];
  value: OrganizationChoice | null;
  onChange: (choice: OrganizationChoice) => void;
  error?: string | null;
  /** Wording: "listing" (wizard) or "claim" (claim flow). */
  purpose?: "listing" | "claim";
}

/**
 * "Which organization is this for?" (V2 Phase 1 spec §9.7–§9.8). Zero
 * organizations: name + country for a new one. One: "Creating under <Org>"
 * with an option to change. Several: a picker plus "New organization".
 */
export function OrganizationChoicePicker({ organizations, value, onChange, error, purpose = "listing" }: Props) {
  const [changing, setChanging] = useState(false);
  const verb = purpose === "claim" ? "Claiming for" : "Creating under";

  const selected =
    value?.mode === "existing" ? organizations.find((org) => org.id === value.organizationId) ?? null : null;
  const showPicker = organizations.length > 1 || changing;

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-[#93C01F]" />
        <p className="text-sm font-semibold text-[#1F3A4C]">Organization</p>
      </div>

      {organizations.length === 1 && !changing && selected && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-gray-700">
            {verb} <span className="font-semibold text-[#1F3A4C]">{selected.name}</span>
          </p>
          <button type="button" className="text-[#93C01F] hover:underline" onClick={() => setChanging(true)}>
            Use a different organization
          </button>
        </div>
      )}

      {showPicker && organizations.length > 0 && (
        <div className="space-y-1.5">
          <Label>{purpose === "claim" ? "Claim this listing for" : "Create this listing under"}</Label>
          <Select
            value={value?.mode === "existing" ? String(value.organizationId) : value?.mode === "new" ? NEW_ORGANIZATION : ""}
            onValueChange={(next) =>
              next === NEW_ORGANIZATION
                ? onChange({ mode: "new", name: "", country: "" })
                : onChange({ mode: "existing", organizationId: Number(next) })
            }
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Choose an organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={String(org.id)}>
                  {org.name}
                </SelectItem>
              ))}
              <SelectItem value={NEW_ORGANIZATION}>+ New organization</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {value?.mode === "new" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {organizations.length === 0 && (
            <p className="text-sm text-gray-600 sm:col-span-2">
              {purpose === "claim"
                ? "Approved claims are added to an organization. It's only created if your claim is approved."
                : "Your listings belong to an organization. We'll create one for you with this listing."}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="new-org-name">Organization name</Label>
            <Input
              id="new-org-name"
              value={value.name}
              onChange={(event) => onChange({ ...value, name: event.target.value })}
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <CountryDropdown
              defaultValue={value.country}
              onChange={(country) => onChange({ ...value, country: country.name })}
              placeholder="Search for a country"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/** Client-side check before submitting (the backend validates again). */
export function organizationChoiceError(choice: OrganizationChoice | null): string | null {
  if (!choice) return "Choose an organization.";
  if (choice.mode === "new") {
    if (choice.name.trim().length < 2) return "Enter the organization's name (at least 2 characters).";
    if (!choice.country.trim()) return "Choose the organization's country.";
  }
  return null;
}
