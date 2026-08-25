export type BusinessHoursMode = "scheduled" | "always_open" | "appointment_only" | "contact_for_hours" | null | undefined;

export interface BusinessOpeningHour {
  day_of_week: string;
  open_time: string;
  close_time: string;
}

export type BusinessAvailabilityTone = "open" | "closed" | "appointment" | "neutral";

export interface BusinessAvailability {
  tone: BusinessAvailabilityTone;
  label: string;
  detail?: string;
  today: string | null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function minutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
}

function formatTime(total: number): string {
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function localClock(now: Date, timezone: string): { day: number; minute: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
    const day = DAYS.indexOf(value("weekday") as (typeof DAYS)[number]);
    const hour = Number(value("hour"));
    const minute = Number(value("minute"));
    if (day < 0 || !Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return { day, minute: hour * 60 + minute };
  } catch {
    return null;
  }
}

export function getBusinessAvailability(
  mode: BusinessHoursMode,
  hours: BusinessOpeningHour[],
  timezone: string | null | undefined,
  now = new Date(),
): BusinessAvailability | null {
  if (mode === "always_open") return { tone: "open", label: "Open 24 hours", today: null };
  if (mode === "appointment_only") return { tone: "appointment", label: "By appointment", today: null };
  if (mode === "contact_for_hours") return { tone: "neutral", label: "Contact for hours", today: null };
  if (mode !== "scheduled" || !timezone || hours.length === 0) {
    return null;
  }

  const clock = localClock(now, timezone);
  if (!clock) return null;
  const byDay = new Map(hours.map((hour) => [hour.day_of_week, hour]));
  const interval = (day: number) => {
    const hour = byDay.get(DAYS[day]);
    if (!hour) return null;
    const open = minutes(hour.open_time);
    const close = minutes(hour.close_time);
    return open === null || close === null ? null : { open, close };
  };

  const previous = interval((clock.day + 6) % 7);
  if (previous && previous.close <= previous.open && clock.minute < previous.close) {
    return { tone: "open", label: "Open", detail: `Closes at ${formatTime(previous.close)}`, today: DAYS[clock.day] };
  }

  const today = interval(clock.day);
  if (today) {
    const isOpen = today.close > today.open
      ? clock.minute >= today.open && clock.minute < today.close
      : clock.minute >= today.open;
    if (isOpen) {
      return { tone: "open", label: "Open", detail: `Closes at ${formatTime(today.close)}`, today: DAYS[clock.day] };
    }
  }

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = interval((clock.day + offset) % 7);
    if (!candidate || (offset === 0 && candidate.open <= clock.minute)) continue;
    const when = offset === 0 ? "today" : offset === 1 ? "tomorrow" : DAYS[(clock.day + offset) % 7];
    return { tone: "closed", label: "Closed", detail: `Opens ${when} at ${formatTime(candidate.open)}`, today: DAYS[clock.day] };
  }

  return { tone: "closed", label: "Closed", today: DAYS[clock.day] };
}
