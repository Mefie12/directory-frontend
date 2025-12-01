import UniversalSlugPage from "@/components/universal-slug-page"; // Adjust path

export default function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  return <UniversalSlugPage params={params} type="event" />;
}