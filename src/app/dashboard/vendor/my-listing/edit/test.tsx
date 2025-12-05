"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  MapPin,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

// --- Types ---
interface ListingFormData {
  // Basic Info
  name: string;
  bio: string;
  type: string;
  primary_phone: string;
  secondary_phone: string;
  email: string;
  website: string;
  business_reg_num: string;
  // Address
  address: string;
  country: string;
  city: string;
  google_plus_code: string;
  // Socials
  facebook: string;
  twitter: string;
  instagram: string;
  tiktok: string;
  youtube: string;
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  // Ensure slug is a string (handle array case if catch-all route)
  const slug = Array.isArray(params.slug)
    ? params.slug[0]
    : params.slug || "harborview-bistro";

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [listingId, setListingId] = useState<string | number | null>(null); // Needed for socials endpoint

  // Unified Form State
  const [formData, setFormData] = useState<ListingFormData>({
    name: "",
    bio: "",
    type: "business",
    primary_phone: "",
    secondary_phone: "",
    email: "",
    website: "",
    business_reg_num: "",
    address: "",
    country: "",
    city: "",
    google_plus_code: "",
    facebook: "",
    twitter: "",
    instagram: "",
    tiktok: "",
    youtube: "",
  });

  // Images State (Mocked for now as no upload API was provided)
  const [images, setImages] = useState<string[]>([
    "/images/placeholders/restaurant-1.jpg",
  ]);
  const [coverPhoto] = useState("/images/placeholders/restaurant-cover.jpg");

  // --- 1. Fetch Initial Data ---
  useEffect(() => {
    const fetchListingData = async () => {
      setIsLoading(true);
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // Assuming GET endpoint mirrors the PUT structure or returns a unified object
        const response = await fetch(`${API_URL}/api/listing/${slug}`);

        if (!response.ok) throw new Error("Failed to load listing");

        const data = await response.json();
        const listing = data.data || data; // Adjust based on actual GET response

        setListingId(listing.id); // Store ID for social updates

        // Populate Form
        setFormData({
          name: listing.name || "",
          bio: listing.bio || "",
          type: listing.type || "business",
          primary_phone: listing.primary_phone || "",
          secondary_phone: listing.secondary_phone || "",
          email: listing.email || "",
          website: listing.website || "",
          business_reg_num: listing.business_reg_num || "",
          address: listing.address || "",
          country: listing.country || "",
          city: listing.city || "",
          google_plus_code: listing.google_plus_code || "",
          facebook: listing.socials?.facebook || "",
          twitter: listing.socials?.twitter || "",
          instagram: listing.socials?.instagram || "",
          tiktok: listing.socials?.tiktok || "",
          youtube: listing.socials?.youtube || "",
        });
      } catch (error) {
        console.error(error);
        toast.error("Could not load listing details");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchListingData();
  }, [slug]);

  // --- 2. Handle Input Changes ---
  const handleInputChange = (field: keyof ListingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- 3. Save Logic (The Orchestrator) ---
  const handleSave = async () => {
    setIsSaving(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      // "Authorization": `Bearer ${token}` // Add token if needed
    };

    try {
      // We must fire 3 separate requests as per the API structure
      const promises = [];

      // 1. Update Basic Info
      const basicBody = {
        name: formData.name,
        bio: formData.bio,
        primary_phone: formData.primary_phone,
        secondary_phone: formData.secondary_phone,
        email: formData.email,
        website: formData.website,
        business_reg_num: formData.business_reg_num,
        type: formData.type,
      };
      promises.push(
        fetch(`${API_URL}/api/listing/${slug}/update`, {
          method: "PUT",
          headers,
          body: JSON.stringify(basicBody),
        }).then((res) => {
          if (!res.ok) throw new Error("Basic info failed");
        })
      );

      // 2. Update Address
      const addressBody = {
        address: formData.address,
        country: formData.country,
        city: formData.city,
        google_plus_code: formData.google_plus_code,
      };
      promises.push(
        fetch(`${API_URL}/api/listing/${slug}/address`, {
          method: "PUT",
          headers,
          body: JSON.stringify(addressBody),
        }).then((res) => {
          if (!res.ok) throw new Error("Address failed");
        })
      );

      // 3. Update Socials (Only if we have an ID)
      if (listingId) {
        const socialsBody = {
          facebook: formData.facebook,
          twitter: formData.twitter,
          instagram: formData.instagram,
          tiktok: formData.tiktok,
          youtube: formData.youtube,
        };
        promises.push(
          fetch(`${API_URL}/api/listing/socials/${listingId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(socialsBody),
          }).then((res) => {
            if (!res.ok) throw new Error("Socials failed");
          })
        );
      }

      // Wait for all to finish
      await Promise.all(promises);

      toast.success("Listing updated successfully");
      router.push("/dashboard/vendor/my-listing"); // Redirect after success
    } catch (error) {
      console.error(error);
      toast.error("Failed to update listing. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            Edit Listing: {formData.name || slug}
          </h1>
          <p className="text-sm text-gray-500">
            Update your business details and media
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-8">
        {/* --- SECTION 1: BASIC INFO --- */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium border-b pb-2">
            Basic Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter business name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(val) => handleInputChange("type", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <Input
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio / Description
            </label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about your business..."
              className="h-24 resize-none"
            />
          </div>
        </div>

        {/* --- SECTION 2: CONTACT & ADDRESS --- */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium border-b pb-2">
            Location & Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Phone
              </label>
              <Input
                value={formData.primary_phone}
                onChange={(e) =>
                  handleInputChange("primary_phone", e.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <div className="relative">
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="pr-10"
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <Input
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Plus Code
              </label>
              <Input
                value={formData.google_plus_code}
                onChange={(e) =>
                  handleInputChange("google_plus_code", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* --- SECTION 3: SOCIAL MEDIA --- */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium border-b pb-2">Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              placeholder="Facebook URL"
              value={formData.facebook}
              onChange={(e) => handleInputChange("facebook", e.target.value)}
            />
            <Input
              placeholder="Twitter URL"
              value={formData.twitter}
              onChange={(e) => handleInputChange("twitter", e.target.value)}
            />
            <Input
              placeholder="Instagram URL"
              value={formData.instagram}
              onChange={(e) => handleInputChange("instagram", e.target.value)}
            />
            <Input
              placeholder="TikTok URL"
              value={formData.tiktok}
              onChange={(e) => handleInputChange("tiktok", e.target.value)}
            />
          </div>
        </div>

        {/* --- SECTION 4: MEDIA (UI Only - No upload API provided) --- */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium border-b pb-2">Media</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gallery Images
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop files here
                </p>
                <Button variant="secondary" size="sm" type="button">
                  Choose files
                </Button>
              </div>
            </div>
            <div className="flex gap-4 mt-4 flex-wrap">
              {images.map((src, index) => (
                <div
                  key={index}
                  className="relative w-24 h-16 rounded-lg overflow-hidden group"
                >
                  <Image src={src} alt="Upload" fill className="object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      setImages(images.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Photo
            </label>
            <div className="relative w-full h-48 rounded-lg overflow-hidden group bg-gray-100">
              <Image
                src={coverPhoto}
                alt="Cover"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <Button variant="secondary" size="sm" type="button">
                  Change Cover <ImageIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            className="bg-[#93C01F] hover:bg-[#7ea919] text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
