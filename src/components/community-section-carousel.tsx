// "use client";
// import { useCallback, useEffect, useState } from "react";
// import { ChevronRight, ChevronLeft } from "lucide-react";
// import useEmblaCarousel from "embla-carousel-react";
// import type { Community } from "@/lib/api";
// import { CommunityCard } from "./community-card";
// import { Button } from "./ui/button";

// interface CommunitySectionCarouselProps {
//   communities: Community[];
// }

// export default function CommunitySectionCarousel({
//   communities,
// }: CommunitySectionCarouselProps) {
//   const [emblaRef, emblaApi] = useEmblaCarousel({
//     align: "center",
//     loop: false,
//     skipSnaps: true,
//     dragFree: true,
//   });

//   const [canScrollPrev, setCanScrollPrev] = useState(false);
//   const [canScrollNext, setCanScrollNext] = useState(false);

//   const scrollPrev = useCallback(() => {
//     if (emblaApi) emblaApi.scrollPrev();
//   }, [emblaApi]);

//   const scrollNext = useCallback(() => {
//     if (emblaApi) emblaApi.scrollNext();
//   }, [emblaApi]);

//   useEffect(() => {
//     if (!emblaApi) return;

//     const updateButtons = () => {
//       setCanScrollPrev(emblaApi.canScrollPrev());
//       setCanScrollNext(emblaApi.canScrollNext());
//     };

//     emblaApi.on("select", updateButtons);
//     emblaApi.on("reInit", updateButtons);

//     // Initial check
//     updateButtons();

//     return () => {
//       emblaApi.off("select", updateButtons);
//       emblaApi.off("reInit", updateButtons);
//     };
//   }, [emblaApi]);

//   return (
//     <div>
//       {/* Header with Title and Navigation Buttons */}
//       <div className="hidden mb-5">
//         <h2 className="font-semibold text-2xl md:text-3xl">Events</h2>

//         {/* Navigation Buttons */}
//         <div className="hidden md:flex gap-2">
//           <Button
//             variant="outline"
//             size="icon"
//             onClick={scrollPrev}
//             disabled={!canScrollPrev}
//             className="rounded-full bg-white hover:bg-[#E2E8F0] border-[#E2E8F0] disabled:opacity-50"
//           >
//             <ChevronLeft className="w-5 h-5 text-gray-700" />
//           </Button>
//           <Button
//             variant="outline"
//             size="icon"
//             onClick={scrollNext}
//             disabled={!canScrollNext}
//             className="rounded-full bg-white hover:bg-[#E2E8F0] border-[#E2E8F0] disabled:opacity-50"
//           >
//             <ChevronRight className="w-5 h-5 text-[#275782]" />
//           </Button>
//         </div>
//       </div>

//       {/* Carousel Container */}
//       <div className="overflow-hidden pb-2" ref={emblaRef}>
//         <div className="flex gap-4">
//           {events.map((event) => (
//             <div
//               key={event.id}
//               className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_calc(50%-0.5rem)] lg:flex-[0_0_calc(33%-0.70rem)]"
//             >
//                <EventCard event={event} />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
