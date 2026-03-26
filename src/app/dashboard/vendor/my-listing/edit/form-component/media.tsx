/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";
import { useListing } from "@/context/listing-form-context";
import { FileUploader } from "@/components/dashboard/listing/media-uploader";
import { z } from "zod";

interface Props {
  listingType: "business" | "event" | "community";
  listingSlug: string;
  listingId?: number | string;
}

// --- Configuration ---
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_GALLERY_IMAGES = 3;

// --- Zod Validation Schemas ---
const gallerySchema = z
  .array(z.any())
  .max(MAX_GALLERY_IMAGES, {
    message: `Gallery is limited to a maximum of ${MAX_GALLERY_IMAGES} items.`,
  })
  .refine(
    (files) =>
      files.every(
        (file) => !(file instanceof File) || file.size <= MAX_FILE_SIZE_BYTES,
      ),
    { message: `New gallery files must be less than ${MAX_FILE_SIZE_MB}MB.` },
  );

const coverSchema = z
  .any()
  .refine(
    (file) => !(file instanceof File) || file.size <= MAX_FILE_SIZE_BYTES,
    { message: `Cover media must be less than ${MAX_FILE_SIZE_MB}MB.` },
  );

// Helper to check if we need compression
const shouldCompressImage = (file: any): boolean => {
  if (!file || !(file instanceof File)) return false;
  if (!file.type.startsWith("image/")) return false;
  return file.size > 10 * 1024 * 1024;
};

