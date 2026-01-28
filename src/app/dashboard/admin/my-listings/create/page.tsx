import { ListingProvider } from "@/context/listing-form-context";
import ListingContent from "./new-listing-content";
import { Suspense } from "react";

export default function NewListing() {
  return (
    <ListingProvider>
      <Suspense>
        <ListingContent />
      </Suspense>
    </ListingProvider>
  );
}
