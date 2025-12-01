"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bookmark,
  MapPin,
  Calendar,
  Clock,
  Ticket,
  Share2,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Star,
  Users,
  MessageCircle,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { communityCards, featuredBusinesses, Events } from "@/lib/data";

// Imported Components
import { MediaGallery } from "@/components/media-gallery";
import { HeroCarousel } from "@/components/hero-slide";
import { ReviewsSection } from "@/components/review-button";

// --- Types ---

export type EntityType = "event" | "business" | "community" | "discover";

interface EntityItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image: string;
  gallery: Array<{ type: "image" | "video"; src: string; alt?: string }>;
  isVerified?: boolean;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  website?: string;
  tags?: string[];

  // Dynamic Fields (Optional based on type)
  date?: string; // Event
  time?: string; // Event
  venue?: string; // Event
  price?: string; // Event (Ticket) or Business (Range)
  organizer?: string; // Event
  rating?: number; // Business
  reviews?: number; // Business
  memberCount?: number; // Community
  phone?: string; // Business
  email?: string; // Business
}

// --- Helper Components ---

const Divider = () => <div className="w-full h-px bg-gray-200 my-6" />;

const SocialIcon = ({
  href,
  icon: Icon,
}: {
  href: string;
  icon: React.ElementType;
}) => (
  <Link
    href={href}
    target="_blank"
    className="text-gray-700 hover:text-gray-900 transition-colors"
  >
    <Icon className="h-4 w-4" />
  </Link>
);

// --- Sub-Components (Dynamic) ---

function EntityHeader({
  entity,
  type,
}: {
  entity: EntityItem;
  type: EntityType;
}) {
  // Event Specific Date Formatting
  const eventDate = entity.date
    ? new Date(entity.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[#93C01F] hover:bg-[#7fa818] border-none text-white font-medium">
          {entity.category}
        </Badge>
        {entity.isVerified && (
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700 gap-1 font-normal"
          >
            <Image
              src="/images/icons/verify.svg"
              alt="Verified"
              width={14}
              height={14}
            />
            Verified
          </Badge>
        )}
      </div>

      <h1 className="text-3xl font-bold text-gray-900 md:text-4xl leading-tight">
        {entity.title}
      </h1>

      {/* Conditional Metadata Row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mt-1">
        {/* EVENT: Date & Time */}
        {type === "event" && (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#93C01F]" />
              <span className="font-medium">{eventDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#93C01F]" />
              <span className="font-medium">{entity.time}</span>
            </div>
          </>
        )}

        {/* BUSINESS: Rating & Reviews */}
        {(type === "business" || type === "discover") && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-gray-900">
              {entity.rating?.toFixed(1) || "New"}
            </span>
            <span className="text-gray-500">
              ({entity.reviews || 0} reviews)
            </span>
          </div>
        )}

        {/* COMMUNITY: Member Count */}
        {type === "community" && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#93C01F]" />
            <span className="font-medium">
              {entity.memberCount || 0} Members
            </span>
          </div>
        )}

        {/* SHARED: Location */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#93C01F]" />
          <span className="font-medium">
            {entity.venue ? `${entity.venue}, ` : ""}
            {entity.location}
          </span>
        </div>
      </div>
    </div>
  );
}

function SidebarAction({
  entity,
  type,
}: {
  entity: EntityItem;
  type: EntityType;
}) {
  // Render different Primary Action Cards based on type

  if (type === "event") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">
                Ticket Price
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {entity.price || "Free"}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#EBF8C9] flex items-center justify-center">
              <Ticket className="h-5 w-5 text-[#5F8B0A]" />
            </div>
          </div>
          <Button className="w-full bg-[#93C01F] hover:bg-[#82ab1b] font-semibold h-11 text-base">
            Get Tickets
          </Button>
          <p className="text-[10px] text-center text-gray-400 mt-3">
            Secure checkout via Me-Fie
          </p>
        </CardContent>
      </Card>
    );
  }

  if (type === "business" || type === "discover") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase font-medium">
              Price Range
            </p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">
              {entity.price || "Contact for pricing"}
            </h3>
          </div>
          <Button className="w-full bg-[#93C01F] hover:bg-[#82ab1b] font-semibold h-11 text-base gap-2">
            <MessageCircle className="h-4 w-4" /> Message Business
          </Button>
          <div className="mt-3 text-center">
            {entity.phone && (
              <p className="text-sm text-gray-600">{entity.phone}</p>
            )}
            {entity.email && (
              <p className="text-sm text-gray-600">{entity.email}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "community") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF8C9] mb-3">
              <Users className="h-8 w-8 text-[#5F8B0A]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Join Community</h3>
            <p className="text-sm text-gray-500 mt-1">
              Connect with {entity.memberCount} others
            </p>
          </div>
          <Button className="w-full bg-[#93C01F] hover:bg-[#82ab1b] font-semibold h-11 text-base">
            Join Group
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}

