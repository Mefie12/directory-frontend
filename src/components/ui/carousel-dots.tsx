"use client";

import { useCallback, useEffect, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";
import { cn } from "@/lib/utils";

interface CarouselDotsProps {
  api: EmblaCarouselType | undefined;
  className?: string;
}

export function CarouselDots({ api, className }: CarouselDotsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const onInit = useCallback((embla: EmblaCarouselType) => {
    setSnapCount(embla.scrollSnapList().length);
  }, []);

  const onSelect = useCallback((embla: EmblaCarouselType) => {
    setSelectedIndex(embla.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onInit(api);
    onSelect(api);
    api.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
    return () => {
      api.off("reInit", onInit).off("reInit", onSelect).off("select", onSelect);
    };
  }, [api, onInit, onSelect]);

  if (snapCount <= 1) return null;

  return (
    <div className={cn("flex justify-center items-center gap-1.5 mt-3", className)}>
      {Array.from({ length: snapCount }).map((_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Go to slide ${index + 1}`}
          onClick={() => api?.scrollTo(index)}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            index === selectedIndex
              ? "w-4 bg-[#93C01F]"
              : "w-2 bg-gray-300 hover:bg-gray-400",
          )}
        />
      ))}
    </div>
  );
}
