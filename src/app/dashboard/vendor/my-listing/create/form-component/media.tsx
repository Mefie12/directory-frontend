"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListing } from "@/context/listing-form-context";
import { FileUploader } from "@/components/dashboard/listing/media-uploader";

type MediaUploadStepProps = {
  listingType: "business" | "event" | "community";
  listingSlug: string; // Required to know where to upload files
  onComplete: () => void;
  onBack: () => void;
};

export function MediaUploadStep({
  listingType,
  // listingSlug,
  onComplete,
  onBack,
}: MediaUploadStepProps) {
  const { media, setMedia } = useListing();
  const [isSaving, setIsSaving] = useState(false);

  // --- API Submission Handler ---
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 1. Basic Validation
      // if (!listingSlug) {
      //   throw new Error("Listing slug is missing. Please restart the process.");
      // }

      // Optional: Enforce at least a cover photo
      if (!media.coverPhoto) {
        toast.error("Cover Photo Required", {
          description: "Please upload a cover photo before continuing.",
        });
        setIsSaving(false);
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authentication required");

      // 2. Prepare FormData (Required for File Uploads)
      const formData = new FormData();
      
      // Append Cover Photo
      if (media.coverPhoto) {
        formData.append("cover_image", media.coverPhoto);
      }

      // Append Gallery Images (Looping through the array)
      if (media.images && media.images.length > 0) {
        media.images.forEach((file) => {
          // 'gallery[]' naming convention depends on your backend (Laravel usually accepts array syntax)
          formData.append("gallery[]", file); 
        });
      }

      const API_URL = process.env.API_URL || "https://me-fie.co.uk";
      const endpoint = `${API_URL}/api/listing/{listing_slug}/media`; // listingId is the slug

      // 3. Send Request
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          // NOTE: Do NOT set "Content-Type": "multipart/form-data" manually.
          // The browser sets it automatically with the correct boundary for FormData.
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload media");
      }

      toast.success("Media uploaded successfully");
      onComplete();

    } catch (error) {
      console.error("Upload Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload media"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-0.5 lg:p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Media Upload</h2>
        <p className="text-sm text-muted-foreground">
          {listingType === "business"
            ? "Upload your business images and cover photo"
            : "Upload event flyers and promotional images"}
        </p>
      </div>

      <div className="space-y-8">
        {/* Cover Photo Uploader */}
        <FileUploader
          label={
            listingType === "business" ? "Cover Photo *" : "Main Event Flyer *"
          }
          multiple={false}
          // Wrap single file in array for display, unwrap for state
          files={media.coverPhoto ? [media.coverPhoto] : []}
          onChange={(files) =>
            setMedia({ ...media, coverPhoto: files[0] || null })
          }
          emptyText={
            listingType === "business"
              ? "No cover photo uploaded"
              : "No event flyer uploaded"
          }
        />

        {/* Gallery Uploader */}
        <FileUploader
          label={
            listingType === "business" ? "Gallery Images" : "Event Gallery"
          }
          multiple
          files={media.images}
          onChange={(files) => setMedia({ ...media, images: files })}
          emptyText="No additional images uploaded yet"
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-100 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        
        <Button
          onClick={handleSave}
          className="bg-[#93C01F] text-white hover:bg-[#82ab1b]"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              Save & Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}