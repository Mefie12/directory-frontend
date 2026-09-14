"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { CountryFallbackContext } from "@/lib/directory/types";

interface CountryFallbackNoticeProps extends CountryFallbackContext {
  surface: string;
  className?: string;
  announceWithToast?: boolean;
}

function toastSegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function CountryFallbackNotice({
  applied,
  sourceCountry,
  fallbackCountry,
  surface,
  className = "",
  announceWithToast = true,
}: CountryFallbackNoticeProps) {
  const announcedFallbacks = useRef(new Set<string>());
  const source = sourceCountry?.trim() || null;
  const fallback = fallbackCountry?.trim() || null;
  const countriesDiffer =
    !!fallback && (!source || source.toLowerCase() !== fallback.toLowerCase());
  const visible = applied && countriesDiffer;

  useEffect(() => {
    if (!visible || !source || !fallback || !announceWithToast) return;

    const toastId = `country-fallback:${toastSegment(source)}:${toastSegment(fallback)}:${toastSegment(surface)}`;
    if (announcedFallbacks.current.has(toastId)) return;
    announcedFallbacks.current.add(toastId);

    toast.info(`We don’t have listings in ${source} yet.`, {
      id: toastId,
      description: `Exploring ${fallback} instead.`,
      duration: 5500,
      className:
        "!border-[#b8d96b] !bg-[#f7fbe9] !text-[#152d42] !shadow-[0_12px_32px_rgba(21,45,66,0.16)]",
      classNames: {
        title: "!text-sm !font-semibold !leading-5 !text-[#152d42]",
        description:
          "!mt-0.5 !text-sm !font-medium !leading-5 !text-[#334155] !opacity-100",
        icon: "!text-[#52720f]",
        closeButton:
          "!border-[#b8d96b] !bg-white !text-[#152d42] hover:!bg-[#edf6d4]",
      },
    });
  }, [announceWithToast, fallback, source, surface, visible]);

  if (!visible || !fallback) return null;

  return (
    <section
      className={`border-l-2 border-[#9ACC23] pl-4 ${className}`.trim()}
      aria-labelledby={`fallback-heading-${toastSegment(surface)}`}
    >
      <h2
        id={`fallback-heading-${toastSegment(surface)}`}
        className="text-lg font-semibold text-gray-900 sm:text-xl"
      >
        Popular in {fallback}
      </h2>
      {source && (
        <p className="mt-1 text-sm text-gray-600">
          While we grow our {source} directory.
        </p>
      )}
    </section>
  );
}
