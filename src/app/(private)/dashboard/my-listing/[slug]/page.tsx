import ListingDetailPage from "@/components/dashboard/listing/listing-detail-page";
import { LegacyListingRoute } from "@/components/dashboard/listing/legacy-listing-routes";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ListingDetailRoute({ params }: PageProps) {
  const { slug } = await params;
  return (
    <LegacyListingRoute subPath={`listings/${encodeURIComponent(slug)}`}>
      <ListingDetailPage params={params} />
    </LegacyListingRoute>
  );
}