function SidebarInfo({
  entity,
  type,
}: {
  entity: EntityItem;
  type: EntityType;
}) {
  const socialLinks = entity.socials || {};
  const organizerLabel =
    type === "business"
      ? "Business Owner"
      : type === "community"
      ? "Admin"
      : "Organizer";

  return (
    <Card>
      <CardContent className="pt-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          {organizerLabel}
        </h4>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl bg-[#F8F9FA]">
              {(entity.organizer || entity.title).charAt(0)}
            </div>
          </div>
          <div className="overflow-hidden">
            <h5 className="font-semibold text-gray-900 truncate">
              {entity.organizer || entity.title}
            </h5>
            {entity.website && (
              <Link
                href={entity.website}
                target="_blank"
                className="text-xs text-[#93C01F] hover:underline block truncate"
              >
                Visit website
              </Link>
            )}
          </div>
        </div>

        <Divider />

        <h5 className="text-sm font-semibold text-gray-900 mb-3">Socials</h5>
        <div className="flex gap-4">
          {socialLinks.facebook && (
            <SocialIcon href={socialLinks.facebook} icon={Facebook} />
          )}
          {socialLinks.instagram && (
            <SocialIcon href={socialLinks.instagram} icon={Instagram} />
          )}
          {socialLinks.twitter && (
            <SocialIcon href={socialLinks.twitter} icon={Twitter} />
          )}
          {socialLinks.youtube && (
            <SocialIcon href={socialLinks.youtube} icon={Youtube} />
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button
            variant="outline"
            className="w-full gap-2 text-gray-600 hover:text-gray-900"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- MAIN COMPONENT ---

export default function UniversalSlugPage({
  params,
  type,
}: {
  params: Promise<{ slug: string }>;
  type: EntityType;
}) {
  const { slug } = use(params);
  const { loading: authLoading } = useAuth();

  const [data, setData] = useState<EntityItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (authLoading) return;
      setLoading(true);

      try {
        let raw: Record<string, unknown> | null = null;

        // First, try to find in local mock data
        if (type === "community") {
          const community = communityCards.find((c) => c.slug === slug);
          if (community) {
            raw = {
              id: community.id,
              name: community.name,
              title: community.name,
              description: community.description,
              category: community.tag,
              location: community.location,
              image: community.imageUrl,
              is_verified: community.verified,
              members_count: 0,
            };
          }
        } else if (type === "business" || type === "discover") {
          const business = featuredBusinesses.find((b) => b.slug === slug);
          if (business) {
            raw = {
              id: business.id,
              name: business.name,
              title: business.name,
              description: business.description || "",
              category: business.category,
              location: business.location,
              image: business.image,
              is_verified: business.verified,
              rating: business.rating,
              reviews_count: parseInt(business.reviewCount) || 0,
              price_range: "Contact for pricing",
            };
          }
        } else if (type === "event") {
          const event = Events.find((e) => e.slug === slug);
          if (event) {
            raw = {
              id: event.id,
              name: event.name,
              title: event.name,
              description: event.description,
              category: event.category,
              location: event.location,
              image: event.image,
              is_verified: event.verified,
              start_date: event.startDate,
              start_time: event.startDate,
            };
          }
        }

        // If not found in local data, try API
        if (!raw) {
          const token = localStorage.getItem("authToken");
          const headers: HeadersInit = { Accept: "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;

          const API_URL = process.env.API_URL || "https://me-fie.co.uk";

          const endpoint = `${API_URL}/api/${
            type === "discover" ? "businesses" : type + "s"
          }/${slug}`;

          const response = await fetch(endpoint, { method: "GET", headers });

          if (!response.ok) throw new Error(`${type} not found`);

          const json = await response.json();
          raw = json.data || json;
        }

        if (!raw) throw new Error(`${type} not found`);

        // Unified Data Mapping
        const mapped: EntityItem = {
          id: String(raw?.id || ""),
          title: String(raw?.title || raw?.name || "Untitled"),
          description: String(raw?.description || ""),
          category:
            typeof raw?.category === "object"
              ? String(
                  (raw.category as Record<string, unknown>)?.name || "General"
                )
              : String(raw?.category || "General"),
          location: String(raw?.location || raw?.city || "Location TBD"),
          image: String(
            raw?.cover_image || raw?.image || "/images/placeholders/generic.jpg"
          ),

          // Type specific mapping
          date: raw?.start_date
            ? String(raw.start_date)
            : raw?.date
            ? String(raw.date)
            : undefined,
          time: raw?.start_time
            ? String(raw.start_time)
            : raw?.time
            ? String(raw.time)
            : undefined,
          venue: raw?.venue
            ? String(raw.venue)
            : raw?.address
            ? String(raw.address)
            : undefined,
          price: raw?.price_range
            ? String(raw.price_range)
            : raw?.price
            ? `GHS ${raw.price}`
            : undefined,
          organizer:
            typeof raw?.organizer === "object"
              ? String(
                  (raw.organizer as Record<string, unknown>)?.name || "Me-Fie"
                )
              : String(raw?.organizer || raw?.owner || "Me-Fie"),

          rating: Number(raw?.rating) || 0,
          reviews: Number(raw?.reviews_count) || 0,
          memberCount: Number(raw?.members_count) || 0,
          phone: raw?.phone ? String(raw.phone) : undefined,
          email: raw?.email ? String(raw.email) : undefined,

          isVerified: Boolean(raw?.is_verified),
          website: raw?.website ? String(raw.website) : undefined,
          tags: Array.isArray(raw?.tags) ? (raw.tags as string[]) : [],
          socials:
            typeof raw?.socials === "object"
              ? (raw.socials as Record<string, string>)
              : {},
          gallery: Array.isArray(raw?.gallery)
            ? (raw.gallery as Array<{
                type: "image" | "video";
                src: string;
                alt?: string;
              }>)
            : [],
        };

        setData(mapped);
      } catch (err) {
        console.error(err);
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug, type, authLoading]);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/30">
        <Loader2 className="h-10 w-10 animate-spin text-[#93C01F] mb-4" />
        <p className="text-gray-500">Loading {type} details...</p>
      </div>
    );

  if (error || !data) return notFound();

  // Fallback Gallery
  const displayGallery =
    data.gallery.length > 0
      ? data.gallery
      : [{ type: "image" as const, src: data.image, alt: data.title }];

  return (
    <div className="min-h-screen pb-24 pt-24 bg-gray-50/30">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-0">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/${type === "discover" ? "businesses" : type + "s"}`}
                className="capitalize"
              >
                {type === "discover" ? "Business" : type + "s"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{data.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-0">
        <main className="lg:col-span-8">
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="relative w-full h-[300px] sm:h-[400px]">
              <HeroCarousel items={displayGallery} alt={data.title} />
              <div className="absolute top-4 right-6 flex gap-2 z-10">
                <Button
                  size="sm"
                  className="border border-white/60 bg-white/80 text-gray-700 shadow-sm transition hover:bg-white backdrop-blur-md"
                >
                  <Bookmark className="h-4 w-4 mr-2" /> Save
                </Button>
              </div>
            </div>

            <EntityHeader entity={data} type={type} />

            {/* Generic Tabs Structure */}
            <div className="mt-6 px-4 pb-4">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto rounded-full no-scrollbar">
                  <TabsTrigger
                    value="details"
                    className="rounded-full px-6 text-base font-normal"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="gallery"
                    className="rounded-full px-6 text-base font-normal"
                  >
                    Gallery
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="rounded-full px-6 text-base font-normal"
                  >
                    Reviews
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {data.description}
                      </p>
                      {data.tags && data.tags.length > 0 && (
                        <div className="pt-4 border-t mt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">
                            Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {data.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-gray-100 text-gray-600"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="gallery" className="mt-6">
                  <Card>
                    <CardContent className="pt-6">
                      <MediaGallery
                        items={data.gallery}
                        providerName={data.title}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <Card>
                    <div className="p-4">
                      <ReviewsSection reviews={[]} />
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        <aside className="lg:col-span-4 space-y-6">
          {/* Map can be shared or conditional */}
          <Card>
            <CardContent className="pt-0.5">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Location</h4>
              <div className="relative h-48 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    data.location
                  )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <p className="mt-3 text-sm text-gray-600">{data.location}</p>
            </CardContent>
          </Card>
          <SidebarAction entity={data} type={type} />
          <SidebarInfo entity={data} type={type} />
        </aside>
      </div>
    </div>
  );
}
