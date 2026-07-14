/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { ListingImageGallery } from "@/components/dashboard/listing/listing-image-gallery";
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
  ChevronLeft,
  User,
  MapPin,
  Tag,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  MessageCircle,
  Calendar,
  Clock,
  Ticket,
  Briefcase,
  Eye,
  Bookmark,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";

// --- Types ---
interface OpeningHour {
  day_of_week: string;
  open_time: string;
  close_time: string;
}
interface ServiceItem {
  slug: string;
  name: string;
  image?: string | null;
  description?: string | null;
}
interface EventInfo {
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  venue_address?: string | null;
  city?: string | null;
  country?: string | null;
  price?: string | number | null;
  currency?: string | null;
  location_type?: string | null;
}
interface ListingDetail {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  vendorAvatar?: string;
  category: string;
  location: string;
  type: string;
  approval: "Approved" | "Pending" | "Rejected" | "Suspended";
  image: string;
  images: string[];
  plan: string;
  description: string; // HTML (from `bio`)
  verified: boolean;
  businessRegNum?: string | null;
  claimStatus?: string | null;
  statusReason?: string | null;
  stats: {
    views: number;
    uniqueVisitors: number;
    bookmarks: number;
    rating: number;
    ratingsCount: number;
  };
  event?: EventInfo;
  services: ServiceItem[];
  openingHours: OpeningHour[];
  userInfo?: { name: string; email?: string };
  contactInfo: {
    phone?: string;
    secondaryPhone?: string;
    email?: string;
    website?: string;
    socials?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
      whatsapp?: string;
    };
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const getImageUrl = (url: string | undefined): string => {
  if (!url) return "/images/no-image.jpg";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}/${url.replace(/^\//, "")}`;
};

// Maps a raw single-listing payload into the shape this page renders.
const mapListing = (item: any): ListingDetail => {
  let vendorName = "Unknown Vendor";
  let userInfo: { name: string; email?: string } | undefined;
  if (item.user) {
    if (item.user.first_name && item.user.last_name) {
      vendorName = `${item.user.first_name} ${item.user.last_name}`;
    } else if (item.user.name) {
      vendorName = item.user.name;
    } else if (item.user.email) {
      vendorName = item.user.email.split("@")[0];
    }
    userInfo = { name: vendorName, email: item.user.email };
  } else if (item.vendor || item.business_name) {
    vendorName = item.vendor || item.business_name;
  }

  const images: string[] = Array.isArray(item.images)
    ? item.images
        .filter((img: any) => !!(img.original || img))
        .map((img: any) => getImageUrl(img.original || img))
    : [];
  const image =
    images[0] || getImageUrl(item.image || item.thumbnail) || "/images/no-image.jpg";

  let category = "General";
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    const mains = item.categories.filter(
      (c: any) => c.parent_slug == null || c.type === "mainCategory",
    );
    category = (mains.length > 0 ? mains : item.categories)
      .map((c: any) => c.name)
      .join(", ");
  } else if (item.category) {
    category = item.category;
  }

  let location = "";
  if (item.city && item.country) location = `${item.city}, ${item.country}`;
  else if (item.address) location = item.address;
  else if (item.country) location = item.country;
  else if (item.location) location = item.location;

  const rawStatus = (item.status || "pending").toLowerCase();
  let approval: ListingDetail["approval"] = "Pending";
  if (rawStatus === "approved" || rawStatus === "published") approval = "Approved";
  else if (rawStatus === "rejected") approval = "Rejected";
  else if (rawStatus === "suspended") approval = "Suspended";

  const socials = Array.isArray(item.socials)
    ? item.socials[0] || {}
    : item.socials || {};

  const services: ServiceItem[] = Array.isArray(item.services)
    ? item.services.map((s: any) => ({
        slug: s.slug,
        name: s.name,
        image: s.image ? getImageUrl(s.image) : null,
        description: s.description,
      }))
    : [];

  const openingHours: OpeningHour[] = Array.isArray(item.opening_hours)
    ? item.opening_hours.map((h: any) => ({
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
      }))
    : [];

  const event: EventInfo | undefined =
    item.type === "event"
      ? {
          start_date: item.event_start_date,
          end_date: item.event_end_date,
          start_time: item.event_start_time,
          end_time: item.event_end_time,
          venue: item.event_venue,
          venue_address: item.event_venue_address,
          city: item.event_city,
          country: item.event_country,
          price: item.event_price,
          currency: item.event_currency,
          location_type: item.event_location_type,
        }
      : undefined;

  return {
    id: item.id?.toString() || "",
    slug: item.slug || item.id?.toString() || "",
    name: item.name || item.title || "Untitled Listing",
    vendor: vendorName,
    vendorAvatar: item.vendorAvatar || item.vendor_image || "",
    category,
    location,
    type: item.type || "business",
    approval,
    image,
    images: images.length > 0 ? images : image ? [image] : [],
    plan: item.plan || "Basic",
    description: item.bio || item.description || "",
    verified: !!(item.listing_verified ?? item.is_verified),
    businessRegNum: item.business_reg_num,
    claimStatus: item.claim_status,
    statusReason: item.status_reason,
    stats: {
      views: item.views_count ?? 0,
      uniqueVisitors: item.unique_visitors_count ?? 0,
      bookmarks: item.bookmarks_count ?? 0,
      rating: item.rating ?? 0,
      ratingsCount: item.ratings_count ?? 0,
    },
    event,
    services,
    openingHours,
    userInfo,
    contactInfo: {
      phone: item.primary_phone,
      secondaryPhone: item.secondary_phone,
      email: item.email,
      website: item.website,
      socials: {
        facebook: socials?.facebook,
        instagram: socials?.instagram,
        twitter: socials?.twitter,
        tiktok: socials?.tiktok,
        youtube: socials?.youtube,
        whatsapp: socials?.whatsapp,
      },
    },
  };
};

const getStatusColor = (status: string) => {
  if (status === "Approved") return "bg-[#E9F5D6] text-[#5F8B0A]";
  if (status === "Pending") return "bg-yellow-100 text-yellow-700";
  if (status === "Suspended") return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-800";
};

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href?: string;
  icon: any;
  label: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#93C01F] transition-colors p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
    >
      <Icon className="w-4 h-4" />
      <span className="truncate max-w-[150px]">{label}</span>
    </a>
  );
}

