import type { SearchableSelectOption } from "@/components/ui/searchable-select";

const FALLBACK_TIMEZONES = [
  "Africa/Accra", "Africa/Lagos", "Africa/Nairobi", "Africa/Johannesburg", "Europe/London",
  "Europe/Paris", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "Asia/Dubai", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
];

export function detectedTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Accra";
}

export function timezoneOptions(current = ""): SearchableSelectOption[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
  const values = [...(intl.supportedValuesOf?.("timeZone") ?? FALLBACK_TIMEZONES)];
  if (current && !values.includes(current)) values.unshift(current);
  return values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
}
