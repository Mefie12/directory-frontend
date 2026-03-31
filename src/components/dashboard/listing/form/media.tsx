/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { useListing } from "@/context/listing-form-context";
import { FileUploader } from "@/components/dashboard/listing/media-uploader";
import { z } from "zod";

interface Props {
  listingType: "business" | "event" | "community";
  listingSlug: string;
}

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_GALLERY_IMAGES = 3;

const gallerySchema = z.array(z.any()).max(MAX_GALLERY_IMAGES, {
  message: `You can only upload a maximum of ${MAX_GALLERY_IMAGES} gallery items.`,
}).refine((files) => files.every((file) => !file.size || file.size <= MAX_FILE_SIZE_BYTES), {
  message: `Each file must be less than ${MAX_FILE_SIZE_MB}MB.`,
});

const coverSchema = z.any().refine((file) => !file || !file.size || file.size <= MAX_FILE_SIZE_BYTES, {
  message: `Cover media must be less than ${MAX_FILE_SIZE_MB}MB.`,
});

const shouldCompressImage = (file: File): boolean => {
  if (!file || !(file instanceof File) || !file.type.startsWith("image/")) return false;
  return file.size > 5 * 1024 * 1024;
};

const smartCompressImage = async (file: File): Promise<File> => {
  if (!shouldCompressImage(file)) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 1920;
        let width = img.width;
        let height = img.height;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          else { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg", lastModified: Date.now() }));
          } else { resolve(file); }
        }, "image/jpeg", 0.85);
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

export const MediaUploadStep = forwardRef<ListingFormHandle, Props>(
  ({ listingSlug }, ref) => {
    const { media, setMedia } = useListing();
    const [isUploading, setIsUploading] = useState(false);
    const replaceIdMap = useRef<Map<File, number>>(new Map());

    const validateMediaState = () => {
      const galleryResult = gallerySchema.safeParse(media.images);
      const coverResult = coverSchema.safeParse(media.coverPhoto);
      if (!galleryResult.success) { toast.error(galleryResult.error.issues[0].message); return false; }
      if (!coverResult.success) { toast.error(coverResult.error.issues[0].message); return false; }
      return true;
    };

    const uploadWithChunking = async () => {
      if (!media.coverPhoto && media.images.length === 0) return true;
      if (!validateMediaState()) return false;

      try {
        setIsUploading(true);
        const token = localStorage.getItem("authToken");

        // Positional array: [cover, gallery0, gallery1, ...]
        const positions: any[] = [media.coverPhoto, ...media.images];
        const toUpdate: { id: number; file: File; pos: number }[] = [];
        const toCreate: { file: File; pos: number }[] = [];

        positions.forEach((item, pos) => {
          if (!item || !(item instanceof File)) return;
          const replaceId = replaceIdMap.current.get(item);
          if (replaceId) {
            toUpdate.push({ id: replaceId, file: item, pos });
          } else {
            toCreate.push({ file: item, pos });
          }
        });

        if (toUpdate.length === 0 && toCreate.length === 0) return true;

        toast.loading("Preparing files...");
        const newPositions = [...positions];

        // 1. PATCH: update existing media records with replacement files
        for (let i = 0; i < toUpdate.length; i++) {
          const { id, file, pos } = toUpdate[i];
          toast.loading(`Updating media ${i + 1} of ${toUpdate.length}...`);
          const optimized = await smartCompressImage(file);
          const formData = new FormData();
          formData.append("media_id", id.toString());
          formData.append("media", optimized);

          const response = await fetch(
            `/api/listing/${listingSlug}/media_update`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
              body: formData,
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Update failed for media ${i + 1}`);
          }

          const result = await response.json();
          const serverItem = result?.data || result;
          if (serverItem?.id) newPositions[pos] = serverItem;
        }

        // 2. POST: upload brand-new files
        for (let i = 0; i < toCreate.length; i++) {
          const { file, pos } = toCreate[i];
          toast.loading(`Uploading file ${i + 1} of ${toCreate.length}...`);
          const optimized = await smartCompressImage(file);
          const formData = new FormData();
          formData.append("media[]", optimized);
          formData.append("upload_strategy", "chunked");
          formData.append("chunk_index", (i + 1).toString());
          formData.append("total_chunks", toCreate.length.toString());

          const response = await fetch(
            `/api/listing/${listingSlug}/media`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
              body: formData,
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `File ${i + 1} failed to upload`);
          }

          const result = await response.json();
          const serverItem = result?.data?.[0] || result?.data || result;
          if (serverItem?.id) newPositions[pos] = serverItem;
        }

        // Update context with server objects so media persists across step navigation
        replaceIdMap.current.clear();
        setMedia({
          coverPhoto: newPositions[0] || null,
          images: newPositions.slice(1).filter(Boolean),
        });

        toast.success("Media synced successfully!");
        return true;
      } catch (error: any) {
        toast.error(error.message || "Media upload failed");
        return false;
      } finally {
        setIsUploading(false);
        toast.dismiss();
      }
    };

    useImperativeHandle(ref, () => ({
      async submit() {
        if (!validateMediaState()) return false;
        if (media.coverPhoto || media.images.length > 0) {
          const success = await uploadWithChunking();
          if (!success) return false;
        }
        return true;
      },
    }));

    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Media Upload</h2>
          <p className="text-sm text-muted-foreground">The first file will be your cover.</p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Cover Media</h3>
            <FileUploader
              label=""
              multiple={false}
              files={media.coverPhoto ? [media.coverPhoto] : []}
              onChange={(files) => {
                const newItem = files[0] || null;
                if (newItem instanceof File && media.coverPhoto && !(media.coverPhoto instanceof File) && media.coverPhoto.id) {
                  replaceIdMap.current.set(newItem, media.coverPhoto.id);
                }
                setMedia({ ...media, coverPhoto: newItem });
              }}
              accept="image/jpeg,image/jpg,image/webp,video/mp4"
              maxSize={MAX_FILE_SIZE_BYTES}
            />
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Gallery Media</h3>
            <FileUploader
              label=""
              files={media.images}
              onChange={(files) => {
                const result = gallerySchema.safeParse(files);
                if (!result.success) {
                  toast.error(result.error.issues[0].message);
                  if (files.length > MAX_GALLERY_IMAGES) setMedia({ ...media, images: files.slice(0, MAX_GALLERY_IMAGES) });
                } else { setMedia({ ...media, images: files }); }
              }}
              multiple={true}
              maxFiles={3}
              accept="image/jpeg,image/jpg,image/webp"
              maxSize={MAX_FILE_SIZE_BYTES}
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Total Files:</span>
              <span
                className={
                  isUploading ? "animate-pulse text-blue-600" : "text-gray-600"
                }
              >
                {[media.coverPhoto, ...media.images].filter(Boolean).length}/4
                {isUploading ? " Uploading..." : " Ready to upload"}
              </span>
            </div>
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full animate-progress w-full origin-left"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

MediaUploadStep.displayName = "MediaUploadStep";