// Smart compression logic
const smartCompressImage = async (file: any): Promise<any> => {
  if (!file || !(file instanceof File) || !shouldCompressImage(file)) {
    return file;
  }

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
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, ".jpg"),
                { type: "image/jpeg", lastModified: Date.now() },
              );
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.85,
        );
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

    // --- Validation Wrapper ---
    const validateMediaState = () => {
      const galleryResult = gallerySchema.safeParse(media.images);
      const coverResult = coverSchema.safeParse(media.coverPhoto);

      if (!galleryResult.success) {
        toast.error(galleryResult.error.issues[0].message);
        return false;
      }
      if (!coverResult.success) {
        toast.error(coverResult.error.issues[0].message);
        return false;
      }
      return true;
    };

    const uploadWithChunking = async () => {
      if (!validateMediaState()) return false;

      const hasNewCover = media.coverPhoto instanceof File;
      const newFilesCount = media.images.filter(
        (f) => f instanceof File,
      ).length;

      if (!hasNewCover && newFilesCount === 0) return true;

      try {
        setIsUploading(true);
        const token = localStorage.getItem("authToken");
        const API_URL = process.env.API_URL || "https://me-fie.co.uk";

        const allFiles: any[] = [media.coverPhoto, ...media.images];
        const newFiles = allFiles.filter(
          (file) => file instanceof File,
        ) as File[];

        toast.loading("Optimizing files...");
        const optimizedFiles = await Promise.all(
          newFiles.map(smartCompressImage),
        );

        const attemptBulkUpload = async (files: File[]): Promise<boolean> => {
          try {
            toast.loading(`Uploading ${files.length} file(s)...`);
            const formData = new FormData();
            files.forEach((file) => formData.append("media[]", file));
            formData.append("upload_strategy", "bulk");
            formData.append("total_files", files.length.toString());

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(
              `${API_URL}/api/listing/${listingSlug}/media`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                },
                body: formData,
                signal: controller.signal,
              },
            );

            clearTimeout(timeoutId);
            return response.ok;
          } catch {
            return false;
          }
        };

        const uploadChunked = async (files: File[]): Promise<boolean> => {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            toast.loading(`Uploading file ${i + 1} of ${files.length}...`);
            const formData = new FormData();
            formData.append("media[]", file);
            formData.append("upload_strategy", "chunked");
            formData.append("chunk_index", (i + 1).toString());
            formData.append("total_chunks", files.length.toString());

            const response = await fetch(
              `${API_URL}/api/listing/${listingSlug}/media`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                },
                body: formData,
              },
            );

            if (!response.ok) return false;
          }
          return true;
        };

        const bulkSuccess = await attemptBulkUpload(optimizedFiles);
        if (!bulkSuccess) {
          toast.info("Large files detected. Using chunked upload...");
          const chunkedSuccess = await uploadChunked(optimizedFiles);
          if (!chunkedSuccess) throw new Error("Upload failed.");
        }

        toast.success("Media uploaded successfully!");
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
        return false;
      } finally {
        setIsUploading(false);
        toast.dismiss();
      }
    };

    useImperativeHandle(ref, () => ({
      async submit() {
        if (!validateMediaState()) return false;

        const hasNewMedia =
          media.coverPhoto instanceof File ||
          media.images.some((f: any) => f instanceof File);

        if (hasNewMedia) {
          uploadWithChunking().then((success) => {
            if (!success) console.error("Background upload failed");
          });
        }
        return true;
      },
    }));

    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Media Upload</h2>
          <p className="text-sm text-muted-foreground">
            Upload up to 4 media files. First file will be the cover.
          </p>
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="font-medium text-blue-800">Limits:</p>
            <ul className="list-disc pl-4 mt-1 text-blue-700">
              <li>Max size: {MAX_FILE_SIZE_MB}MB per new file</li>
              <li>Gallery limit: Exactly {MAX_GALLERY_IMAGES} items</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Cover Media (1 Photo/Video)</h3>
            <FileUploader
              label=""
              multiple={false}
              files={media.coverPhoto ? [media.coverPhoto] : []}
              onChange={(files) => {
                const result = coverSchema.safeParse(files[0]);
                if (!result.success) {
                  toast.error(result.error.issues[0].message);
                } else {
                  setMedia({ ...media, coverPhoto: files[0] });
                }
              }}
              emptyText="Upload cover media"
              accept="image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/webm"
              maxSize={MAX_FILE_SIZE_BYTES}
            />
          </div>

          <div>
            <h3 className="font-medium mb-2">
              Gallery Media (Up to {MAX_GALLERY_IMAGES} items)
            </h3>
            <FileUploader
              label=""
              files={media.images}
              onChange={(files) => {
                const result = gallerySchema.safeParse(files);
                if (!result.success) {
                  toast.error(result.error.issues[0].message);
                  if (files.length > MAX_GALLERY_IMAGES) {
                    setMedia({
                      ...media,
                      images: files.slice(0, MAX_GALLERY_IMAGES),
                    });
                  }
                } else {
                  setMedia({ ...media, images: files });
                }
              }}
              multiple={true}
              maxFiles={MAX_GALLERY_IMAGES}
              accept="image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/webp"
              maxSize={MAX_FILE_SIZE_BYTES}
              emptyText={`Upload ${MAX_GALLERY_IMAGES} gallery items`}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>
                {media.images.length}/{MAX_GALLERY_IMAGES} files selected
              </span>
              <span>Max {MAX_FILE_SIZE_MB}MB per new file</span>
            </div>
          </div>

          {/* Upload Summary */}
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Upload Summary</h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Cover media:</span>
                <span
                  className={
                    media.coverPhoto ? "text-green-600" : "text-red-600"
                  }
                >
                  {media.coverPhoto ? "✓ Ready" : "✗ Missing"}
                  {media.coverPhoto?.size &&
                    ` (${(Number(media.coverPhoto.size) / 1024 / 1024).toFixed(1)}MB)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gallery media:</span>
                <span
                  className={
                    media.images.length === 3
                      ? "text-green-600"
                      : "text-amber-600"
                  }
                >
                  {media.images.length}/3 files
                  {media.images.length > 0 &&
                    ` (${(
                      media.images.reduce(
                        (sum, f) => sum + (Number(f.size) || 0),
                        0,
                      ) /
                      1024 /
                      1024
                    ).toFixed(1)}MB total)`}
                </span>
              </div>
              <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                <span>Total to upload:</span>
                <span>
                  {[media.coverPhoto, ...media.images].length}/4 files
                  {media.coverPhoto?.size &&
                    ` (${(
                      [media.coverPhoto, ...media.images].reduce(
                        (sum, f) => sum + (Number(f?.size) || 0),
                        0,
                      ) /
                      1024 /
                      1024
                    ).toFixed(1)}MB)`}
                </span>
              </div>
              {isUploading && (
                <div className="mt-2 text-blue-600 text-xs">
                  ⏳ Uploading files (will try bulk first, then chunks if
                  needed)...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

MediaUploadStep.displayName = "MediaUploadStep";
