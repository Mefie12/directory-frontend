"use client";

import { useRouter } from "next/navigation";
import CommunityCarousel from "@/components/communities/community-carousel";
import CommunityCard from "@/components/communities/community-card";
import { CtaBanner } from "@/components/ux/cta-banner";
import { DirectoryPageShell } from "@/components/directory/directory-page-shell";
import { useDirectoryListings } from "@/lib/directory/use-directory-listings";
import { mapCommunity, ProcessedCommunity } from "./map-community";

export default function CommunityContent() {
  const router = useRouter();

  const { items, isLoading, detectedCountry, fallbackContext } =
    useDirectoryListings<ProcessedCommunity>({
      endpoint: "/api/communities",
      mapItem: mapCommunity,
      forwardParams: ["category_id", "category_slug", "country"],
    });

  const handleCtaClick = () => {
    router.push("/claim");
  };

  return (
    <DirectoryPageShell<ProcessedCommunity>
      mainCategorySlug="communities"
      context="communities"
      items={items}
      isLoading={isLoading}
      detectedCountry={detectedCountry}
      fallbackContext={fallbackContext}
      mapItem={mapCommunity}
      groupBy={(c) => c.tag}
      matchesCategory={(c, slug) => c.categorySlug === slug}
      heroSize={9}
      visibleGroups={0}
      emptyMessage="No communities found in this category."
      gridTitle="All communities"
      renderHero={(heroItems) => (
        <CommunityCarousel communities={heroItems} title="Community Impact" />
      )}
      renderGroup={(name, groupItems) => (
        <CommunityCarousel communities={groupItems} title={name} />
      )}
      renderFiltered={(filtered) => (
        <CommunityCarousel
          communities={filtered}
          title={`${filtered[0]?.category ?? "Filtered"} Communities`}
        />
      )}
      renderCard={(c) => (
        <CommunityCard
          community={{
            id: c.id,
            name: c.name,
            slug: c.slug,
            tag: c.tag,
            image: c.image,
            imageUrl: c.imageUrl,
            description: c.description,
            location: c.location,
            verified: c.verified,
            type: "community",
          }}
        />
      )}
      renderFooterCta={() => (
        <CtaBanner
          title="Ready to Grow Your Business?"
          actionLabel="List your business today"
          onAction={handleCtaClick}
        />
      )}
    />
  );
}
