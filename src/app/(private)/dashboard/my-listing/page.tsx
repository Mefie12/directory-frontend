import MyListingsPage from "@/components/dashboard/listing/my-listings-page";
import { LegacyListingRoute } from "@/components/dashboard/listing/legacy-listing-routes";

export default function MyListing() {
  return (
    <LegacyListingRoute subPath="listings">
      <MyListingsPage />
    </LegacyListingRoute>
  );
}
