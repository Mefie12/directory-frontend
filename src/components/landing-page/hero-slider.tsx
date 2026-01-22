"use client";

import { useState, useEffect } from "react";
import { heroSlides } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleClickListing = () => {
    // const currentSlideData = heroSlides[currentSlide];
    router.push("/discover");
  };

  const handleClickEvent = () => {
    if (user) {
      // Authenticated -> Go to Claim Page
      router.push("/claim");
    } else {
      // Not Authenticated -> Go to Login, then redirect to Claim Page
      router.push("/auth/login?redirect=/claim");
    }
  };

  // Define unique colors for each slide dot
  const dotColors = [
    "bg-[#7EA81A]", // green
    "bg-[#FDF08B]", // yellow
    "bg-[#36A1A4]", // teal
  ];

  return (
    <div className="relative flex flex-col items-center">
      {/* Slider Section */}
      <div className="relative h-[540px] lg:h-[717px] w-full overflow-hidden">
        <Image
          src={heroSlides[currentSlide].image}
          alt={heroSlides[currentSlide].title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Slide Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center text-white gap-2 mt-3 lg:mt-0">
          <div className="max-w-4xl px-4 sm:px-6 space-y-2 text-center">
            <h3 className="font-bold text-4xl md:text-6xl mt-1 capitalize leading-tight">
              {heroSlides[currentSlide].title}
            </h3>
            <p className="w-full px-2 sm:px-3 py-1 mx-auto text-base md:text-2xl">
              {heroSlides[currentSlide].description}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-2 sm:space-x-4 mt-4 px-4">
            <Button
              onClick={handleClickEvent}
              className="py-3 sm:py-5 px-3 sm:px-4 bg-(--accent-primary) text-xs sm:text-base font-normal h-10 rounded-lg text-white hover:bg-[#FCFFDF] hover:text-black transition-all duration-300 cursor-pointer"
            >
              {heroSlides[currentSlide].cta}
            </Button>

            <Button
              onClick={handleClickListing}
              className="py-3 sm:py-5 px-3 sm:px-4 bg-(--accent-tertiary) text-xs sm:text-base font-normal h-10 rounded-lg text-[#0F1621] hover:bg-gray-300 transition-all duration-300 cursor-pointer"
            >
              {heroSlides[currentSlide].cta2}
            </Button>
          </div>
        </div>
      </div>

      {/* Pagination Section (outside the slide) */}
      <div className="flex justify-center mt-4 space-x-3">
        {heroSlides.map((_, index) => {
          const baseColor = dotColors[index % dotColors.length]; // rotate colors if slides > colors
          const isActive = index === currentSlide;

          return (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-2 rounded-[12px] transition-all duration-300 ${baseColor} ${
                isActive
                  ? "scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                  : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
