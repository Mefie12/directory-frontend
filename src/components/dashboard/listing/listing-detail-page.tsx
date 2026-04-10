"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  PencilSimple,
  MapPin,
  Tag,
  Diamond,
  ArrowsClockwise,
  Link as LinkIcon,
  Check,
  Copy,
  X,
  Eye,
  BookmarkSimple,
  Star,
  Trash,
  Plus,
  SpinnerGap,
  UploadSimple,
  Briefcase,
  Images,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/auth-context";
import { useRolePath } from "@/hooks/useRolePath";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// --- Types ---

type PageProps = {
  params: Promise<{ slug: string }>;
};

interface ListingImage {
  id: number;
  media: string | null;
  media_type: string;
}

interface Category {
  id: number;
  name: string;
}

interface ApiListing {
  id: number;
  name: string;
  slug: string;
  bio: string;
  address: string;
  country: string;
  city: string;
  status: string;
  type?: string;
  images: ListingImage[];
  categories: Category[];
  rating: number;
  ratings_count: number;
  views_count: number;
  bookmarks_count: number;
}

interface ServiceImage {
  id?: number;
  url?: string;
  media?: string;
}

interface Service {
  id: number | string;
  name: string;
  description: string;
  images: ServiceImage[];
}

interface ListingDetail {
  id: string;
  slug: string;
  name: string;
  bio: string;
  address: string;
  location: string;
  status: "published" | "pending" | "drafted";
  type: string;
  category: string;
  coverImage: string;
  allImages: string[];
  views: number;
  bookmarks: number;
  rating: number;
  ratingsCount: number;
}

// --- Helpers ---

const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/placeholder-listing.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const API_URL = "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

const getStatusColor = (status: string) => {
  if (status === "published") return "bg-[#E9F5D6] text-[#5F8B0A]";
  if (status === "pending") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-600";
};

const getStatusLabel = (status: string) => {
  if (status === "published") return "Published";
  if (status === "pending") return "Pending Review";
  return "Draft";
};

// --- Main Component ---

