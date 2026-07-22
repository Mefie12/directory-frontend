// Shared event date/time formatting for event-local display (PRD:
// md files/v1-eventtimezone-handling.md, §10.1/§10.4/§10.5). Viewer-local
// conversion is out of scope for this pass — every formatter here shows the
// event's OWN local time, labeled with its timezone.

/**
 * Parse a date-only string ("2026-09-20") as local calendar components,
 * never through `new Date(string)`'s implicit UTC-midnight inference —
 * which silently shifts the displayed date by a day for any viewer west
 * of UTC. Falls back to native parsing for strings that include a time.
 */
export function parseLocalDate(dateString?: string | null): Date | null {
  if (!dateString) return null;
  const datePart = dateString.split("T")[0].split(" ")[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const fallback = new Date(dateString);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function format12Hour(time?: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
}

export function formatEventDate(dateString?: string | null): string {
  const date = parseLocalDate(dateString);
  if (!date) return "";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function formatShortDate(dateString?: string | null): string {
  const date = parseLocalDate(dateString);
  if (!date) return "TBA";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatWeekdayShort(dateString?: string | null): string {
  const date = parseLocalDate(dateString);
  if (!date) return "";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export interface EventDateRangeInput {
  startDate?: string | null;
  endDate?: string | null;
  spansMultipleDays?: boolean;
}

/** Date row text — e.g. "Sun, Sep 20, 2026" or "Sun, Sep 20 – Mon, Sep 21, 2026". */
export function formatEventDateRange({ startDate, endDate, spansMultipleDays }: EventDateRangeInput): string {
  if (!startDate) return "";
  const spans = spansMultipleDays ?? (!!endDate && startDate !== endDate);
  if (!spans) return formatEventDate(startDate);
  return `${formatEventDate(startDate)} – ${formatEventDate(endDate)}`;
}

export interface EventTimeRangeInput extends EventDateRangeInput {
  startTime?: string | null;
  endTime?: string | null;
  timezoneLabel?: string | null;
}

/**
 * Time row text. When the range crosses into another calendar day, each
 * time is prefixed with its own weekday so the range is never ambiguous
 * (PRD §10.4 — never show a bare "11:00 PM–2:00 AM" across midnight).
 * Always appends the event's own timezone label when available.
 */
export function formatEventTimeRange({ startDate, endDate, startTime, endTime, spansMultipleDays, timezoneLabel }: EventTimeRangeInput): string {
  if (!startTime) return "";
  const tzSuffix = timezoneLabel ? ` ${timezoneLabel}` : "";
  const startLabel = format12Hour(startTime);
  if (!endTime) return `${startLabel}${tzSuffix}`;

  const endLabel = format12Hour(endTime);
  const spans = spansMultipleDays ?? (!!startDate && !!endDate && startDate !== endDate);
  if (spans) {
    return `${formatWeekdayShort(startDate)} ${startLabel} – ${formatWeekdayShort(endDate)} ${endLabel}${tzSuffix}`;
  }
  return `${startLabel} – ${endLabel}${tzSuffix}`;
}

/** Compact event-card line — e.g. "20 Sep · 7:00 PM Toronto time". */
export function formatEventCardLine(startDate?: string | null, startTime?: string | null, timezoneLabel?: string | null): string {
  const date = parseLocalDate(startDate);
  const datePart = date ? date.toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "";
  const timePart = format12Hour(startTime);
  const tzSuffix = timezoneLabel ? ` ${timezoneLabel}` : "";
  if (datePart && timePart) return `${datePart} · ${timePart}${tzSuffix}`;
  return datePart || `${timePart}${tzSuffix}`;
}
