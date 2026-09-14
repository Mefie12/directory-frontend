"use client";

import { useEffect, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

/**
 * Dot indicator for a natively scrolling row, styled like `CarouselDots`.
 * One dot per screenful; clicking a dot scrolls there, which also gives mouse
 * users a way through when the scrollbar is hidden. Renders nothing when the
 * row doesn't overflow.
 */
export function ScrollDots({
  targetRef,
  className,
}: {
  targetRef: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const [pages, setPages] = useState(1);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      // A couple of pixels of sub-pixel overflow isn't worth a second dot.
      const count =
        maxScroll > 2 ? Math.ceil(el.scrollWidth / el.clientWidth) : 1;
      setPages(count);
      setActive(
        count > 1 ? Math.round((el.scrollLeft / maxScroll) * (count - 1)) : 0,
      );
    };

    const frame = requestAnimationFrame(update);
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [targetRef]);

  if (pages <= 1) return null;

  const goTo = (index: number) => {
    const el = targetRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollTo({
      left: ((el.scrollWidth - el.clientWidth) * index) / (pages - 1),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <div
      className={cn("flex justify-center items-center gap-1.5 mt-3", className)}
    >
      {Array.from({ length: pages }).map((_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Go to page ${index + 1} of ${pages}`}
          aria-current={index === active ? "true" : undefined}
          onClick={() => goTo(index)}
          className={cn(
            "h-2 rounded-full transition-all duration-300 cursor-pointer",
            index === active
              ? "w-4 bg-[#93C01F]"
              : "w-2 bg-gray-300 hover:bg-gray-400",
          )}
        />
      ))}
    </div>
  );
}
