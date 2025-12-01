import UniversalSlugPage from "@/components/universal-slug-page";

export default function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  return <UniversalSlugPage params={params} type="community" />;
}