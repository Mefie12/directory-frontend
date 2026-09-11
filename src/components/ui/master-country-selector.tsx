"use client";

import { useEffect, useMemo, useState } from "react";
import { countries } from "country-data-list";
import { toast } from "sonner";
import { Country, CountryDropdown } from "@/components/ui/country-dropdown";
import { useCountryContext } from "@/context/country-context";

/*
  Flag-only trigger used in the navbar on desktop and mobile.

  Ghost styling so the country setting stays quieter than Login beside it: no
  border or fill at rest, with the fill appearing on hover and staying while the
  menu is open. `rounded-lg` and `h-10` match the navbar buttons (Sign Up,
  Become a vendor) and the 40px mobile menu button, and the chevron flips while
  the list is open. The focus ring only shows for keyboard focus, so it doesn't
  linger after a mouse click.
*/
const COMPACT_TRIGGER =
  "h-10 w-16 rounded-lg border-transparent bg-transparent px-2.5 text-white/70 shadow-none transition-colors " +
  "hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white " +
  "focus:ring-0 focus-visible:ring-2 focus-visible:ring-white/40 " +
  "[&>svg]:transition-transform [&[data-state=open]>svg]:rotate-180";

export function MasterCountrySelector({ compact = false }: { compact?: boolean }) {
  const { masterCountry, effectiveCountry, loading, setMasterCountry } = useCountryContext();
  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/countries_dropdown", { headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((json: { data?: unknown[] }) => {
        setAvailableNames(
          (json.data ?? []).filter((value): value is string => typeof value === "string"),
        );
      })
      .catch(() => setAvailableNames([]));
  }, []);

  const options = useMemo(() => {
    const names = new Set(availableNames.map((name) => name.toLowerCase()));
    return (countries.all as Country[]).filter(
      (country) =>
        names.has(country.name.toLowerCase()) &&
        country.emoji &&
        country.status !== "deleted" &&
        country.ioc !== "PRK",
    );
  }, [availableNames]);

  const handleChange = async (country: Country) => {
    try {
      setSaving(true);
      await setMasterCountry(country.alpha2);
      toast.success(`Default country set to ${country.name}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update your country. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? "w-16 shrink-0" : "w-[150px]"}>
      <CountryDropdown
        options={options}
        defaultValue={masterCountry?.name || effectiveCountry || undefined}
        onChange={handleChange}
        disabled={loading || saving || options.length === 0}
        placeholder="Country"
        slim={compact}
        triggerLabel={`Default country: ${masterCountry?.name || effectiveCountry || "not selected"}. Change country`}
        contentClassName={compact ? "w-[min(20rem,calc(100vw-2rem))]" : undefined}
        className={compact
          ? COMPACT_TRIGGER
          : "border-white/25 bg-white/10 text-white shadow-none"}
      />
    </div>
  );
}
