import { ListingProvider } from "@/context/listing-form-context";
import EditListingContent from "@/components/dashboard/listing/edit-listing-content";
import { LegacyEditListingRoute } from "@/components/dashboard/listing/legacy-listing-routes";
import { Suspense } from "react";

export default function EditListing() {
  return (
    <LegacyEditListingRoute>
      <ListingProvider>
        <Suspense>
          <EditListingContent />
        </Suspense>
      </ListingProvider>
    </LegacyEditListingRoute>
  );
}
