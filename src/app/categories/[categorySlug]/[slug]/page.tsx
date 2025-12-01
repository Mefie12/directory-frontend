import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bookmark,
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

// Data Sources
import {
  categories,
  categoryServiceProviders,
  categoryDetailContent,
  defaultCategoryDetailContent,
} from "@/lib/data";

// --- Type Definitions ---
type PageProps = {
  params: Promise<{ categorySlug: string; slug: string }>;
};

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

interface Provider {
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
}

interface GalleryItem {
  type: "image" | "video";
  src: string;
  alt?: string;
}

// Union type to handle dirty data (strings or objects)
type RawGalleryItem = string | GalleryItem;

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

// Raw review shape from data.ts (handles inconsistent key naming)
interface RawReviewItem {
  author?: string;
  user?: string;
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
}: {
  provider: Provider;
  rating: number;
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
            {provider.reviews && (
              <span className="text-gray-400 font-light">
                ({provider.reviews} reviews)
              </span>
            )}
          </span>
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
              <ReviewsSection reviews={reviews} />
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
              {experiences.map((item, index) => (
                <div key={index}>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">FAQs</CardTitle>
            </CardHeader>
            <CardContent>
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
          <ul className="mt-2 list-disc space-y-3 pl-5 text-sm text-gray-600">
            {services.map((service, index) => (
              <li key={index}>{service}</li>
            ))}
          </ul>
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

          {provider.socials && (
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

export default async function CategoryProviderPage({ params }: PageProps) {
  const { categorySlug, slug } = await params;

  // Data Fetching
  const categoryProviders = categoryServiceProviders[categorySlug];
  if (!categoryProviders) notFound();

  const rawProvider = categoryProviders.find((p) => p.slug === slug);
  if (!rawProvider) notFound();

  // Provider Data Transformation
  const provider: Provider = {
    ...rawProvider,
    reviews: rawProvider.reviews?.toString(),
    rating: rawProvider.rating,
  };

  const categoryMeta = categories.find((c) => c.slug === categorySlug);

  // Template Normalization
  const rawTemplate =
    categoryDetailContent[categorySlug] ?? defaultCategoryDetailContent;

  // Data Mapping for Child Components
  const mappedGallery: GalleryItem[] = rawTemplate.gallery.map(
    (item: RawGalleryItem) => {
      if (typeof item === "string") {
        return { type: "image", src: item, alt: provider.name };
      }
      return item;
    }
  );

  const mappedReviews: ReviewItem[] = rawTemplate.reviews.map(
    (review: RawReviewItem, index: number) => ({
      id: index,
      author: review.author || review.user || "Anonymous",
      rating: review.rating,
      date: review.date,
      comment: review.comment,
      avatar: review.avatar || "",
    })
  );

  // Construct the final safe template object
  const template: TemplateContent = {
    services: rawTemplate.services.length
      ? rawTemplate.services
      : defaultCategoryDetailContent.services,
    pricing: rawTemplate.pricing.length
      ? rawTemplate.pricing
      : defaultCategoryDetailContent.pricing,
    experience: rawTemplate.experience.length
      ? rawTemplate.experience
      : defaultCategoryDetailContent.experience,
    faqs: rawTemplate.faqs.length
      ? rawTemplate.faqs
      : defaultCategoryDetailContent.faqs,
    reviews: mappedReviews.length
      ? mappedReviews
      : (defaultCategoryDetailContent.reviews as unknown as ReviewItem[]),
    gallery: mappedGallery.length
      ? mappedGallery
      : (defaultCategoryDetailContent.gallery as unknown as GalleryItem[]),
  };

  const rating = Number(provider.rating) || 0;

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
              <BreadcrumbLink href={`/categories/${categorySlug}`}>
                {categoryMeta?.name ?? categorySlug}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{provider.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-0">
        {/* Main Content Area */}
        <main className="lg:col-span-8">
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="relative w-full">
              <HeroCarousel items={template.gallery} alt={provider.name} />
              <div className="absolute top-4 right-6 flex gap-2 z-10">
                <Button
                  size="sm"
                  className="border border-white/60 bg-white/80 text-gray-700 shadow-sm transition hover:bg-white"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Bookmark
                </Button>
              </div>
            </div>

            <ProviderHeader provider={provider} rating={rating} />

            <ProviderTabs
              template={template}
              providerName={provider.name}
              galleryItems={template.gallery}
            />
          </div>
        </main>

        {/* Sidebar Area */}
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
