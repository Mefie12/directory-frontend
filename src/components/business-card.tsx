import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

export type Business = {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: string;
  location: string;
  verified?: boolean;
  slug: string;
};

type BusinessCardProps = {
  business: Business;
};

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link
      href={`/businesses/${business.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-[#E2E8F0]"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-4/3 overflow-hidden ">
        <Image
          src={business.image}
          alt={business.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#64748A14] text-[#64748A] text-xs font-medium">
            {business.category}
          </span>
            {business.verified && (
              <Image
                src="/images/icons/verify.svg"
                alt="Verified"
                width={20}
                height={20}
              />
            )}
        </div>

        {/* Business Name */}
        <h3 className="font-semibold text-base md:text-lg line-clamp-2 group-hover:text-[#275782] transition-colors">
          {business.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(business.rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : i < business.rating
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="text-sm text-gray-600 ml-1">
            ({business.reviewCount})
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Image
            src="/images/icons/location.svg"
            alt="Location"
            width={20}
            height={20}
          />
          <span>{business.location}</span>
        </div>
      </div>
    </Link>
  );
}
