import UniversalSlugPage from "@/components/universal-slug-page";

export default function DiscoverPage({ params }: { params: Promise<{ slug: string }> }) {
  // Assuming 'Discover' items are treated as businesses or have a similar layout
  return <UniversalSlugPage params={params} type="discover" />;
}