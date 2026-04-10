/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import {
  MapPin,
  Star,
  FacebookLogo,
  InstagramLogo,
  XLogo,
  YoutubeLogo,
  SpinnerGap,
  Clock,
  WarningCircle,
  TiktokLogo,
  WhatsappLogo,
  CaretRight, // Added for link-style appearance
  NavigationArrow,
} from "@phosphor-icons/react";

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
import { ReviewsSection } from "@/components/review-button";

// Imported Components
import { MediaGallery } from "@/components/media-gallery";
import { HeroCarousel } from "@/components/hero-slide";
import { BookmarkButton } from "@/components/bookmark-button";
import { useAuth } from "@/context/auth-context";

// --- API Interfaces ---
interface ApiImage {
  id?: number;
  media: string;
  media_type?: string;
}

interface ApiSocialItem {
  id: number;
  listing_id: number;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

interface ApiReplyData {
  id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user?: {
    name?: string;
    avatar?: string;
  };
}

interface ApiRatingData {
  id: number;
  listing_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at?: string;
  user?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    profile_photo_url?: string;
    username?: string;
    email?: string;
  };
  replies?: ApiReplyData[];
}

interface ReviewReply {
  id: number | string;
  author: string;
  date: string;
  comment: string;
  avatar?: string;
}

interface ApiReview {
  id: number | string;
  user?: string;
  author?: string;
  rating: number;
  comment: string;
  created_at?: string;
  date?: string;
  avatar?: string;
  replies?: ReviewReply[];
}

interface OpeningHour {
  day_of_week: string;
  open_time: string;
  close_time: string;
}

interface ApiListingData {
  id: number;
  name: string;
  slug: string;
  bio?: string;
  description?: string;
  address?: string;
  country?: string;
  city?: string;
  location?: string;
  primary_phone?: string;
  secondary_phone?: string;
  email?: string;
  website?: string;
  google_plus_code?: string;
  latitude?: number;
  longitude?: number;
  rating?: number | string;
  reviews_count?: number | string;
  is_verified?: boolean;
  claim_status?: string;
  images?: (ApiImage | string)[];
  socials?: ApiSocialItem[];
  services?: any[];
  faqs?: FAQItem[];
  reviews?: ApiReview[];
  experience?: ExperienceItem[];
  pricing?: PricingItem[];
  start_date?: string;
  type?: string;
  opening_hours?: OpeningHour[];
}

// --- UI Interfaces ---
interface PageProps {
  params: Promise<{ slug: string; categorySlug?: string }>;
  type?: "business" | "event" | "community" | "discover";
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
}

interface Provider {
  id: number;
  name: string;
  slug: string;
  description: string;
  location?: string;
  country?: string;
  verified?: boolean;
  claim_status?: string;
  reviews?: number | string;
  rating: number | string;
  phone?: string;
  email?: string;
  website?: string;
  socials?: SocialLinks;
  latitude?: number;
  longitude?: number;
  startDate?: string;
}

interface GalleryItem {
  type: "image" | "video";
  src: string;
  alt?: string;
}

interface ExperienceItem {
  title: string;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ReviewItem {
  id?: number | string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  avatar?: string;
  replies?: ReviewReply[];
}

interface PricingItem {
  price: string;
  label: string;
}

interface TemplateContent {
  services: string[];
  pricing: PricingItem[];
  experience: ExperienceItem[];
  faqs: FAQItem[];
  reviews: ReviewItem[];
  gallery: GalleryItem[];
  hours: OpeningHour[];
}

// --- Helper Functions ---
const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholders/generic.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "";
  }
};

const extractUserName = (userData: any): string => {
  if (!userData) return "Unknown User";
  const rawUser = userData.data || userData.user || userData;
  let fullName = rawUser.name;
  if (!fullName && (rawUser.first_name || rawUser.last_name)) {
    fullName = `${rawUser.first_name || ""} ${rawUser.last_name || ""}`.trim();
  }
  if (!fullName) {
    fullName =
      rawUser.username || rawUser.email?.split("@")[0] || "Unknown User";
  }
  return fullName;
};

// --- Helper Components ---

const Divider = () => <div className="w-full h-px bg-gray-200 my-6" />;

/**
 * REDESIGNED SOCIAL ICON COMPONENT
 * Displays a professional "link card" with brand colors, icon, and name.
 */
