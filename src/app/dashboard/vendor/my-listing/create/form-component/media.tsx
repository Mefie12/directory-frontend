"use client";

import { forwardRef, useImperativeHandle } from "react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";
import { useListing } from "@/context/listing-form-context";
import { FileUploader } from "@/components/dashboard/listing/media-uploader";

interface Props {
  listingType: "business" | "event" | "community";
  listingSlug: string;
}

export const MediaUploadStep = forwardRef<ListingFormHandle, Props>(
  ({ listingType, listingSlug }, ref) => {
    const { media, setMedia } = useListing(); 

    useImperativeHandle(ref, () => ({
      async submit() {
        if (!media.coverPhoto) {
          toast.error("Cover photo is required");
          return false;
        }
        
        try {
            const token = localStorage.getItem("authToken");
            const API_URL = process.env.API_URL || "https://me-fie.co.uk";
            const endpoint = `${API_URL}/api/listing/${listingSlug}/media`;

            const formData = new FormData();
            formData.append("cover_image", media.coverPhoto);
            
            media.images.forEach((file) => {
                 formData.append("gallery[]", file);
            });

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                },
                body: formData,
            });

            if (!response.ok) throw new Error("Media upload failed");
            return true;

        } catch (error) {
            // Removed unused 'e' and used 'error'
            console.error(error);
            toast.error("Media upload failed");
            return false;
        }
      }
    }));

    return (
      <div className="p-6 space-y-6">
         <div>
            <h2 className="text-xl font-semibold mb-1">Media Upload</h2>
            <p className="text-sm text-muted-foreground">Upload images for your {listingType}</p>
         </div>
         <FileUploader 
            label="Cover Photo" 
            multiple={false}
            files={media.coverPhoto ? [media.coverPhoto] : []}
            onChange={(f) => setMedia({...media, coverPhoto: f[0]})} 
            emptyText="No cover photo"
         />
         <FileUploader 
            label="Gallery" 
            files={media.images} 
            onChange={(f) => setMedia({...media, images: f})} 
            multiple={true}
            emptyText="No gallery images"
         />
      </div>
    );
  }
);

MediaUploadStep.displayName = "MediaUploadStep";