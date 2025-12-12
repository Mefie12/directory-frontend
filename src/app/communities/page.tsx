import NavigationTab from "@/components/navigation-tab";
import CommunityContent from "./community-content";
import { communityCategories } from "@/lib/data";

export default async function CommunityPage() {
  return (
    <div className="overflow-x-hidden pt-20 bg-gray-50">
      <div className="w-full">
        {/* Main Navigation Tabs */}
        <NavigationTab />

        {/* Category Tabs & Content */}
        <CommunityContent
          categories={communityCategories}
          // communities={communityCards}
        />
      </div>
    </div>
  );
}