export default function ListingDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { myListings, listingEdit } = useRolePath();

  const defaultTab = searchParams.get("tab") || "overview";

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Service form state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    name: "",
    description: "",
  });
  const [serviceImages, setServiceImages] = useState<File[]>([]);
  const [serviceImagePreviews, setServiceImagePreviews] = useState<string[]>(
    [],
  );
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchListing = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const API_URL = "https://me-fie.co.uk";

      const res = await fetch(`${API_URL}/api/listing/${slug}/show`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch listing");

      const json = await res.json();
      const data: ApiListing = json.data || json;

      const rawImages = data.images || [];
      const validImages = rawImages
        .filter((img) => {
          if (!img.media) return false;
          const bad = ["processing", "failed", "pending", "error"];
          return !bad.includes(img.media);
        })
        .map((img) => getImageUrl(img.media));

      const backendStatus = (data.status || "").toLowerCase();
      let status: "published" | "pending" | "drafted" = "drafted";
      if (["published", "active", "approved"].includes(backendStatus))
        status = "published";
      else if (backendStatus === "pending") status = "pending";

      let resolvedType = data.type || "";
      if (!resolvedType && data.categories?.length > 0) {
        const catName = data.categories[0].name.toLowerCase();
        if (["community", "event"].includes(catName)) resolvedType = catName;
      }

      setListing({
        id: data.id.toString(),
        slug: data.slug,
        name: data.name,
        bio: data.bio || "",
        address: data.address || "",
        location:
          [data.city, data.country].filter(Boolean).join(", ") || "Online",
        status,
        type: resolvedType || "business",
        category: data.categories?.[0]?.name || "Uncategorized",
        coverImage:
          validImages[0] || "/images/placeholder-listing.png",
        allImages: validImages,
        views: data.views_count || 0,
        bookmarks: data.bookmarks_count || 0,
        rating: Number(data.rating) || 0,
        ratingsCount: data.ratings_count || 0,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load listing details");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchServices = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const API_URL = "https://me-fie.co.uk";

      const res = await fetch(`${API_URL}/api/listing/${slug}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) return;

      const json = await res.json();
      setServices(
        Array.isArray(json.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [],
      );
    } catch {
      // Silent — services are optional
    }
  }, [slug]);

  useEffect(() => {
    if (!authLoading) {
      fetchListing();
      fetchServices();
    }
  }, [authLoading, fetchListing, fetchServices]);

  // Open service form immediately when navigating with ?tab=services
  useEffect(() => {
    if (defaultTab === "services") setShowServiceForm(false);
  }, [defaultTab]);

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setServiceImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setServiceImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeServiceImage = (index: number) => {
    setServiceImages((prev) => prev.filter((_, i) => i !== index));
    setServiceImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetServiceForm = () => {
    setServiceFormData({ name: "", description: "" });
    setServiceImages([]);
    setServiceImagePreviews([]);
    setShowServiceForm(false);
  };

  const handleServiceSubmit = async () => {
    if (!serviceFormData.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    setIsSubmittingService(true);
    try {
      const token = localStorage.getItem("authToken");
      const API_URL = "https://me-fie.co.uk";

      if (serviceImages.length > 0) {
        const formData = new FormData();
        formData.append("name", serviceFormData.name);
        formData.append("description", serviceFormData.description);
        serviceImages.forEach((img, i) =>
          formData.append(`images[${i}]`, img),
        );

        const res = await fetch(`${API_URL}/api/listing/${slug}/services`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to create service");
      } else {
        const res = await fetch(`${API_URL}/api/listing/${slug}/services`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(serviceFormData),
        });
        if (!res.ok) throw new Error("Failed to create service");
      }

      toast.success("Service added successfully");
      resetServiceForm();
      fetchServices();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add service",
      );
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("authToken");
      const API_URL = "https://me-fie.co.uk";

      const res = await fetch(`${API_URL}/api/listing/${slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to delete listing");
      toast.success("Listing deleted successfully");
      router.push(myListings);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://me-fie.co.uk/listing/${listing?.slug}`);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 3000);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  // --- Loading ---
  if (loading || authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-[#93C01F]" />
      </div>
    );
  }

  // --- Not found ---
  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Listing not found</p>
        <Button onClick={() => router.push(myListings)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Listings
        </Button>
      </div>
    );
  }

  return (
    <div className="px-1 lg:px-8 py-4 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={myListings}>My Listings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium truncate max-w-[200px]">
              {listing.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(myListings)}
            className="shrink-0 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {listing.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}
              >
                {getStatusLabel(listing.status)}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500 capitalize">
                {listing.type}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2 hidden sm:flex"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            size="sm"
            className="bg-[#93C01F] hover:bg-[#82ab1b] gap-2"
            onClick={() =>
              router.push(listingEdit(listing.type, listing.slug))
            }
          >
            <PencilSimple className="w-4 h-4" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Hero Cover Image */}
      <div
        className="relative w-full h-52 sm:h-72 rounded-2xl overflow-hidden cursor-pointer group bg-gray-100"
        onClick={() => listing.allImages[0] && setPreviewImage(listing.allImages[0])}
      >
        <Image
          src={listing.coverImage}
          alt={listing.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            if (!t.src.includes("placeholder"))
              t.src = "/images/placeholder-listing.png";
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
        {listing.allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
            +{listing.allImages.length - 1} more photos
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left / Main Column ── */}
        <div className="lg:col-span-2">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-6 bg-gray-100 rounded-xl p-1 h-11">
              <TabsTrigger
                value="overview"
                className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium"
              >
                Media
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium"
              >
                What We Do
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview" className="space-y-5 mt-0">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-3">
                  About this listing
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace">
                  {listing.bio || "No description provided."}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-5">
                  Listing Details
                </h2>
                <div className="grid grid-cols-[28px_1fr_auto] gap-y-5 gap-x-3 items-center text-sm">
                  <ArrowsClockwise className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}
                  >
                    {getStatusLabel(listing.status)}
                  </span>

                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-900 text-right">
                    {listing.location}
                  </span>

                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900 capitalize text-right">
                    {listing.type}
                  </span>

                  <Diamond className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Category</span>
                  <Badge
                    variant="outline"
                    className="text-xs justify-self-end"
                  >
                    {listing.category}
                  </Badge>

                  <LinkIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Slug</span>
                  <div className="flex items-center gap-1 justify-self-end">
                    <span className="text-gray-700 text-xs font-mono">
                      {listing.slug}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-[#93C01F]"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Media Tab ── */}
            <TabsContent value="media" className="space-y-5 mt-0">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-gray-900">
                    Media Gallery
                  </h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {listing.allImages.length}{" "}
                    {listing.allImages.length === 1 ? "photo" : "photos"}
                  </span>
                </div>

                {listing.allImages.length > 0 ? (
                  <div className="space-y-5">
                    {/* Cover Photo */}
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#93C01F]" />
                        Cover Photo
                      </h3>
                      <div
                        className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group"
                        onClick={() =>
                          setPreviewImage(listing.allImages[0])
                        }
                      >
                        <Image
                          src={listing.allImages[0]}
                          alt="Cover"
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute top-3 left-3 bg-[#93C01F] text-white text-xs px-2.5 py-1 rounded-md font-medium">
                          Cover
                        </div>
                      </div>
                    </div>

                    {/* Gallery */}
                    {listing.allImages.length > 1 && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-300" />
                          Gallery ({listing.allImages.length - 1})
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {listing.allImages.slice(1).map((img, i) => (
                            <div
                              key={i}
                              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                              onClick={() => setPreviewImage(img)}
                            >
                              <Image
                                src={img}
                                alt={`Gallery ${i + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                unoptimized
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                          ))}
                          {/* Add more tile */}
                          <div
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#93C01F] hover:bg-[#93C01F]/5 transition-all group"
                            onClick={() =>
                              router.push(
                                listingEdit(listing.type, listing.slug),
                              )
                            }
                          >
                            <Plus className="w-5 h-5 text-gray-300 group-hover:text-[#93C01F] transition-colors" />
                            <span className="text-xs text-gray-400 group-hover:text-[#93C01F] transition-colors">
                              Add more
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
                    <Images className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-gray-500 text-sm font-medium">
                      No photos yet
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Add photos to make your listing stand out
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-5"
                      onClick={() =>
                        router.push(
                          listingEdit(listing.type, listing.slug),
                        )
                      }
                    >
                      Add Photos
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── What We Do Tab ── */}
            <TabsContent value="services" className="space-y-5 mt-0">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      What We Do
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Showcase your services &amp; offerings
                    </p>
                  </div>
                  {!showServiceForm && (
                    <Button
                      size="sm"
                      className="bg-[#93C01F] hover:bg-[#82ab1b] gap-1.5"
                      onClick={() => setShowServiceForm(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Add Service
                    </Button>
                  )}
                </div>

                {/* Inline Service Form */}
                {showServiceForm && (
                  <div className="mb-6 p-5 rounded-xl border border-[#93C01F]/25 bg-linear-to-b from-[#93C01F]/5 to-transparent space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#93C01F] flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          New Service
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-gray-700"
                        onClick={resetServiceForm}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">
                        Service Name{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Wedding Photography, Logo Design…"
                        value={serviceFormData.name}
                        onChange={(e) =>
                          setServiceFormData((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        className="bg-white h-10"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">
                        Description
                      </label>
                      <Textarea
                        placeholder="Describe what this service includes, pricing, turnaround time…"
                        rows={3}
                        value={serviceFormData.description}
                        onChange={(e) =>
                          setServiceFormData((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        className="bg-white resize-none text-sm"
                      />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">
                          Images
                          <span className="text-gray-400 font-normal ml-1">
                            ({serviceImages.length} selected)
                          </span>
                          {serviceImages.length < 3 && (
                            <span className="text-[#93C01F] font-normal ml-1 text-[10px]">
                              — add 3 or more for best results
                            </span>
                          )}
                        </label>
                        {serviceImages.length > 0 && (
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            onClick={() => {
                              setServiceImages([]);
                              setServiceImagePreviews([]);
                            }}
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Drop zone */}
                      <div
                        className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#93C01F] hover:bg-[#93C01F]/5 transition-all cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleImageFiles(e.dataTransfer.files);
                        }}
                      >
                        <UploadSimple className="w-7 h-7 text-gray-300 group-hover:text-[#93C01F] mx-auto mb-2 transition-colors" />
                        <p className="text-sm text-gray-500">
                          <span className="text-[#93C01F] font-medium">
                            Click to upload
                          </span>{" "}
                          or drag &amp; drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, WEBP · up to 10 MB each · unlimited
                          files
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) =>
                            handleImageFiles(e.target.files)
                          }
                        />
                      </div>

                      {/* Preview grid */}
                      {serviceImagePreviews.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mt-1">
                          {serviceImagePreviews.map((preview, i) => (
                            <div
                              key={i}
                              className="relative aspect-square rounded-lg overflow-hidden group"
                            >
                              <Image
                                src={preview}
                                alt={`Preview ${i + 1}`}
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeServiceImage(i);
                                }}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              {i === 0 && (
                                <div className="absolute bottom-0 inset-x-0 bg-[#93C01F]/90 text-white text-[9px] text-center py-0.5 font-medium">
                                  Cover
                                </div>
                              )}
                            </div>
                          ))}
                          {/* Add more trigger */}
                          <div
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#93C01F] hover:bg-[#93C01F]/5 transition-all group"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#93C01F] transition-colors" />
                            <span className="text-[10px] text-gray-400 group-hover:text-[#93C01F]">
                              More
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-2.5 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={resetServiceForm}
                        disabled={isSubmittingService}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-[#93C01F] hover:bg-[#82ab1b]"
                        onClick={handleServiceSubmit}
                        disabled={
                          isSubmittingService ||
                          !serviceFormData.name.trim()
                        }
                      >
                        {isSubmittingService ? (
                          <SpinnerGap className="w-4 h-4 animate-spin" />
                        ) : (
                          "Save Service"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Services List */}
                {services.length > 0 ? (
                  <div className="space-y-3">
                    {services.map((service) => {
                      const thumb =
                        service.images?.[0]?.url ||
                        service.images?.[0]?.media;
                      return (
                        <div
                          key={service.id}
                          className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all"
                        >
                          {thumb ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                              <Image
                                src={getImageUrl(thumb)}
                                alt={service.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <Briefcase className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                {service.description}
                              </p>
                            )}
                            {service.images?.length > 1 && (
                              <div className="flex items-center gap-1.5 mt-2">
                                {service.images
                                  .slice(1, 5)
                                  .map((img, i) => (
                                    <div
                                      key={i}
                                      className="relative w-8 h-8 rounded-md overflow-hidden"
                                    >
                                      <Image
                                        src={getImageUrl(
                                          img?.url || img?.media,
                                        )}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  ))}
                                {service.images.length > 5 && (
                                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                                    +{service.images.length - 5}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add another */}
                    {!showServiceForm && (
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#93C01F] hover:text-[#93C01F] hover:bg-[#93C01F]/5 transition-all"
                        onClick={() => setShowServiceForm(true)}
                      >
                        <Plus className="w-4 h-4" />
                        Add another service
                      </button>
                    )}
                  </div>
                ) : (
                  !showServiceForm && (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
                      <Briefcase className="w-10 h-10 text-gray-200 mb-3" />
                      <p className="text-gray-600 text-sm font-medium">
                        No services yet
                      </p>
                      <p className="text-gray-400 text-xs mt-1 text-center max-w-xs">
                        Add services to help customers understand what
                        you offer
                      </p>
                      <Button
                        size="sm"
                        className="mt-5 bg-[#93C01F] hover:bg-[#82ab1b] gap-1.5"
                        onClick={() => setShowServiceForm(true)}
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Service
                      </Button>
                    </div>
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="space-y-4">
          {/* Performance Stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">
              Performance
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3.5 text-center">
                <Eye className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 leading-none">
                  {listing.views.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Views</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5 text-center">
                <BookmarkSimple className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 leading-none">
                  {listing.bookmarks}
                </div>
                <div className="text-xs text-gray-500 mt-1">Bookmarks</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5 text-center">
                <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 leading-none">
                  {listing.rating.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Rating</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5 text-center">
                <Star className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-900 leading-none">
                  {listing.ratingsCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">Reviews</div>
              </div>
            </div>
          </div>

          {/* Owner */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">
              Owner
            </h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#93C01F]/10 text-[#5F8B0A] text-sm font-semibold">
                  {user
                    ? getInitials(user.name || user.email || "U")
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {user?.name || "You"}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button
                className="w-full bg-[#93C01F] hover:bg-[#82ab1b] gap-2"
                onClick={() =>
                  router.push(listingEdit(listing.type, listing.slug))
                }
              >
                <PencilSimple className="w-4 h-4" />
                Edit Listing
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy Listing Link"}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash className="w-4 h-4" />
                Delete Listing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={() => setPreviewImage(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative w-full max-h-[88vh] flex items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-50 h-9 w-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/80 border border-white/20 cursor-pointer transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            {previewImage && (
              <Image
                src={previewImage}
                alt="Preview"
                width={1200}
                height={800}
                className="object-contain max-h-[88vh] w-auto"
                unoptimized
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{listing.name}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
