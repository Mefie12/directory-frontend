"use client";

import Image from "next/image";
import { useState, useRef, useMemo, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CategoryDetailMedia } from "@/lib/data";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function MediaGallery({
  items,
  providerName,
}: {
  items: CategoryDetailMedia[];
  providerName: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [internalPage, setInternalPage] = useState(1);

  const openAt = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const pageSize = 6;

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const start = (internalPage - 1) * pageSize;
  const view = items.slice(start, start + pageSize);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {view.map((media, index) => (
          <GalleryThumb
            key={index}
            media={media}
            alt={`${providerName} gallery ${start + index + 1}`}
            onClick={() => openAt(index)}
          />
        ))}
      </div>

      {items.length > pageSize && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInternalPage(internalPage - 1)}
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setInternalPage(i + 1)}
              className={`h-8 w-8 rounded-full text-sm ${
                internalPage === i + 1
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInternalPage(internalPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Lightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        items={items}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}

function GalleryThumb({
  media,
  alt,
  onClick,
}: {
  media: CategoryDetailMedia;
  alt: string;
  onClick: () => void;
}) {
  const isVideo = typeof media !== "string" && media.type === "video";
  const src = typeof media === "string" ? media : media.src;
  const poster = typeof media === "string" ? undefined : media.poster;
  const vidRef = useRef<HTMLVideoElement | null>(null);

  return (
    <button
      onClick={onClick}
      className="group relative h-28 overflow-hidden rounded-2xl md:h-40"
    >
      {isVideo ? (
        <video
          ref={vidRef}
          src={src}
          poster={poster}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
          onMouseEnter={() => {
            const v = vidRef.current;
            if (!v) return;
            v.currentTime = 0;
            v.play().catch(() => {});
          }}
          onMouseLeave={() => {
            const v = vidRef.current;
            if (!v) return;
            v.pause();
            v.currentTime = 0;
          }}
        />
      ) : (
        <Image src={src} alt={alt} fill className="object-cover" />
      )}
      {isVideo && (
        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          Preview
        </span>
      )}
    </button>
  );
}

function Lightbox({
  open,
  onOpenChange,
  items,
  initialIndex = 0,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: CategoryDetailMedia[];
  initialIndex?: number;
}) {
  const normalized = useMemo(
    () =>
      items.map((m) =>
        typeof m === "string" ? { type: "image" as const, src: m } : m
      ),
    [items]
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    startIndex: initialIndex,
  });
  const [selected, setSelected] = useState(initialIndex);
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.scrollTo(initialIndex, true);
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, initialIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowRight") emblaApi?.scrollNext();
      if (e.key === "ArrowLeft") emblaApi?.scrollPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, emblaApi]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0" showCloseButton>
        <div className="relative" ref={emblaRef}>
          <div className="flex">
            {normalized.map((item, i) => (
              <div
                key={i}
                className="relative min-w-0 flex-[0_0_100%] bg-black"
              >
                {item.type === "video" ? (
                  <video
                    src={item.src}
                    poster={item.poster}
                    controls
                    className="h-[70vh] w-full object-contain"
                  />
                ) : (
                  <div className="relative h-[70vh] w-full">
                    <Image
                      src={item.src}
                      alt="Gallery"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white"
            onClick={() => emblaApi?.scrollPrev()}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white"
            onClick={() => emblaApi?.scrollNext()}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {normalized.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === selected ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
