/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Star,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Imported Components
import { MediaGallery } from "@/components/media-gallery";
import { HeroCarousel } from "@/components/hero-slide";
import { ReviewsSection } from "@/components/review-button";
import { BookmarkButton } from "@/components/bookmark-button";

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
}

// Interface for the Ratings API response
interface ApiRatingData {
  id: number;
  listing_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at?: string;
  // We allow user to be optional, and we will populate it if missing
  user?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  };
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
  rating?: number | string;
  reviews_count?: number | string;
  is_verified?: boolean;
  images?: (ApiImage | string)[];
  socials?: ApiSocialItem[];
  services?: any[];
  faqs?: FAQItem[];
  reviews?: ApiReview[];
  experience?: ExperienceItem[];
  pricing?: PricingItem[];
  start_date?: string;
  type?: string;
}

// --- UI Interfaces ---
interface PageProps {
  params: Promise<{ slug: string; categorySlug?: string }>;
  type?: "business" | "event" | "community";
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

interface Provider {
  id: number;
  name: string;
  slug: string;
  description: string;
  location?: string;
  country?: string;
  verified?: boolean;
  reviews?: number | string;
  rating: number | string;
  phone?: string;
  email?: string;
  website?: string;
  socials?: SocialLinks;
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
    rel="noreferrer"
    className="text-gray-700 hover:text-gray-900 transition-colors"
  >
    <Icon className="h-4 w-4" />
  </Link>
);

// --- Sub-Components ---

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
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
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
  const { experiences, faqs, reviews } = {
    experiences: template.experience || [],
    faqs: template.faqs || [],
    reviews: template.reviews || [],
  };

