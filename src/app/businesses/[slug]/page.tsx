import UniversalSlugPage from "@/components/universal-slug-page";

export default function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  return <UniversalSlugPage params={params} type="business" />;
}