const SocialIcon = ({
  href,
  icon: Icon,
  brandColor,
  name,
}: {
  href: string;
  icon: React.ElementType;
  brandColor: string;
  name: string;
}) => (
  <Link
    href={href}
    target="_blank"
    rel="noreferrer"
    className="group flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all hover:shadow-sm"
  >
    <div className="flex items-center gap-3">
      <div 
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-white shadow-sm group-hover:scale-110 transition-transform"
        style={{ color: brandColor }}
      >
        <Icon className="h-5 w-5" weight="fill" />
      </div>
      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
        {name}
      </span>
    </div>
    <CaretRight size={14} weight="bold" className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
  </Link>
);

// --- Sub-Components (Stateless) ---

function ProviderHeader({
  provider,
  rating,
  type,
}: {
  provider: Provider;
  rating: number;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold text-gray-900">
            {provider.name}
          </h1>
          {provider.verified && (
            <Image
              src="/images/icons/verify.svg"
              alt="Verified"
              width={20}
              height={20}
            />
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {provider.location ??
              provider.country ??
              "Available internationally"}
          </span>
          <span className="flex items-center gap-1 font-black text-gray-800">
            <Star className="h-4 w-4 text-yellow-400" weight="fill" />
            {rating.toFixed(1)}
            {provider.reviews && provider.reviews !== "0" && (
              <span className="text-gray-400 font-light">
                ({provider.reviews} reviews)
              </span>
            )}
          </span>
          {type === "event" && provider.startDate && (
            <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-xs font-medium">
              📅 {formatDateTime(provider.startDate)}
            </span>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-base text-gray-600">
          {provider.description}
        </p>
      </div>
    </div>
  );
}

function ProviderTabs({
  template,
  providerName,
  galleryItems,
  listingSlug,
}: {
  template: TemplateContent;
  providerName: string;
  galleryItems: GalleryItem[];
  listingSlug: string;
}) {
  const {
    reviews,
  } = {
    reviews: template.reviews || [],
  };

  return (
    <div className="mt-6 px-4 pb-4">
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto rounded-full no-scrollbar">
          {[
            "Portfolio",
            "Reviews",
          ].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase()}
              className="rounded-full text-base font-normal px-6"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="portfolio" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaGallery items={galleryItems} providerName={providerName} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <div className="px-6 py-1">
              <ReviewsSection
                reviews={reviews as any}
                listingSlug={listingSlug}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}

function SidebarLocation({ provider }: { provider: Provider }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? true : false;
  });
  const [error, setError] = useState<string | null>(null);

  // --- ADD THIS LOGIC HERE ---
  // Generate Google Maps Directions URL
  const directionsUrl = provider.latitude && provider.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        provider.name + " " + (provider.location || provider.country || "")
      )}`;

  useEffect(() => {
    if (!mapContainer.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;

    const initMap = async () => {
      try {
        let lng: number; let lat: number;
        if (provider.latitude && provider.longitude) {
          lng = provider.longitude; lat = provider.latitude;
        } else {
          const query = encodeURIComponent(provider.name + " " + (provider.location || provider.country || ""));
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`);
          const data = await res.json();
          if (data.features?.[0]) { [lng, lat] = data.features[0].center; } 
          else { setError("Location not found"); setIsLoading(false); return; }
        }

        if (map.current) { map.current.remove(); }
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [lng, lat],
          zoom: 14,
          interactive: false,
        });
        new mapboxgl.Marker({ color: "#93C01F" }).setLngLat([lng, lat]).addTo(map.current);
        map.current.on("load", () => { setIsLoading(false); });
      } catch { setError("Failed to load map"); setIsLoading(false); }
    };
    initMap();
    return () => { map.current?.remove(); map.current = null; };
  }, [provider.latitude, provider.longitude, provider.name, provider.location, provider.country]);

  return (
    <Card>
      <CardContent className="pt-0.5">
        <h4 className="text-lg font-black text-gray-900">Location</h4>
        <div className="mt-3 relative h-40 w-full overflow-hidden rounded-xl bg-gray-100">
          {isLoading && !error && <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Loading...</div>}
          {error && <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">{error}</div>}
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ minHeight: "160px" }} />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {provider.location ?? provider.country ?? "Available internationally"}
        </p>

        {/* --- ADD THIS LINK HERE --- */}
        <Link
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[#93C01F] text-[#93C01F] text-sm font-bold hover:bg-[#93C01F] hover:text-white transition-all group"
        >
          <NavigationArrow size={18} weight="fill" className="group-hover:rotate-12 transition-transform" />
          Get Directions
        </Link>
      </CardContent>
    </Card>
  );
}

