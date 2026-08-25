"use client";

import { useEffect, useMemo, useState } from "react";
import { countries } from "country-data-list";
import { toast } from "sonner";
import { Country, CountryDropdown } from "@/components/ui/country-dropdown";
import { useCountryContext } from "@/context/country-context";

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
    } catch {
      toast.error("Could not update your country. Please try again.");
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
          ? "w-16 border-white/30 bg-white/10 text-white shadow-none"
          : "border-white/25 bg-white/10 text-white shadow-none"}
      />
    </div>
  );
}
