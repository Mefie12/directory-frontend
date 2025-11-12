

import { notFound } from "next/navigation";
import CategoryPageContent from "../category-page-content";
import { categories } from "@/lib/data";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

export default async function CategorySlugPage({ params }: PageProps) {
  const { categorySlug } = await params;

  // Get category data
  const category = categories.find((c) => c.slug === categorySlug);

  // If category doesn't exist, show 404
  if (!category) {
    notFound();
  }

  return <CategoryPageContent />;
}
