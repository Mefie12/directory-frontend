"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  PencilSimple,
  MapPin,
  Tag,
  User,
  Check,
  Copy,
  X,
  BookmarkSimple,
  Star,
  Trash,
  Plus,
  SpinnerGap,
  UploadSimple,
  Briefcase,
  Eye,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/auth-context";
import { useRolePath } from "@/hooks/useRolePath";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
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
import { ListingImageGallery } from "@/components/dashboard/listing/listing-image-gallery";

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

// A row in the "Add Services" multi-row form.
interface ServiceRow {
  name: string;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
}

const EMPTY_SERVICE_ROW: ServiceRow = {
  name: "",
  description: "",
  imageFile: null,
  imagePreview: null,
};

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

// Compact key/value row used inside the Address & Details cards.
function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0 text-sm">
      <span className="flex items-center gap-2 text-gray-500 shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
        {label}
      </span>
      <span className="font-medium text-gray-900 text-right truncate">
        {children}
      </span>
    </div>
  );
}

// --- Main Component ---

export default function ListingDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { myListings, listingEdit } = useRolePath();

  const highlightReviewSlug = searchParams.get("review");

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [replyingToSlug, setReplyingToSlug] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // "Add Services" multi-row form (sidebar slot, under the image gallery)
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([
    { ...EMPTY_SERVICE_ROW },
  ]);
  const [isSubmittingServices, setIsSubmittingServices] = useState(false);
  const rowFileInputRefs = useRef<Record<number, HTMLInputElement | null>>(
    {},
  );

  // Single-service edit dialog (triggered from the Services list below)
  const [editOpen, setEditOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editData, setEditData] = useState({ name: "", description: "" });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(
    null,
  );
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [deletingServiceSlug, setDeletingServiceSlug] = useState<
    string | null
  >(null);
  const [isDeletingService, setIsDeletingService] = useState(false);

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
        coverImage: validImages[0] || "/images/no-image.jpg",
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
        prev.map((r) =>
          r.slug === ratingSlug
            ? {
                ...r,
                vendor_reply: updatedReview.vendor_reply,
                vendor_reply_at: updatedReview.vendor_reply_at,
              }
            : r,
        ),
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
        Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [],
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

  // Uploads a File to S3 via the presigned-URL flow and returns the S3 key.
  const uploadServiceImage = useCallback(
    async (file: File): Promise<string | null> => {
      const token = localStorage.getItem("authToken");
      const presignRes = await fetch(
        `/api/listings/${slug}/services/presign`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            mime_type: file.type,
            size: file.size,
          }),
        },
      );
      if (!presignRes.ok) throw new Error("Could not get upload URL");
      const { upload_url, key } = await presignRes.json();

      const s3Res = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error("Image upload to storage failed");
      return key;
    },
    [slug],
  );

  // --- Multi-row "Add Services" form ---

  const addServiceRow = () =>
    setServiceRows((prev) => [...prev, { ...EMPTY_SERVICE_ROW }]);

  const removeServiceRow = (index: number) =>
    setServiceRows((prev) => prev.filter((_, i) => i !== index));

  const updateServiceRow = (index: number, patch: Partial<ServiceRow>) =>
    setServiceRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const handleRowImageFile = (index: number, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`"${file.name}" exceeds the 5 MB limit and was not added.`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      updateServiceRow(index, {
        imageFile: file,
        imagePreview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddServices = async () => {
    const validRows = serviceRows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      toast.error("Add at least one service with a name");
      return;
    }
    setIsSubmittingServices(true);
    try {
      const token = localStorage.getItem("authToken");
      for (const row of validRows) {
        const imageKey = row.imageFile
          ? await uploadServiceImage(row.imageFile)
          : null;

        const res = await fetch(`/api/listings/${slug}/services`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: row.name.trim(),
            description: row.description,
            image_key: imageKey,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            err.message || err.error || "Failed to add service",
          );
        }
      }

      toast.success(
        validRows.length > 1
          ? `${validRows.length} services added successfully`
          : "Service added successfully",
      );
      setServiceRows([{ ...EMPTY_SERVICE_ROW }]);
      fetchServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add services");
    } finally {
      setIsSubmittingServices(false);
    }
  };

  // --- Single-service edit dialog ---

  const openEditService = (service: Service) => {
    setEditingService(service);
    setEditData({ name: service.name, description: service.description || "" });
    setEditImageFile(null);
    setEditImagePreview(service.image ? getImageUrl(service.image) : null);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingService?.slug) return;
    if (!editData.name.trim()) {
      toast.error("Service name is required");
      return;
    }
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem("authToken");
      const payload: Record<string, unknown> = {
        name: editData.name.trim(),
        description: editData.description,
      };
      // Only touch the image when the user picked a new one, so the backend
      // keeps the existing image otherwise.
      if (editImageFile) {
        payload.image_key = await uploadServiceImage(editImageFile);
      }

      const res = await fetch(`/api/services/${editingService.slug}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.message || err.error || "Failed to update service",
        );
      }

      toast.success("Service updated successfully");
      setEditOpen(false);
      fetchServices();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update service",
      );
    } finally {
      setIsSavingEdit(false);
    }
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

  const validRowCount = serviceRows.filter((r) => r.name.trim()).length;

  return (
    <div className="px-1 lg:px-8 py-4 space-y-8 max-w-6xl mx-auto">
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

      {/* Hero: image gallery (left) + info column (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: carousel + Add Services form */}
        <div className="lg:col-span-3 space-y-5">
          <ListingImageGallery images={listing.allImages} alt={listing.name} />

          {/* Sidebar slot: Add Services (multi-row, publish together) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Add Services
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Showcase what you offer — add as many as you like, then
                publish them together.
              </p>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-0.5">
              {serviceRows.map((row, index) => (
                <div
                  key={index}
                  className="relative rounded-xl border border-gray-100 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5F8B0A] uppercase tracking-wide">
                      Service {index + 1}
                    </span>
                    {serviceRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceRow(index)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Remove this service"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <Input
                    placeholder="e.g. Wedding Photography, Logo Design…"
                    value={row.name}
                    onChange={(e) =>
                      updateServiceRow(index, { name: e.target.value })
                    }
                    className="bg-white h-10"
                  />

                  <Textarea
                    placeholder="Describe what this service includes, pricing, turnaround time… (optional)"
                    rows={2}
                    value={row.description}
                    onChange={(e) =>
                      updateServiceRow(index, { description: e.target.value })
                    }
                    className="bg-white resize-none text-sm"
                  />

                  {row.imagePreview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden group border border-gray-200">
                      <Image
                        src={row.imagePreview}
                        alt="Service image preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateServiceRow(index, {
                            imageFile: null,
                            imagePreview: null,
                          })
                        }
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="relative border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-[#93C01F] hover:bg-[#93C01F]/5 transition-all cursor-pointer group"
                      onClick={() =>
                        rowFileInputRefs.current[index]?.click()
                      }
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleRowImageFile(index, e.dataTransfer.files);
                      }}
                    >
                      <UploadSimple className="w-5 h-5 text-gray-300 group-hover:text-[#93C01F] mx-auto mb-1.5 transition-colors" />
                      <p className="text-xs text-gray-500">
                        <span className="text-[#93C01F] font-medium">
                          Click to upload
                        </span>{" "}
                        or drag &amp; drop{" "}
                        <span className="text-gray-400">(optional)</span>
                      </p>
                    </div>
                  )}
                  <input
                    ref={(el) => {
                      rowFileInputRefs.current[index] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleRowImageFile(index, e.target.files)
                    }
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addServiceRow}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#93C01F] hover:text-[#93C01F] hover:bg-[#93C01F]/5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add another service
            </button>

            <Button
              className="w-full bg-[#93C01F] hover:bg-[#82ab1b]"
              onClick={handleAddServices}
              disabled={isSubmittingServices || validRowCount === 0}
            >
              {isSubmittingServices ? (
                <SpinnerGap className="w-4 h-4 animate-spin" />
              ) : validRowCount > 1 ? (
                `Publish ${validRowCount} Services`
              ) : (
                "Publish Service"
              )}
            </Button>
          </div>
        </div>

        {/* Right: title, stats, description, address & details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {listing.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className={`w-fit px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}
                >
                  {getStatusLabel(listing.status)}
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                  {listing.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
                title="Copy listing link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push(listingEdit(listing.type, listing.slug))}
                title="Edit listing"
              >
                <PencilSimple className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
                title="Delete listing"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-white">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#F4F9E8] text-[#5F8B0A]">
                <Eye className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 leading-none">
                  {listing.views.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">Views</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-white">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
                <BookmarkSimple className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 leading-none">
                  {listing.bookmarks.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">
                  Bookmarks
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-white">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-purple-50 text-purple-600">
                <Star className="w-4.5 h-4.5" weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 leading-none">
                  {listing.rating.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">Rating</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-white">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                <Star className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 leading-none">
                  {listing.ratingsCount}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">Reviews</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              About this listing
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed border border-gray-100">
              {listing.bio ? (
                <RichTextDisplay html={listing.bio} />
              ) : (
                <span className="text-gray-400">No description provided.</span>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              Address
            </h3>
            <InfoRow icon={MapPin} label="Location">
              {listing.location}
            </InfoRow>
            <InfoRow icon={Tag} label="Category">
              {listing.category}
            </InfoRow>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              Details
            </h3>
            <InfoRow icon={User} label="Account">
              <span className="inline-flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-[#93C01F]/10 text-[#5F8B0A] text-[10px] font-semibold">
                    {user ? getInitials(user.name || user.email || "U") : "U"}
                  </AvatarFallback>
                </Avatar>
                {user?.name || user?.email || "You"}
              </span>
            </InfoRow>
          </div>
        </div>
      </div>

      {/* Services list (full width) */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#93C01F]" /> Services
        </h3>
        {services.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all bg-white"
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
                        onClick={() => openEditService(service)}
                      >
                        <PencilSimple className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        onClick={() =>
                          service.slug && handleDeleteService(service.slug)
                        }
                        disabled={
                          isDeletingService &&
                          deletingServiceSlug === service.slug
                        }
                      >
                        {isDeletingService &&
                        deletingServiceSlug === service.slug ? (
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
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-gray-100 rounded-xl">
            <Briefcase className="w-9 h-9 text-gray-200 mb-3" />
            <p className="text-gray-600 text-sm font-medium">No services yet</p>
            <p className="text-gray-400 text-xs mt-1 text-center max-w-xs">
              Use the Add Services form above to showcase what you offer.
            </p>
          </div>
        )}
      </div>

      {/* Reviews (full width) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#93C01F]" /> Customer Reviews
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
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
            </div>
          )}
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
              Reviews from customers will appear here once they start coming
              in.
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
                  className="border border-gray-100 rounded-xl p-4 space-y-3 bg-white"
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
                        ? new Date(review.created_at).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
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
                            {new Date(
                              review.vendor_reply_at,
                            ).toLocaleDateString("en-GB", {
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

      {/* Edit Service Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Edit Service
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">
                Service Name <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g. Wedding Photography, Logo Design…"
                value={editData.name}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">
                Description
              </label>
              <Textarea
                placeholder="Describe what this service includes, pricing, turnaround time…"
                rows={3}
                value={editData.description}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, description: e.target.value }))
                }
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">
                  Image{" "}
                  <span className="text-gray-400 font-normal">
                    (Optional)
                  </span>
                </label>
                {editImagePreview && (
                  <button
                    type="button"
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    onClick={() => {
                      setEditImageFile(null);
                      setEditImagePreview(null);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {editImagePreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden group border border-gray-200">
                  <Image
                    src={editImagePreview}
                    alt="Service image preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div
                  className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#93C01F] hover:bg-[#93C01F]/5 transition-all cursor-pointer group"
                  onClick={() => editFileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error(
                        `"${file.name}" exceeds the 5 MB limit and was not added.`,
                      );
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setEditImageFile(file);
                      setEditImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
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
                    PNG, JPG, WEBP · up to 5 MB
                  </p>
                </div>
              )}
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error(
                      `"${file.name}" exceeds the 5 MB limit and was not added.`,
                    );
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setEditImageFile(file);
                    setEditImagePreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditOpen(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#93C01F] hover:bg-[#82ab1b]"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editData.name.trim()}
            >
              {isSavingEdit ? (
                <SpinnerGap className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{listing.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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
