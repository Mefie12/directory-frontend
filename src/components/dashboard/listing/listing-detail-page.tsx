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
  // Link as LinkIcon,
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
import { RichTextDisplay } from "@/components/ui/rich-text-editor";

// --- Types ---

type PageProps = {
  params: Promise<{ slug: string }>;
};

interface ListingImage {
  id: number;
  original: string;
  thumb: string;
  webp: string;
  mime_type?: string;
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

interface Service {
  id: number | string;
  slug?: string;
  name: string;
  description: string;
  image?: string | null;
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

interface ApiReview {
  id: number | string;
  slug: string;
  rating: number;
  comment: string | null;
  status: "visible" | "hidden";
  vendor_reply: string | null;
  vendor_reply_at: string | null;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  } | null;
}

// --- Helpers ---

const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return "/images/no-image.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Backend returns bare S3 keys e.g. "staging/services/uuid.jpeg"
  return `https://mefie-bucket.s3.eu-north-1.amazonaws.com/${url.replace(/^\//, "")}`;
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
  const highlightReviewSlug = searchParams.get("review");

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [replyingToSlug, setReplyingToSlug] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

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
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingServiceSlug, setDeletingServiceSlug] = useState<string | null>(null);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchListing = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const res = await fetch(`/api/listing/${slug}/show`, {
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
        .filter((img) => !!img.original)
        .map((img) => getImageUrl(img.original));

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
          validImages[0] || "/images/no-image.jpg",
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

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/listing/${slug}/ratings`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const json = await res.json();
      setReviews(Array.isArray(json.data) ? json.data : []);
    } catch {
      // silent — reviews are supplemental
    } finally {
      setReviewsLoading(false);
    }
  }, [slug]);

  const handleReplySubmit = async (ratingSlug: string) => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    setIsSubmittingReply(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/rating/${ratingSlug}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ vendor_reply: replyText }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to post reply");
      }

      const updated = await res.json();
      const updatedReview: ApiReview = updated.data ?? updated;

      setReviews((prev) =>
        prev.map((r) => (r.slug === ratingSlug ? { ...r, vendor_reply: updatedReview.vendor_reply, vendor_reply_at: updatedReview.vendor_reply_at } : r)),
      );
      setReplyingToSlug(null);
      setReplyText("");
      toast.success("Reply posted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const fetchServices = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");

      const res = await fetch(`/api/listings/${slug}/services`, {
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
      fetchReviews();
    }
  }, [authLoading, fetchListing, fetchServices, fetchReviews]);

  // Open service form immediately when navigating with ?tab=services
  useEffect(() => {
    if (defaultTab === "services") setShowServiceForm(false);
  }, [defaultTab]);

  // Scroll to and highlight a specific review when arriving via ?review= param
  useEffect(() => {
    if (!highlightReviewSlug || reviews.length === 0) return;
    const el = document.getElementById(`review-${highlightReviewSlug}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-[#93C01F]", "ring-offset-2");
    const timer = setTimeout(() => {
      el.classList.remove("ring-2", "ring-[#93C01F]", "ring-offset-2");
    }, 2500);
    return () => clearTimeout(timer);
  }, [highlightReviewSlug, reviews]);

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 5 MB limit and was not added.`);
        return false;
      }
      return true;
    });
    if (newFiles.length === 0) return;
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
    setEditingService(null);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceFormData({ name: service.name, description: service.description || "" });
    setServiceImages([]);
    setServiceImagePreviews([]);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (serviceSlug: string) => {
    setDeletingServiceSlug(serviceSlug);
    setIsDeletingService(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/services/${serviceSlug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to delete service");
      toast.success("Service deleted");
      fetchServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setIsDeletingService(false);
      setDeletingServiceSlug(null);
    }
  };

  const handleServiceSubmit = async () => {
    if (!serviceFormData.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    setIsSubmittingService(true);
    try {
      const token = localStorage.getItem("authToken");
      const isEdit = !!editingService?.slug;
      let imageKey: string | null = null;

      // Step 1 + 2: presign → direct S3 upload (only when a new image is selected)
      if (serviceImages.length > 0) {
        const file = serviceImages[0];

        const presignRes = await fetch(`/api/listings/${slug}/services/presign`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ filename: file.name, mime_type: file.type, size: file.size }),
        });

        if (!presignRes.ok) throw new Error("Could not get upload URL");
        const { upload_url, key } = await presignRes.json();

        // Upload directly to S3 — bypasses our server entirely
        const s3Res = await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!s3Res.ok) throw new Error("Image upload to storage failed");
        imageKey = key;
      }

      // Step 3: create or update the service record with the S3 key (or null)
      const endpoint = isEdit
        ? `/api/services/${editingService!.slug}`
        : `/api/listings/${slug}/services`;
      const method = isEdit ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        name: serviceFormData.name,
        description: serviceFormData.description,
      };
      // On create always send image_key (null = no image).
      // On edit only send image_key when the user picked a new image,
      // so the backend keeps the existing image when none is chosen.
      if (!isEdit || serviceImages.length > 0) {
        payload.image_key = imageKey;
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Failed to ${isEdit ? "update" : "create"} service`);
      }

      toast.success(isEdit ? "Service updated successfully" : "Service added successfully");
      resetServiceForm();
      fetchServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("authToken");

      const res = await fetch(`/api/listing/${slug}`, {
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

  const handleCopy = async () => {
    const pathByType: Record<string, string> = {
      event: "events",
      community: "communities",
    };
    const segment = pathByType[listing?.type ?? ""] ?? "businesses";
    const url = `${window.location.origin}/${segment}/${listing?.slug}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-secure contexts
        const el = document.createElement("textarea");
        el.value = url;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Failed to copy link");
    }
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
                className={`w-fit px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}
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
              t.src = "/images/no-image.jpg";
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
            <TabsList className="w-full grid grid-cols-4 mb-6 bg-gray-100 rounded-xl p-1 h-11">
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
              <TabsTrigger
                value="reviews"
                className="rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-medium"
              >
                Reviews
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview" className="space-y-5 mt-0">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-3">
                  About this listing
                </h2>
                {listing.bio ? (
                  <RichTextDisplay html={listing.bio} className="text-sm" />
                ) : (
                  <p className="text-sm text-gray-400 italic">No description provided.</p>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-5">
                  Listing Details
                </h2>
                <div className="grid grid-cols-[28px_1fr_auto] gap-y-5 gap-x-3 items-center text-sm">
                  <ArrowsClockwise className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`w-fit justify-self-end px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}
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

                  {/* <LinkIcon className="w-4 h-4 text-gray-400" />
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
                  </div> */}
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
                          {editingService ? (
                            <PencilSimple className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {editingService ? "Edit Service" : "New Service"}
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
                          Image{" "}
                          <span className="text-gray-400 font-normal">(Optional)</span>
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
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Show preview when image selected, drop zone otherwise */}
                      {serviceImagePreviews.length > 0 ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden group border border-gray-200">
                          <Image
                            src={serviceImagePreviews[0]}
                            alt="Service image preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setServiceImages([]);
                              setServiceImagePreviews([]);
                            }}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
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
                            PNG, JPG, WEBP · up to 10 MB
                          </p>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageFiles(e.target.files)}
                      />
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
                          editingService ? "Update Service" : "Save Service"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Services List */}
                {services.length > 0 ? (
                  <div className="space-y-3">
                    {services.map((service) => {
                      return (
                        <div
                          key={service.id}
                          className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all"
                        >
                          {service.image ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                              <Image
                                src={getImageUrl(service.image)}
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
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {service.name}
                              </h3>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-400 hover:text-[#93C01F]"
                                  onClick={() => handleEditService(service)}
                                  disabled={showServiceForm}
                                >
                                  <PencilSimple className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-400 hover:text-red-500"
                                  onClick={() => service.slug && handleDeleteService(service.slug)}
                                  disabled={isDeletingService && deletingServiceSlug === service.slug}
                                >
                                  {isDeletingService && deletingServiceSlug === service.slug ? (
                                    <SpinnerGap className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            {service.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                {service.description}
                              </p>
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

            {/* ── Reviews Tab ── */}
            <TabsContent value="reviews" className="space-y-5 mt-0">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Customer Reviews
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {reviews.length > 0 && (
                      <>
                        <span>
                          <span className="font-semibold text-gray-900">
                            {listing.rating.toFixed(1)}
                          </span>{" "}
                          avg
                        </span>
                        <span className="text-gray-200">|</span>
                        <span>
                          <span className="font-semibold text-gray-900">
                            {reviews.length}
                          </span>{" "}
                          review{reviews.length !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <SpinnerGap className="w-6 h-6 animate-spin text-[#93C01F]" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-gray-100 rounded-xl">
                    <Star className="w-9 h-9 text-gray-200 mb-3" />
                    <p className="text-gray-600 text-sm font-medium">No reviews yet</p>
                    <p className="text-gray-400 text-xs mt-1 text-center max-w-xs">
                      Reviews from customers will appear here once they start coming in.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const reviewerName = review.user
                        ? `${review.user.first_name} ${review.user.last_name}`.trim()
                        : "Anonymous";
                      const isReplying = replyingToSlug === review.slug;
                      const alreadyReplied = !!review.vendor_reply;

                      return (
                        <div
                          key={review.id}
                          id={`review-${review.slug}`}
                          className="border border-gray-100 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                <span className="text-xs font-semibold text-gray-500">
                                  {reviewerName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {reviewerName}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= Math.round(review.rating ?? 0)
                                          ? "text-yellow-400"
                                          : "text-gray-200"
                                      }`}
                                      weight="fill"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] text-gray-400 shrink-0">
                              {review.created_at
                                ? new Date(review.created_at).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : ""}
                            </span>
                          </div>

                          {review.comment && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {review.comment}
                            </p>
                          )}

                          {review.vendor_reply && (
                            <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-[#93C01F]/40">
                              <p className="text-xs font-semibold text-gray-700 mb-1">
                                Your reply
                                {review.vendor_reply_at && (
                                  <span className="font-normal text-gray-400 ml-2">
                                    ·{" "}
                                    {new Date(review.vendor_reply_at).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {review.vendor_reply}
                              </p>
                            </div>
                          )}

                          {!alreadyReplied && !isReplying && (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToSlug(review.slug);
                                setReplyText("");
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#93C01F] transition-colors"
                            >
                              ↩ Reply
                            </button>
                          )}

                          {isReplying && (
                            <div className="space-y-2.5 pt-1">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply to this review…"
                                rows={3}
                                maxLength={500}
                                className="resize-none text-sm bg-gray-50 border-gray-200 focus-visible:ring-[#93C01F]"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-gray-400">
                                  {replyText.length}/500
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs"
                                    disabled={isSubmittingReply}
                                    onClick={() => {
                                      setReplyingToSlug(null);
                                      setReplyText("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs bg-[#93C01F] hover:bg-[#82ab1b] gap-1"
                                    disabled={isSubmittingReply || !replyText.trim()}
                                    onClick={() => handleReplySubmit(review.slug)}
                                  >
                                    {isSubmittingReply ? (
                                      <SpinnerGap className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      "Post Reply"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
