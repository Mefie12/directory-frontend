import { Suspense } from "react";
import { ListingProvider } from "@/context/listing-form-context";
import ListingContent from "@/components/dashboard/listing/listing-content";

/** The create wizard inside an organization; ?organization= preselects it. */
export default function OrganizationNewListingPage() {
  return (
    <ListingProvider>
      <Suspense>
        <ListingContent />
      </Suspense>
    </ListingProvider>
  );
}
