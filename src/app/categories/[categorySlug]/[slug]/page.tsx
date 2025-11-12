import Image from "next/image";
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
import {
  categories,
  categoryServiceProviders,
  categoryDetailContent,
  defaultCategoryDetailContent,
} from "@/lib/data";
import Link from "next/link";
import { MediaGallery } from "@/components/media-gallery";
import { HeroCarousel } from "@/components/hero-slide";
import { ReviewsSection } from "@/components/review-button";

type PageProps = {
  params: Promise<{ categorySlug: string; slug: string }>;
};

const Divider = () => <div className="w-full h-px bg-gray-200 my-6" />;

export default async function CategoryProviderPage({ params }: PageProps) {
  const { categorySlug, slug } = await params;

  // Find provider
  const categoryProviders = categoryServiceProviders[categorySlug];
  if (!categoryProviders) notFound();

  const provider = categoryProviders.find((p) => p.slug === slug);
  if (!provider) notFound();

  // Get category metadata
  const categoryMeta = categories.find((c) => c.slug === categorySlug);

  // Get template content or use defaults
  const template =
    categoryDetailContent[categorySlug] ?? defaultCategoryDetailContent;
  const services = template.services.length
    ? template.services
    : defaultCategoryDetailContent.services;
  const pricing = template.pricing.length
    ? template.pricing
    : defaultCategoryDetailContent.pricing;
  const experiences = template.experience.length
    ? template.experience
    : defaultCategoryDetailContent.experience;
  const faqs = template.faqs.length
    ? template.faqs
    : defaultCategoryDetailContent.faqs;
  const reviews = template.reviews.length
    ? template.reviews
    : defaultCategoryDetailContent.reviews;
  const galleryItems = template.gallery.length
    ? template.gallery
    : defaultCategoryDetailContent.gallery;
  // const mapImage = template.mapImage ?? defaultCategoryDetailContent.mapImage;

  // Format rating
  const rating =
    typeof provider.rating === "number"
      ? provider.rating
      : Number(provider.rating) || 0;

  return (
    <div className="min-h-screen pb-24 pt-24">
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
        <main className="lg:col-span-8">
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            {/* Hero Carousel */}
            <div className="relative w-full">
              <HeroCarousel items={galleryItems} alt={provider.name} />
              <div className="absolute top-4 right-6 flex gap-2">
                <Button className="rounded border border-white/60 bg-white/80 px-2 py-0 text-sm text-gray-700 shadow-sm transition hover:bg-white">
                  <Bookmark className="h-4 w-4" />
                  Bookmark
                </Button>
              </div>
            </div>

            <div className="p-4">
              {/* Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

              {/* Tabs */}
              <div className="mt-6">
                <Tabs defaultValue="portfolio" className="w-full">
                  <TabsList className="w-full justify-start overflow-x-auto rounded-full">
                    <TabsTrigger
                      value="portfolio"
                      className="rounded-full text-base font-normal"
                    >
                      Portfolio
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="rounded-full text-base font-normal"
                    >
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger
                      value="experience"
                      className="rounded-full text-base font-normal"
                    >
                      Experience
                    </TabsTrigger>
                    <TabsTrigger
                      value="faqs"
                      className="rounded-full text-base font-normal"
                    >
                      FAQs
                    </TabsTrigger>
                  </TabsList>

                  {/* Portfolio Tab */}
                  <TabsContent value="portfolio" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                          Gallery
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MediaGallery
                          items={galleryItems}
                          providerName={provider.name}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Reviews Tab */}
                  <TabsContent value="reviews" className="mt-6">
                    <Card>
                      <div className="px-3 py-3">
                        <ReviewsSection reviews={reviews} />
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Experience Tab */}
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

                  {/* FAQs Tab */}
                  <TabsContent value="faqs" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                          FAQs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="space-y-6">
            {/* Location Card */}
            <Card>
              <CardContent className="pt-1">
                <h4 className="text-lg font-black text-gray-900">Location</h4>
                <div className="mt-3 relative h-40 overflow-hidden rounded-xl">
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      provider.name
                    )}&output=embed`}
                    allowFullScreen
                    loading="lazy"
                    className="absolute inset-0 w-full h-full border-0"
                  ></iframe>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {provider.location ??
                    provider.country ??
                    "Available internationally"}
                </p>
              </CardContent>
            </Card>

            {/* Pricing & Contact Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-900">
                  {pricing[0]?.price}
                </div>
                <div className="text-xs text-gray-400">{pricing[0]?.label}</div>
                <div className="mt-4">
                  <Button className="w-full bg-[#93C01F]">
                    Message {provider.name.split(" ")[0]}
                  </Button>
                </div>

                <Divider />

                <div>
                  <h5 className="text-lg font-black text-gray-900">
                    What we do
                  </h5>
                  <ul className="mt-2 list-disc space-y-3 pl-5 text-sm text-gray-600">
                    {services.map((service, index) => (
                      <li key={index}>{service}</li>
                    ))}
                  </ul>
                </div>

                <Divider />

                <h5 className="text-lg font-black text-black">Contact</h5>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  {provider.phone && (
                    <div className="flex items-center gap-10">
                      <h6 className="text-base font-medium text-black">
                        Phone
                      </h6>
                      <p className="font-medium text-gray-900">
                        {provider.phone}
                      </p>
                    </div>
                  )}
                  {provider.email && (
                    <div className="flex items-center gap-10">
                      <h6 className="text-base font-medium text-black">
                        Email
                      </h6>
                      <p className="font-medium text-gray-900">
                        {provider.email}
                      </p>
                    </div>
                  )}
                  {provider.socials && (
                    <div className="flex items-center gap-10">
                      <h6 className="text-base font-medium text-black">
                        Socials
                      </h6>
                      <div className="flex items-center gap-3">
                        {provider.socials.facebook && (
                          <Link
                            href={provider.socials.facebook}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-700 hover:text-gray-900"
                          >
                            <Facebook className="h-4 w-4" />
                          </Link>
                        )}
                        {provider.socials.instagram && (
                          <Link
                            href={provider.socials.instagram}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-700 hover:text-gray-900"
                          >
                            <Instagram className="h-4 w-4" />
                          </Link>
                        )}
                        {provider.socials.twitter && (
                          <Link
                            href={provider.socials.twitter}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-700 hover:text-gray-900"
                          >
                            <Twitter className="h-4 w-4" />
                          </Link>
                        )}
                        {provider.socials.youtube && (
                          <Link
                            href={provider.socials.youtube}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-700 hover:text-gray-900"
                          >
                            <Youtube className="h-4 w-4" />
                          </Link>
                        )}
                        {/* {provider.socials.tiktok && (
                          <Link href={provider.socials.tiktok} target="_blank" rel="noreferrer" className="text-gray-700 hover:text-gray-900">
                            <Tiktok className="h-4 w-4" />
                          </Link>
                        )} */}
                      </div>
                    </div>
                  )}
                  <Divider />

                  {provider.website && (
                    <div className="flex flex-col gap-1">
                      <h6 className="text-base font-medium">Website</h6>
                      <p>
                        <Link
                          href={provider.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline"
                        >
                          {provider.website}
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