// Compact key/value row used inside the Address & Details cards.
function InfoRow({
  icon: Icon,
  label,
  children,
}: {
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

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug);
  const { loading: authLoading } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingVerify, setPendingVerify] = useState<boolean | null>(null);

  const loadListing = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/listing/${slug}/show`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load listing");
      const json = await res.json();
      const raw = json.data || json.listing || json;
      const mapped = mapListing(raw);
      setListing(mapped);
      setIsVerified(mapped.verified);
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [slug, authLoading]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const handleStatusUpdate = async (
    newStatus: "approved" | "rejected" | "suspended",
  ) => {
    if (!listing) return;
    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/listing/${listing.slug}/update_status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update status");
      }
      const uiStatus =
        newStatus === "approved"
          ? "Approved"
          : newStatus === "rejected"
            ? "Rejected"
            : "Suspended";
      setListing((prev) => (prev ? { ...prev, approval: uiStatus } : prev));
      toast.success(`Listing ${newStatus}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!listing) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/listing/${listing.slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete listing");
      toast.success("Listing deleted successfully");
      router.push("/dashboard/listings");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete listing");
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  const handleVerifyConfirm = async () => {
    if (!listing || pendingVerify === null) return;
    const value = pendingVerify;
    setPendingVerify(null);
    setIsVerifying(true);
    setIsVerified(value);
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/listing/${listing.slug}/verify_listing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listing_verified: value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to update verification");
      }
      setListing((prev) => (prev ? { ...prev, verified: value } : prev));
      toast.success(value ? "Listing verified successfully" : "Verification removed");
    } catch (error) {
      setIsVerified(!value);
      toast.error(error instanceof Error ? error.message : "Failed to update verification");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading listing...
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => router.push("/dashboard/listings")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Listings
        </button>
        <div className="text-center py-20 text-gray-400">
          Listing not found.
        </div>
      </div>
    );
  }

  const s = listing.contactInfo.socials || {};
  const hasSocials = !!(
    s.facebook ||
    s.instagram ||
    s.twitter ||
    s.tiktok ||
    s.youtube ||
    s.whatsapp
  );
  const website = listing.contactInfo.website;
  const websiteLabel = website
    ? website.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "";
  const ev = listing.event;
  const hasEventInfo = !!(
    ev &&
    (ev.start_date ||
      ev.end_date ||
      ev.start_time ||
      ev.venue ||
      ev.venue_address ||
      ev.city ||
      ev.country ||
      ev.price != null ||
      ev.location_type)
  );

  const statTiles = [
    {
      icon: Eye,
      label: "Views",
      value: listing.stats.views.toLocaleString(),
      tint: "bg-[#F4F9E8] text-[#5F8B0A]",
    },
    {
      icon: User,
      label: "Unique visitors",
      value: listing.stats.uniqueVisitors.toLocaleString(),
      tint: "bg-blue-50 text-blue-600",
    },
    {
      icon: Bookmark,
      label: "Bookmarks",
      value: listing.stats.bookmarks.toLocaleString(),
      tint: "bg-amber-50 text-amber-600",
    },
    {
      icon: Star,
      label: `Rating (${listing.stats.ratingsCount})`,
      value: String(listing.stats.rating),
      tint: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="p-2 lg:p-6 max-w-6xl mx-auto space-y-8">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/listings")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Listings
      </button>

      {/* Hero: image gallery (left) + info column (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: carousel + action card */}
        <div className="lg:col-span-3 space-y-5">
          <ListingImageGallery
            images={listing.images}
            alt={listing.name}
            verified={isVerified}
          />

          {/* Sidebar slot: moderation actions + verify toggle */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-3">
                Manage Listing
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isUpdatingStatus}
                  className="bg-[#93C01F] hover:bg-[#7ea919] text-white gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("suspended")}
                  disabled={isUpdatingStatus}
                  variant="outline"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50 gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" /> Suspend
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isUpdatingStatus}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
                <Button
                  onClick={() => setShowDelete(true)}
                  disabled={isUpdatingStatus}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-gray-900">
                  Verify Listing
                </Label>
                <p className="text-xs text-gray-500">
                  Show a verified badge on this listing
                </p>
              </div>
              <Switch
                checked={pendingVerify !== null ? pendingVerify : isVerified}
                onCheckedChange={(checked) => setPendingVerify(checked)}
                disabled={isVerifying}
                className="data-[state=checked]:bg-[#93C01F]"
              />
            </div>
          </div>
        </div>

        {/* Right: title, stats, description, address & details */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-1.5">
              {listing.name}
              {isVerified && (
                <Image
                  src="/images/icons/verify.svg"
                  alt="Verified"
                  width={20}
                  height={20}
                />
              )}
            </h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                  listing.approval,
                )}`}
              >
                {listing.approval}
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                {listing.type}
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#548235]/10 text-[#548235]">
                {listing.plan || "Basic"} plan
              </span>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3">
            {statTiles.map((tile) => (
              <div
                key={tile.label}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 bg-white"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tile.tint}`}
                >
                  <tile.icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900 leading-none">
                    {tile.value}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {tile.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              Description
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed border border-gray-100">
              {listing.description ? (
                <RichTextDisplay html={listing.description} />
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
              {listing.location || "—"}
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
            <InfoRow icon={User} label="Vendor">
              <span className="inline-flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={listing.vendorAvatar}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(listing.vendor)}
                  </AvatarFallback>
                </Avatar>
                {listing.vendor}
              </span>
            </InfoRow>
            {listing.userInfo && (
              <InfoRow icon={User} label="Owner">
                {listing.userInfo.name}
              </InfoRow>
            )}
            {listing.contactInfo.phone && (
              <InfoRow icon={Phone} label="Phone">
                {listing.contactInfo.phone}
              </InfoRow>
            )}
            {listing.contactInfo.secondaryPhone && (
              <InfoRow icon={Phone} label="Secondary phone">
                {listing.contactInfo.secondaryPhone}
              </InfoRow>
            )}
            {listing.contactInfo.email && (
              <InfoRow icon={Mail} label="Email">
                {listing.contactInfo.email}
              </InfoRow>
            )}
            {website && (
              <InfoRow icon={Globe} label="Website">
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {websiteLabel}
                </a>
              </InfoRow>
            )}
            {listing.businessRegNum && (
              <InfoRow icon={Briefcase} label="Business reg. no.">
                {listing.businessRegNum}
              </InfoRow>
            )}
            {listing.claimStatus && (
              <InfoRow icon={CheckCircle2} label="Claim status">
                <span className="capitalize">{listing.claimStatus}</span>
              </InfoRow>
            )}
          </div>
        </div>
      </div>

      {/* Event / Ticketing (events only) */}
      {listing.type === "event" && hasEventInfo && ev && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#93C01F]" /> Event & Ticketing
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 bg-[#F4F9E8]/40 p-4 rounded-lg border border-[#93C01F]/20">
            {(ev.start_date || ev.end_date) && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {ev.start_date}
                  {ev.end_date ? ` – ${ev.end_date}` : ""}
                </span>
              </div>
            )}
            {(ev.start_time || ev.end_time) && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {ev.start_time}
                  {ev.end_time ? ` – ${ev.end_time}` : ""}
                </span>
              </div>
            )}
            {(ev.venue || ev.venue_address || ev.city || ev.country) && (
              <div className="flex items-center gap-2 text-sm sm:col-span-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {[ev.venue, ev.venue_address, ev.city, ev.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
            {ev.location_type && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 capitalize">
                  {ev.location_type}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Ticket className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {ev.price != null && ev.price !== ""
                  ? `${ev.currency ? `${ev.currency} ` : ""}${ev.price}`
                  : "Free / not specified"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Services */}
      {listing.services.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#93C01F]" /> Services
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {listing.services.map((svc) => (
              <div
                key={svc.slug}
                className="flex gap-3 p-3 border border-gray-100 rounded-lg bg-white"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                  {svc.image ? (
                    <Image
                      src={svc.image}
                      alt={svc.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{svc.name}</p>
                  {svc.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {svc.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opening Hours */}
      {listing.openingHours.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#93C01F]" /> Opening Hours
          </h3>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg max-w-md">
            {listing.openingHours.map((h) => (
              <div
                key={h.day_of_week}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-gray-700">{h.day_of_week}</span>
                <span className="text-gray-500">
                  {h.open_time?.slice(0, 5)} – {h.close_time?.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Socials — only when at least one exists */}
      {hasSocials && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Social Links</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-xl">
            <SocialLink href={s.facebook} icon={Facebook} label="Facebook" />
            <SocialLink href={s.instagram} icon={Instagram} label="Instagram" />
            <SocialLink href={s.twitter} icon={Twitter} label="Twitter" />
            <SocialLink href={s.tiktok} icon={Music2} label="TikTok" />
            <SocialLink href={s.youtube} icon={Youtube} label="YouTube" />
            <SocialLink href={s.whatsapp} icon={MessageCircle} label="WhatsApp" />
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={(o) => !o && setShowDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{listing.name}</strong> and remove its data from the
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Listing"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify confirmation */}
      <AlertDialog
        open={pendingVerify !== null}
        onOpenChange={(o) => !o && setPendingVerify(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingVerify ? "Verify this listing?" : "Remove verification?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingVerify
                ? `This will mark "${listing.name}" as a verified listing. A verification badge will appear on its public card.`
                : `This will remove the verification badge from "${listing.name}". The listing will remain approved and visible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingVerify(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerifyConfirm}
              className={
                pendingVerify
                  ? "bg-[#93C01F] hover:bg-[#7ea919]"
                  : "bg-orange-500 hover:bg-orange-600"
              }
            >
              {pendingVerify ? "Yes, verify listing" : "Yes, remove verification"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
