"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { toast } from "sonner";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeUrl, parseLaravel422Errors } from "@/lib/directory/utils";
import { validatePhoneInternational } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { handleSessionExpired } from "@/lib/session";

interface Props { listingSlug: string; }
type ContactField = "email" | "primary_phone" | "secondary_phone" | "website";
type ContactErrors = Partial<Record<ContactField, string>>;

export const PublicContactForm = forwardRef<ListingFormHandle, Props>(({ listingSlug }, ref) => {
  const [email, setEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [primaryCode, setPrimaryCode] = useState("+44");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [secondaryCode, setSecondaryCode] = useState("+44");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    fetch(`/api/listing/${listingSlug}/show`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const listing = payload?.data ?? payload;
        if (!listing) return;
        setEmail(listing.email ?? "");
        setPrimaryPhone(listing.primary_phone ?? "");
        setPrimaryCode(listing.primary_country_code ?? "+44");
        setSecondaryPhone(listing.secondary_phone ?? "");
        setSecondaryCode(listing.secondary_country_code ?? "+44");
        setWebsite(listing.website ?? "");
      })
      .finally(() => setLoading(false));
  }, [listingSlug]);

  const validate = (): ContactErrors => {
    const next: ContactErrors = {};
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid public email address.";
    if (primaryPhone && !validatePhoneInternational(primaryPhone)) next.primary_phone = "Enter a complete international phone number.";
    if (secondaryPhone && !validatePhoneInternational(secondaryPhone)) next.secondary_phone = "Enter a complete international phone number.";
    if (website && !normalizeUrl(website)) next.website = "Enter a valid website URL.";
    return next;
  };

  const save = async (): Promise<boolean> => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please correct the highlighted public contact fields.");
      return false;
    }

    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`/api/listing/${listingSlug}/update`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || null,
          primary_phone: primaryPhone || null,
          primary_country_code: primaryPhone ? primaryCode : null,
          secondary_phone: secondaryPhone || null,
          secondary_country_code: secondaryPhone ? secondaryCode : null,
          website: website.trim() ? normalizeUrl(website) : null,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (handleSessionExpired(response.status)) return false;
        if (response.status === 422 && result.errors) {
          const mapped = parseLaravel422Errors(result.errors);
          setErrors({
            email: mapped.email,
            primary_phone: mapped.primary_phone ?? mapped.primary_country_code,
            secondary_phone: mapped.secondary_phone ?? mapped.secondary_country_code,
            website: mapped.website,
          });
          toast.error("Please correct the highlighted public contact fields.");
        } else toast.error(result.message ?? "Could not save public contact details.");
        return false;
      }
      return true;
    } catch {
      toast.error("Could not connect to save public contact details. Your entries are still here.");
      return false;
    }
  };

  useImperativeHandle(ref, () => ({ submit: save }));

  if (loading) return <p className="text-sm text-muted-foreground">Loading public contact details…</p>;

  return <div className="space-y-5">
    <div><h2 className="text-xl font-semibold">Public contact</h2><p className="text-sm text-muted-foreground">Optional contact details shown on the Event page. Account contact information is never copied here.</p></div>
    <div className="grid gap-5 md:grid-cols-2">
      <ContactField label="Public email" error={errors.email}><Input type="email" value={email} aria-invalid={!!errors.email} className={cn(errors.email && "border-red-500")} onChange={(event) => { setEmail(event.target.value); if (errors.email) setErrors((current) => ({ ...current, email: undefined })); }} placeholder="events@example.com" /></ContactField>
      <ContactField label="Website" error={errors.website}><Input type="url" value={website} aria-invalid={!!errors.website} className={cn(errors.website && "border-red-500")} onChange={(event) => { setWebsite(event.target.value); if (errors.website) setErrors((current) => ({ ...current, website: undefined })); }} placeholder="https://…" /></ContactField>
      <ContactField label="Primary phone" error={errors.primary_phone}><PhoneInput defaultCountry="gb" preferredCountries={["gh", "gb", "us", "ng", "ca"]} value={primaryPhone} onChange={(phone, metadata) => { setPrimaryPhone(phone); setPrimaryCode(`+${metadata.country.dialCode}`); if (errors.primary_phone) setErrors((current) => ({ ...current, primary_phone: undefined })); }} inputClassName={cn("w-full", errors.primary_phone && "!border-red-500")} /></ContactField>
      <ContactField label="Secondary phone" error={errors.secondary_phone}><PhoneInput defaultCountry="gb" preferredCountries={["gh", "gb", "us", "ng", "ca"]} value={secondaryPhone} onChange={(phone, metadata) => { setSecondaryPhone(phone); setSecondaryCode(`+${metadata.country.dialCode}`); if (errors.secondary_phone) setErrors((current) => ({ ...current, secondary_phone: undefined })); }} inputClassName={cn("w-full", errors.secondary_phone && "!border-red-500")} /></ContactField>
    </div>
  </div>;
});

PublicContactForm.displayName = "PublicContactForm";

function ContactField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label} <span className="font-normal text-muted-foreground">(Optional)</span></Label>{children}{error && <p className="text-xs text-red-600" role="alert">{error}</p>}</div>;
}
