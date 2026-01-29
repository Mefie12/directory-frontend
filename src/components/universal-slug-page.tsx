/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  MapPin,
  Star,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MessageSquare,
  CornerDownRight,
  Loader2,
  Clock, // Added for hours icon
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

// Added OpeningHour Interface
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
  opening_hours?: OpeningHour[]; // Added to API Data interface
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
  hours: OpeningHour[]; // Added to Template content
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

// --- Review Item with Reply Dialog & Threads ---
const ReviewItemComponent = ({
  review,
  onReply,
}: {
  review: ReviewItem;
  onReply: (reviewId: string | number, text: string) => void;
}) => {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleSubmitReply = () => {
    if (replyText.trim() && review.id) {
      onReply(review.id, replyText);
      setReplyText("");
      setIsReplyOpen(false);
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-0 py-6">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={review.avatar} />
          <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">
                {review.author}
              </h4>
              <div className="flex items-center gap-5 mt-0.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(review.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{review.date}</span>
              </div>
            </div>

            {/* Reply Dialog Trigger */}
            <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-gray-500 hover:text-[#93C01F]"
                >
                  <MessageSquare className="w-3 h-3 mr-1.5" />
                  Reply
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Reply to {review.author}</DialogTitle>
                  <DialogDescription>
                    Your reply will be publicly visible.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm text-gray-600 italic border-l-2 border-gray-300">
                    {review.comment}
                  </div>
                  <Textarea
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleSubmitReply}
                    className="bg-[#93C01F] hover:bg-[#7da815] text-white"
                  >
                    Post Reply
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            {review.comment}
          </p>

          {/* Threaded Replies */}
          {review.replies && review.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100">
              {review.replies.map((reply, index) => (
                <div
                  key={index}
                  className="flex gap-3 bg-gray-50/50 p-3 rounded-r-lg"
                >
                  <CornerDownRight className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-900">
                        {reply.author}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {reply.date}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{reply.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- NEW: Reviews Section Container ---
const EnhancedReviewsSection = ({
  initialReviews,
}: {
  initialReviews: ReviewItem[];
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);

  const handleReplySubmit = async (reviewId: string | number, text: string) => {
    // In a real app, you would make an API call here.
    // e.g. await fetch(`/api/reviews/${reviewId}/reply`, { method: 'POST', body: ... })

    // Optimistic Update
    const newReply: ReviewReply = {
      id: Date.now(),
      author: "You", // Replace with logged in user name
      date: "Just now",
      comment: text,
      avatar: "", // Replace with logged in user avatar
    };

    setReviews((prev) =>
      prev.map((review) => {
        if (review.id === reviewId) {
          return {
            ...review,
            replies: [...(review.replies || []), newReply],
          };
        }
        return review;
      }),
    );
  };

  return (
    <div className="space-y-2">
      {reviews.length > 0 ? (
        reviews.map((review, i) => (
          <ReviewItemComponent
            key={review.id || i}
            review={review}
            onReply={handleReplySubmit}
          />
        ))
      ) : (
        <div className="text-center py-10 text-gray-500">
          No reviews yet. Be the first to review!
        </div>
      )}
    </div>
  );
};

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
            <div className="px-6 py-6">
              {/* Using the new interactive reviews section */}
              <EnhancedReviewsSection initialReviews={reviews} />
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
              provider.name + " " + (provider.location || ""),
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
  hours, // Added Prop
}: {
  provider: Provider;
  pricing: PricingItem[];
  services: string[];
  hours: OpeningHour[]; // Added Prop
}) {
  const socialLinks = provider.socials || {};

  const { user } = useAuth();
  const router = useRouter();

  const handleClaimBusiness = () => {
    if (user) {
      router.push("/claim");
    } else {
      router.push("/auth/login?redirect=/claim");
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

        <div className="mt-4">
          <Button
            onClick={handleClaimBusiness}
            className="w-full bg-[#93C01F] hover:bg-[#82ab1b]"
          >
            Claim business
          </Button>
        </div>

        {/* Business Hours Section - Added below Claim button */}
        {hours && hours.length > 0 && (
          <div className="mt-6">
            <h5 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-[#93C01F]" /> Business Hours
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
                    {h.open_time} - {h.close_time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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

// --- Main Page Component (Client Side Fetching) ---

export default function UniversalSlugPage({
  params,
  type = "business",
}: PageProps) {
  // Use React.use to unwrap params if in Next.js 15, otherwise direct access might be deprecated
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
        // 1. Fetch Listing Details
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

          // 2. Fetch Ratings
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

              // 3. Enrich Ratings (User Data)
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

          // --- Process Data ---
          let socialLinks: SocialLinks = {};
          if (listingData.socials && listingData.socials.length > 0) {
            const socialData = listingData.socials[0];
            socialLinks = {
              facebook: socialData.facebook,
              instagram: socialData.instagram,
              twitter: socialData.twitter,
              youtube: socialData.youtube,
              tiktok: socialData.tiktok,
            };
          }

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
            hours: listingData.opening_hours || [], // Set hours here
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
        <Loader2 className="h-8 w-8 animate-spin text-[#93C01F]" />
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
        <main className="lg:col-span-8">
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
        </main>

        <aside className="lg:col-span-4 space-y-6">
          <SidebarLocation provider={providerData} />
          <SidebarInfo
            provider={providerData}
            pricing={template.pricing}
            services={template.services}
            hours={template.hours} // Passed prop
          />
        </aside>
      </div>
    </div>
  );
}
