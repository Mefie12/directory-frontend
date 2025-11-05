import HomeContent from "@/components/landing-page/home-content";
// TODO: Uncomment when API is ready
// import { fetchBusinesses, fetchEvents } from "@/lib/api";
// import type { Business, Event } from "@/lib/api";
import { featuredBusinesses, Events } from "@/lib/data";

export default async function Home() {
  // TODO: Uncomment when API is ready
  // let businesses = [];
  // let upcomingEvents = [];

  // try {
  //   const [businessData, eventsData] = await Promise.all([
  //     fetchBusinesses({ limit: 8 }),
  //     fetchEvents({ limit: 6 }),
  //   ]);

  //   businesses = businessData.data;
  //   upcomingEvents = eventsData.data;
  // } catch (error) {
  //   console.error("Error fetching home page data:", error);
  //   // Continue with empty arrays if API fails
  // }

  // Temporary: Using data.ts until API is ready
  const businesses = featuredBusinesses.slice(0, 8);
  const upcomingEvents = Events.slice(0, 6);

  return (
    <HomeContent
      featuredBusinesses={businesses}
      upcomingEvents={upcomingEvents}
    />
  );
}
