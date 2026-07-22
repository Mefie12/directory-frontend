"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Desktop, DeviceMobile, ArrowSquareOut } from "@phosphor-icons/react";
import type { ListingType } from "@/lib/listing-form-v2";

const SECTION_PATH: Record<ListingType, string> = {
  business: "/businesses",
  event: "/events",
  community: "/communities",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingSlug: string;
  listingType: ListingType;
}

export function ListingPreviewDialog({ open, onOpenChange, listingSlug, listingType }: Props) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const previewUrl = `${SECTION_PATH[listingType]}/${listingSlug}?preview=1`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-dvh w-screen max-w-screen flex-col gap-0 rounded-none border-0 p-0 sm:max-w-screen"
      >
        <DialogTitle className="sr-only">Previewing as a visitor</DialogTitle>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Previewing as a visitor</span>
            <span className="hidden text-xs text-gray-400 sm:inline">This is exactly what people will see once your listing is approved.</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setDeviceMode("desktop")}
                aria-pressed={deviceMode === "desktop"}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  deviceMode === "desktop" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700",
                )}
              >
                <Desktop className="h-4 w-4" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode("mobile")}
                aria-pressed={deviceMode === "mobile"}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  deviceMode === "mobile" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700",
                )}
              >
                <DeviceMobile className="h-4 w-4" /> Mobile
              </button>
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link href={previewUrl} target="_blank" rel="noreferrer">
                <ArrowSquareOut className="h-4 w-4" /> Open in new tab
              </Link>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-0 sm:p-6">
          <iframe
            key={deviceMode}
            src={previewUrl}
            title="Listing preview"
            className={cn(
              "h-full bg-white transition-all",
              deviceMode === "mobile"
                ? "mx-auto w-[390px] rounded-4xl border-8 border-gray-900 shadow-2xl"
                : "w-full rounded-xl border shadow-sm",
            )}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
