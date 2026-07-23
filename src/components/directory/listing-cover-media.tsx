"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE = "/images/no-image.jpg";
const UNCROPPED_CARDS_ENABLED =
  process.env.NEXT_PUBLIC_UNCROPPED_LISTING_CARDS === "true";

interface ListingCoverMediaProps {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * Fixed-slot listing cover. When the rollout flag is enabled the complete
 * foreground image is always visible; a decorative blurred duplicate fills
 * unused space without changing the foreground composition.
 */
export function ListingCoverMedia({
  src,
  alt,
  sizes,
  className,
  priority = false,
}: ListingCoverMediaProps) {
  const initialSrc = src || FALLBACK_IMAGE;
  const [imageSrc, setImageSrc] = useState(initialSrc);

  useEffect(() => {
    setImageSrc(initialSrc);
  }, [initialSrc]);

  const onError = () => {
    if (imageSrc !== FALLBACK_IMAGE) {
      setImageSrc(FALLBACK_IMAGE);
    }
  };

  if (!UNCROPPED_CARDS_ENABLED) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          "object-cover transition-transform duration-300 group-hover:scale-105",
          className,
        )}
        onError={onError}
      />
    );
  }

  return (
    <>
      <Image
        src={imageSrc}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        className="pointer-events-none scale-110 object-cover blur-xl brightness-75"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black/10"
      />
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("relative z-[1] object-contain", className)}
        onError={onError}
      />
    </>
  );
}