  return (
    <div className="mt-6 px-4 pb-4">
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto rounded-full no-scrollbar">
          {["Portfolio", "Reviews", "Experience", "FAQs"].map((tab) => (
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
            <div className="px-3 py-3">
              <ReviewsSection reviews={reviews} listingSlug={listingSlug} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="experience" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Highlights & experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiences.length > 0 ? (
                experiences.map((item, index) => (
                  <div key={index}>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No experience highlights available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">FAQs</CardTitle>
            </CardHeader>
            <CardContent>
              {faqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-base text-gray-800">
                        {f.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        {f.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-gray-500">No FAQs available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SidebarLocation({ provider }: { provider: Provider }) {
  return (
    <Card>
      <CardContent className="pt-0.5">
        <h4 className="text-lg font-black text-gray-900">Location</h4>
        <div className="mt-3 relative h-40 overflow-hidden rounded-xl bg-gray-100">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(
              provider.name + " " + (provider.location || "")
            )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          {provider.location ?? provider.country ?? "Available internationally"}
        </p>
      </CardContent>
    </Card>
  );
}

function SidebarInfo({
  provider,
  pricing,
  services,
}: {
  provider: Provider;
  pricing: PricingItem[];
  services: string[];
}) {
  const socialLinks = provider.socials || {};

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

        <div className="mt-4">
          <Button className="w-full bg-[#93C01F] hover:bg-[#82ab1b]">
            Message {provider.name.split(" ")[0]}
          </Button>
        </div>

        <Divider />

        <div>
          <h5 className="text-lg font-black text-gray-900">What we do</h5>
          {services.length > 0 ? (
            <ul className="mt-2 list-disc space-y-3 pl-5 text-sm text-gray-600">
              {services.map((service, index) => (
                <li key={index}>{service}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Services list available upon request.
            </p>
          )}
        </div>

        <Divider />

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
            <div className="flex items-center gap-10">
              <h6 className="text-base font-medium text-black min-w-12">
                Socials
              </h6>
              <div className="flex items-center gap-3">
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
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

export default async function CategorySlugPage({
  params,
  type = "business",
}: PageProps) {
  const { categorySlug, slug } = await params;

  let listingData: ApiListingData | null = null;
  let ratingsData: ApiRatingData[] = [];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

  try {
    // 1. Fetch Listing Details
    const listingResponse = await fetch(`${API_URL}/api/listing/${slug}/show`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (listingResponse.ok) {
      const json = await listingResponse.json();
      listingData = json.data;

      // 2. Fetch Ratings using the Listing ID
      if (listingData?.id) {
        const ratingsResponse = await fetch(`${API_URL}/api/ratings`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          next: { revalidate: 300 }, // Shorter cache for reviews
        });

        if (ratingsResponse.ok) {
          const ratingsJson = await ratingsResponse.json();
          const allRatings = ratingsJson.data || [];

          // Filter ratings for this specific listing since API returns all
          const filteredRatings = allRatings.filter(
            (r: ApiRatingData) => r.listing_id === listingData!.id
          );

          // 3. ENRICH RATINGS (Fetch User Data if missing)
          // Since the API returns user_id but NOT the user object, we must fetch the user details.
          ratingsData = await Promise.all(
            filteredRatings.map(async (rating: ApiRatingData) => {
              // If user object is missing but we have an ID, fetch the user
              if (!rating.user && rating.user_id) {
                try {
                  const userRes = await fetch(
                    `${API_URL}/api/users/${rating.user_id}`,
                    {
                      headers: {
                        Accept: "application/json",
                      },
                      next: { revalidate: 3600 }, // Cache user info aggressively
                    }
                  );

                  if (userRes.ok) {
                    const userJson = await userRes.json();
                    const userData = userJson.data || userJson; // Handle standard API wrapper

                    return {
                      ...rating,
                      user: {
                        name: userData.name,
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        avatar: userData.avatar || userData.profile_photo_url,
                      },
                    };
                  }
                } catch (err) {
                  console.error(
                    `Failed to fetch user ${rating.user_id} for rating ${rating.id}`,
                    err
                  );
                }
              }
              return rating;
            })
          );
        }
      }
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }

  if (!listingData) {
    notFound();
  }

  // --- Data Mapping ---

  // Socials
  let socialLinks: SocialLinks = {};
  if (
    listingData.socials &&
    Array.isArray(listingData.socials) &&
    listingData.socials.length > 0
  ) {
    const socialData = listingData.socials[0];
    socialLinks = {
      facebook: socialData.facebook,
      instagram: socialData.instagram,
      twitter: socialData.twitter,
      youtube: socialData.youtube,
      tiktok: socialData.tiktok,
    };
  }

  // Services
  const servicesList =
    listingData.services?.map((s: any) =>
      typeof s === "string" ? s : s.name
    ) || [];

  // Provider Object
  const provider: Provider = {
    id: listingData.id,
    name: listingData.name,
    slug: listingData.slug,
    description:
      listingData.bio || listingData.description || "No description provided.",
    location: listingData.address || listingData.city || listingData.location,
    country: listingData.country,
    verified: listingData.is_verified,
    reviews: listingData.reviews_count
      ? listingData.reviews_count.toString()
      : "0",
    rating: listingData.rating || 0,
    phone: listingData.primary_phone,
    email: listingData.email,
    website: listingData.website,
    socials: socialLinks,
    startDate: listingData.start_date,
  };

  // Gallery
  const rawImages = listingData.images || [];
  const gallery: GalleryItem[] = rawImages.map((img) => {
    if (typeof img === "object" && img.media) {
      return { type: "image", src: getImageUrl(img.media), alt: provider.name };
    }
    if (typeof img === "string") {
      return { type: "image", src: getImageUrl(img), alt: provider.name };
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

  // --- Reviews Mapping ---
  const mappedReviews: ReviewItem[] = ratingsData.map((rating) => {
    let authorName = "Unknown User"; // Default fallback

    if (rating.user) {
      // 1. Try 'name' (Full Name)
      if (rating.user.name) {
        authorName = rating.user.name;
      }
      // 2. Try constructing from first/last
      else if (rating.user.first_name || rating.user.last_name) {
        authorName = `${rating.user.first_name || ""} ${
          rating.user.last_name || ""
        }`.trim();
      }
    }

    return {
      id: rating.id,
      author: authorName,
      rating: rating.rating,
      date: rating.created_at
        ? new Date(rating.created_at).toLocaleDateString()
        : "Recent",
      comment: rating.comment,
      avatar: rating.user?.avatar || "",
    };
  });

  // Fallback to old nested reviews if new API returns nothing
  const finalReviews =
    mappedReviews.length > 0
      ? mappedReviews
      : (listingData.reviews || []).map((review, idx) => ({
          id: review.id || idx,
          author: review.author || review.user || "Anonymous",
          rating: review.rating || 5,
          date:
            review.date ||
            (review.created_at
              ? new Date(review.created_at).toLocaleDateString()
              : "Recent"),
          comment: review.comment || "",
          avatar: review.avatar || "",
        }));

  const template: TemplateContent = {
    services: servicesList,
    pricing: listingData.pricing || [],
    experience: listingData.experience || [],
    faqs: listingData.faqs || [],
    reviews: finalReviews,
    gallery: gallery,
  };

  const rating = Number(provider.rating) || 0;

  // Breadcrumbs
  let parentLink = "/";
  let parentLabel = "Home";
  if (categorySlug) {
    parentLink = `/categories/${categorySlug}`;
    parentLabel =
      categorySlug.charAt(0).toUpperCase() +
      categorySlug.slice(1).replace(/-/g, " ");
  } else if (type === "event") {
    parentLink = "/events";
    parentLabel = "Events";
  } else if (type === "community") {
    parentLink = "/communities";
    parentLabel = "Communities";
  } else if (type === "business") {
    parentLink = "/businesses";
    parentLabel = "Businesses";
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
              <BreadcrumbPage>{provider.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-0">
        <main className="lg:col-span-8">
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="relative w-full">
              <HeroCarousel items={template.gallery} alt={provider.name} />
              <div className="absolute top-4 right-6 flex gap-2 z-10">
                <BookmarkButton slug={provider.slug} />
              </div>
            </div>

            <ProviderHeader provider={provider} rating={rating} type={type} />

            <ProviderTabs
              template={template}
              providerName={provider.name}
              galleryItems={template.gallery}
              listingSlug={provider.slug}
            />
          </div>
        </main>

        <aside className="lg:col-span-4 space-y-6">
          <SidebarLocation provider={provider} />
          <SidebarInfo
            provider={provider}
            pricing={template.pricing}
            services={template.services}
          />
        </aside>
      </div>
    </div>
  );
}
