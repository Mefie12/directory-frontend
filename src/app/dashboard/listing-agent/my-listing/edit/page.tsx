import { ListingProvider } from "@/context/listing-form-context";
import EditListingContent from "./edit-listing-content";
import { Suspense } from "react";

export default function NewListing() {
  return (
    <ListingProvider>
      <Suspense>
        <EditListingContent />
      </Suspense>
    </ListingProvider>
  );
}
