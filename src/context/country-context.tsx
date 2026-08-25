"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const COUNTRY_CHANGE_EVENT = "mefie:country-change";

interface CountryValue { code: string; name: string }
interface CountryContextValue {
  masterCountry: CountryValue | null;
  effectiveCountry: string | null;
  source: "local" | "master" | "geo" | "fallback" | "global";
  loading: boolean;
  setMasterCountry: (countryCode: string) => Promise<void>;
  clearMasterCountry: () => Promise<void>;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [masterCountry, setMaster] = useState<CountryValue | null>(null);
  const [effectiveCountry, setEffective] = useState<string | null>(null);
  const [source, setSource] = useState<CountryContextValue["source"]>("fallback");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/country-context", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load country preference");
    const json = (await response.json()) as {
      master_country: CountryValue | null;
      effective_country: string | null;
      country_source: CountryContextValue["source"];
    };
    setMaster(json.master_country);
    setEffective(json.effective_country);
    setSource(json.country_source);
  }, []);

  useEffect(() => {
    // Initial hydration synchronizes with the server-owned session cookie.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch(() => undefined).finally(() => setLoading(false));
  }, [refresh]);

  const setMasterCountry = useCallback(async (countryCode: string) => {
    const response = await fetch("/api/country-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country_code: countryCode }),
    });
    if (!response.ok) throw new Error("Could not save country preference");
    await refresh();
    window.dispatchEvent(new Event(COUNTRY_CHANGE_EVENT));
  }, [refresh]);

  const clearMasterCountry = useCallback(async () => {
    const response = await fetch("/api/country-context", { method: "DELETE" });
    if (!response.ok) throw new Error("Could not clear country preference");
    await refresh();
    window.dispatchEvent(new Event(COUNTRY_CHANGE_EVENT));
  }, [refresh]);

  const value = useMemo(() => ({
    masterCountry, effectiveCountry, source, loading, setMasterCountry, clearMasterCountry,
  }), [masterCountry, effectiveCountry, source, loading, setMasterCountry, clearMasterCountry]);

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountryContext(): CountryContextValue {
  const context = useContext(CountryContext);
  if (!context) throw new Error("useCountryContext must be used within CountryProvider");
  return context;
}