function SidebarInfo({
  provider,
  pricing,
  // services,
  hours,
}: {
  provider: Provider;
  pricing: PricingItem[];
  // services: string[];
  hours: OpeningHour[];
}) {
  const socialLinks = provider.socials || {};

  const { user } = useAuth();
  const router = useRouter();

  const format12Hour = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const handleClaimBusiness = () => {
    if (user) {
      router.push(`/claim/${provider.slug}/verify`);
    } else {
      router.push(`/auth/login?redirect=/claim/${provider.slug}/verify`);
    }
  };

  return (
    <Card>
      <CardContent className="pt-0.5">
        {pricing.length > 0 && (
          <>
            <div className="text-2xl font-bold text-gray-900">
              {pricing[0]?.price}
            </div>
            <div className="text-xs text-gray-400">{pricing[0]?.label}</div>
          </>
        )}

        {hours && hours.length > 0 && (
          <div className="mt-6">
            <h5 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-[#93C01F]" weight="bold" /> Business Hours
            </h5>
            <div className="space-y-2">
              {hours.map((h, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-500 font-medium">
                    {h.day_of_week}
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {format12Hour(h.open_time)} - {format12Hour(h.close_time)}
                  </span>
                </div>
              ))}
            </div>
            <Divider />
          </div>
        )}


        <h5 className="text-lg font-black text-black">Contact</h5>
        <div className="mt-3 space-y-4 text-sm text-gray-600">
          {provider.phone && (
            <div className="flex items-center gap-10">
              <h6 className="text-base font-medium text-black min-w-12">
                Phone
              </h6>
              <p className="font-medium text-gray-900">{provider.phone}</p>
            </div>
          )}
          {provider.email && (
            <div className="flex items-center gap-10">
              <h6 className="text-base font-medium text-black min-w-12">
                Email
              </h6>
              <p className="font-medium text-gray-900 truncate">
                {provider.email}
              </p>
            </div>
          )}

          {provider.socials && Object.values(socialLinks).some((v) => v) && (
            <div className="flex flex-col gap-4 mt-2">
              <h6 className="text-base font-medium text-black">
                Socials:
              </h6>
              <div className="grid grid-cols-1 gap-2.5">
                {socialLinks.whatsapp && (
                  <SocialIcon
                    href={socialLinks.whatsapp}
                    icon={WhatsappLogo}
                    brandColor="#25D366"
                    name="WhatsApp"
                  />
                )}
                {socialLinks.facebook && (
                  <SocialIcon href={socialLinks.facebook} icon={FacebookLogo} brandColor="#1877F2" name="Facebook" />
                )}
                {socialLinks.instagram && (
                  <SocialIcon href={socialLinks.instagram} icon={InstagramLogo} brandColor="#E4405F" name="Instagram" />
                )}
                {socialLinks.twitter && (
                  <SocialIcon href={socialLinks.twitter} icon={XLogo} brandColor="#000000" name="X (Twitter)" />
                )}
                {socialLinks.youtube && (
                  <SocialIcon href={socialLinks.youtube} icon={YoutubeLogo} brandColor="#FF0000" name="YouTube" />
                )}
                {socialLinks.tiktok && (
                  <SocialIcon href={socialLinks.tiktok} icon={TiktokLogo} brandColor="#010101" name="TikTok" />
                )}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {provider.website && (
          <div className="flex flex-col gap-1">
            <h6 className="text-base font-medium text-gray-900">Website</h6>
            <Link
              href={provider.website}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 hover:underline text-sm truncate"
            >
              {provider.website}
            </Link>
          </div>
        )}

        <Divider />

        <div className="mt-4">
          <Button
            onClick={handleClaimBusiness}
            disabled={!!provider.claim_status}
            className={`w-full ${
              provider.claim_status
                ? "hidden"
                : "bg-[#93C01F] hover:bg-[#82ab1b] text-white"
            }`}
          >
            {provider.claim_status ? "Claimed" : "Claim business"}
          </Button>

          {provider.claim_status && (
            <div className="mt-3 text-center">
              <Link
                href={`/claim/${provider.slug}/verify`}
                className="text-[10px] text-gray-400 flex items-center justify-center gap-1 transition-colors capitalize font-bold tracking-tight"
              >
                <WarningCircle className="h-3 w-3" />
                Own this business?{" "}
                <span className="text-[#93C01F] hover:underline hover:underline-offset-2">
                  Request ownership
                </span>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page Component ---

export default function UniversalSlugPage({
  params,
  type = "business",
}: PageProps) {
  const resolvedParams = React.use(params);
  const { categorySlug, slug } = resolvedParams;

  const [loading, setLoading] = useState(true);
  const [providerData, setProviderData] = useState<Provider | null>(null);
  const [template, setTemplate] = useState<TemplateContent | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

      try {
        const listingResponse = await fetch(
          `${API_URL}/api/listing/${slug}/show`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
        );

        if (listingResponse.ok) {
          const json = await listingResponse.json();
          const listingData: ApiListingData = json.data;

          let ratingsData: ApiRatingData[] = [];

          if (listingData.id) {
            const ratingsResponse = await fetch(`${API_URL}/api/ratings`, {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            });

            if (ratingsResponse.ok) {
              const ratingsJson = await ratingsResponse.json();
              const allRatings = ratingsJson.data || [];
              const filteredRatings = allRatings.filter(
                (r: ApiRatingData) => r.listing_id === listingData.id,
              );

              ratingsData = await Promise.all(
                filteredRatings.map(async (rating: ApiRatingData) => {
                  if (
                    rating.user_id &&
                    (!rating.user || Object.keys(rating.user).length === 0)
                  ) {
                    try {
                      const userRes = await fetch(
                        `${API_URL}/api/users/${rating.user_id}`,
                      );
                      if (userRes.ok) {
                        const userJson = await userRes.json();
                        const userData = userJson.data || userJson;
                        return {
                          ...rating,
                          user: {
                            name:
                              userData.name ||
                              `${userData.first_name || ""} ${
                                userData.last_name || ""
                              }`.trim(),
                            avatar:
                              userData.avatar || userData.profile_photo_url,
                          },
                        };
                      }
                    } catch (e) {
                      console.error("User fetch failed", e);
                    }
                  }
                  return rating;
                }),
              );
            }
          }

          let socialLinks: SocialLinks = {};
          if (listingData.socials && listingData.socials.length > 0) {
            const socialData = listingData.socials[0];
            socialLinks = {
              facebook: socialData.facebook,
              instagram: socialData.instagram,
              twitter: socialData.twitter,
              youtube: socialData.youtube,
              tiktok: socialData.tiktok,
              whatsapp: socialData.whatsapp,
            };
          }

          try {
            const token = localStorage.getItem("authToken");
            const socialsHeaders: Record<string, string> = {
              Accept: "application/json",
            };
            if (token) socialsHeaders["Authorization"] = `Bearer ${token}`;
            const socialsRes = await fetch(
              `${API_URL}/api/listing/${slug}/socials`,
              { headers: socialsHeaders },
            );
            if (socialsRes.ok) {
              const socialsJson = await socialsRes.json();
              const raw = socialsJson.data || socialsJson;
              const s = Array.isArray(raw) ? raw[0] || {} : raw;
              if (s.facebook && !socialLinks.facebook)
                socialLinks.facebook = s.facebook;
              if (s.instagram && !socialLinks.instagram)
                socialLinks.instagram = s.instagram;
              if (s.twitter && !socialLinks.twitter)
                socialLinks.twitter = s.twitter;
              if (s.youtube && !socialLinks.youtube)
                socialLinks.youtube = s.youtube;
              if (s.tiktok && !socialLinks.tiktok)
                socialLinks.tiktok = s.tiktok;
              if (s.whatsapp && !socialLinks.whatsapp)
                socialLinks.whatsapp = s.whatsapp;
            }
          } catch {}

          const provider: Provider = {
            id: listingData.id,
            name: listingData.name,
            slug: listingData.slug,
            description:
              listingData.bio ||
              listingData.description ||
              "No description provided.",
            location:
              listingData.address || listingData.city || listingData.location,
            country: listingData.country,
            verified: listingData.is_verified,
            claim_status: listingData.claim_status,
            reviews: listingData.reviews_count
              ? listingData.reviews_count.toString()
              : "0",
            rating: listingData.rating || 0,
            phone: listingData.primary_phone,
            email: listingData.email,
            website: listingData.website,
            socials: socialLinks,
            latitude: listingData.latitude,
            longitude: listingData.longitude,
            startDate: listingData.start_date,
          };

          const rawImages = listingData.images || [];
          const gallery: GalleryItem[] = rawImages.map((img) => {
            if (typeof img === "object" && img.media) {
              return {
                type: "image",
                src: getImageUrl(img.media),
                alt: provider.name,
              };
            }
            if (typeof img === "string") {
              return {
                type: "image",
                src: getImageUrl(img),
                alt: provider.name,
              };
            }
            return {
              type: "image",
              src: "/images/placeholders/generic.jpg",
              alt: "Placeholder",
            };
          });
          if (gallery.length === 0) {
            gallery.push({
              type: "image",
              src: "/images/placeholders/generic.jpg",
              alt: provider.name,
            });
          }

          const mappedReviews: ReviewItem[] = ratingsData.map((rating) => ({
            id: rating.id,
            author: extractUserName(rating.user),
            rating: rating.rating,
            date: rating.created_at
              ? new Date(rating.created_at).toLocaleDateString()
              : "Recent",
            comment: rating.comment,
            avatar: rating.user?.avatar || "",
            replies:
              rating.replies?.map((r) => ({
                id: r.id,
                author: r.user?.name || "User",
                comment: r.comment,
                date: new Date(r.created_at).toLocaleDateString(),
                avatar: r.user?.avatar || "",
              })) || [],
          }));

          const servicesList =
            listingData.services?.map((s: any) =>
              typeof s === "string" ? s : s.name,
            ) || [];

          setProviderData(provider);
          setTemplate({
            services: servicesList,
            pricing: listingData.pricing || [],
            experience: listingData.experience || [],
            faqs: listingData.faqs || [],
            reviews: mappedReviews,
            gallery: gallery,
            hours: listingData.opening_hours || [],
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinnerGap className="h-8 w-8 animate-spin text-[#93C01F]" />
      </div>
    );
  }

  if (!providerData || !template) {
    return notFound();
  }

  const rating = Number(providerData.rating) || 0;

  let parentLink = "/";
  let parentLabel = "Home";

  if (categorySlug) {
    parentLink = `/categories/${categorySlug}`;
    parentLabel =
      categorySlug.charAt(0).toUpperCase() +
      categorySlug.slice(1).replace(/-/g, " ");
  } else if (type === "business") {
    parentLink = "/businesses";
    parentLabel = "Businesses";
  } else if (type === "community") {
    parentLink = "/communities";
    parentLabel = "Communities";
  } else if (type === "discover") {
    parentLink = "/discover";
    parentLabel = "Discover";
  } else if (type === "event") {
    parentLink = "/events";
    parentLabel = "Events";
  }

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
              <BreadcrumbLink href={parentLink}>{parentLabel}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{providerData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-0">
        <main className="lg:col-span-8 space-y-6">
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="relative w-full">
              <HeroCarousel items={template.gallery} alt={providerData.name} />
              <div className="absolute top-4 right-6 flex gap-2 z-10">
                <BookmarkButton slug={providerData.slug} />
              </div>
            </div>

            <ProviderHeader
              provider={providerData}
              rating={rating}
              type={type}
            />

            <ProviderTabs
              template={template}
              providerName={providerData.name}
              galleryItems={template.gallery}
              listingSlug={providerData.slug}
            />
          </div>

          {/* What We Do — standalone section below the main card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">What We Do</CardTitle>
            </CardHeader>
            <CardContent>
              {template.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {template.services.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#93C01F]/30 hover:bg-[#93C01F]/5 transition-colors"
                    >
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-[#93C01F]/15 flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#93C01F]" />
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {service}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Services list available upon request.
                </p>
              )}
            </CardContent>
          </Card>
        </main>

        <aside className="lg:col-span-4 space-y-6">
          <SidebarLocation provider={providerData} />
          <SidebarInfo
            provider={providerData}
            pricing={template.pricing}
            // services={template.services}
            hours={template.hours}
          />
        </aside>
      </div>
    </div>
  );
}