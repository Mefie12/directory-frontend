import { Suspense } from "react";
import { ListingProvider } from "@/context/listing-form-context";
import EditListingContent from "@/components/dashboard/listing/edit-listing-content";

export default function OrganizationEditListingPage() {
  return (
    <ListingProvider>
      <Suspense>
        <EditListingContent />
      </Suspense>
    </ListingProvider>
  );
}
