import UniversalSlugPage from "@/components/universal-slug-page";

export default function CategorySlugPage({
  params,
}: {
  params: Promise<{ categorySlug: string; slug: string }>;
}) {
  return <UniversalSlugPage params={params} type="business" />;
}
