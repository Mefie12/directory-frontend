"use client";

import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLegacyListingRedirect } from "@/hooks/useLegacyListingRedirect";

function Spinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#93C01F]" />
    </div>
  );
}

/** Renders `children` unless the page is moving into an organization workspace. */
export function LegacyListingRoute({ subPath, children }: { subPath: string; children: ReactNode }) {
  const redirecting = useLegacyListingRedirect(subPath);
  return redirecting ? <Spinner /> : <>{children}</>;
}

function LegacyEditRouteInner({ children }: { children: ReactNode }) {
  const query = useSearchParams().toString();
  return <LegacyListingRoute subPath={`listings/edit${query ? `?${query}` : ""}`}>{children}</LegacyListingRoute>;
}

/** /dashboard/my-listing/edit?type=…&slug=… keeps its query string when it moves. */
export function LegacyEditListingRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <LegacyEditRouteInner>{children}</LegacyEditRouteInner>
    </Suspense>
  );
}
