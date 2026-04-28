"use client";

import { useSearchParams } from "next/navigation";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getToday(): { start: string; end: string } {
  const s = toDateStr(new Date());
  return { start: s, end: s };
}

function getThisWeekend(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  if (day === 0) {
    const s = toDateStr(now);
    return { start: s, end: s };
  }
  if (day === 6) {
    const sat = toDateStr(now);
    const sun = new Date(now);
    sun.setDate(now.getDate() + 1);
    return { start: sat, end: toDateStr(sun) };
  }
  const daysToSat = 6 - day;
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysToSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return { start: toDateStr(sat), end: toDateStr(sun) };
}

function getThisMonth(): { start: string; end: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toDateStr(first), end: toDateStr(last) };
}

const PRESETS = [
  { label: "Today", range: getToday },
  { label: "This Weekend", range: getThisWeekend },
  { label: "This Month", range: getThisMonth },
];

export default function EventDatePresets() {
  const searchParams = useSearchParams();
  const currentStart = searchParams.get("event_start_date");
  const currentEnd = searchParams.get("event_end_date");

  const applyOrClear = (start: string, end: string) => {
    const params = new URLSearchParams(window.location.search);
    if (currentStart === start && currentEnd === end) {
      params.delete("event_start_date");
      params.delete("event_end_date");
    } else {
      params.set("event_start_date", start);
      params.set("event_end_date", end);
    }
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map(({ label, range }) => {
        const { start, end } = range();
        const active = currentStart === start && currentEnd === end;
        return (
          <button
            key={label}
            onClick={() => applyOrClear(start, end)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              active
                ? "bg-[#0D7077] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#0D7077] hover:text-[#0D7077]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
