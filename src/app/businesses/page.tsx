import NavigationTab from "@/components/navigation-tab";
// import { businessCategories } from "@/lib/data";
import BusinessesContent from "./businesses-content";

export default async function Businesses() {
  // Use categories from data.ts
  // const categories = businessCategories;
  // const businesses = featuredBusinesses;
  
  return (
    <div className="overflow-x-hidden pt-20 bg-gray-50">
      <div className="w-full">
        {/* Main Navigation Tabs */}
        <NavigationTab />
        
        {/* Category Tabs & Content */}
        <BusinessesContent 
        // categories={categories} />
        />
      </div>
    </div>
  );
} 
