import NavigationTab from "@/components/navigation-tab";
import EventsContent from "./events-content";
import { events as eventsCategories } from "@/lib/data";

export default async function EventsPage() {
  return (
    <div className="overflow-x-hidden pt-20 bg-gray-50">
      <div className="w-full">
        {/* Main Navigation Tabs */}
        <NavigationTab />

        {/* Category Tabs & Content */}
        <EventsContent categories={eventsCategories} />
      </div>
    </div>
  );
}
