/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/dashboard/vendor/my-listing/create/form-component/media.tsx

"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { useListing } from "@/context/listing-form-context";
import { FileUploader } from "@/components/dashboard/listing/media-uploader";
import { z } from "zod";

interface Props {
  listingType: "business" | "event" | "community";
  listingSlug: string;
}

// --- Configuration ---
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_GALLERY_IMAGES = 3;

// --- Zod Validation Schema ---
const gallerySchema = z
  .array(z.any())
  .max(MAX_GALLERY_IMAGES, {
    message: `You can only upload a maximum of ${MAX_GALLERY_IMAGES} gallery items.`,
  })
  .refine((files) => files.every((file) => file.size <= MAX_FILE_SIZE_BYTES), {
    message: `Each file must be less than ${MAX_FILE_SIZE_MB}MB.`,
  });

const coverSchema = z
  .any()
  .refine((file) => !file || file.size <= MAX_FILE_SIZE_BYTES, {
    message: `Cover media must be less than ${MAX_FILE_SIZE_MB}MB.`,
  });

// Helper to check if we need compression (Images only)
const shouldCompressImage = (file: File): boolean => {
  if (!file.type.startsWith("image/")) return false;
  return file.size > 5 * 1024 * 1024;
};

// Smart compression - only for large images, passes videos through untouched
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
    const { media, setMedia, currentStep } = useListing();
    const [isUploading, setIsUploading] = useState(false);
    
    // Track if this is an existing listing (created in step 1, returned to media)

    // --- Validation Logic ---
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
      const hasCover = !!media.coverPhoto;
      const hasGallery = media.images.length > 0;

      if (!hasCover && !hasGallery) {
        return true;
      }
      if (!validateMediaState()) return false;

      try {
        setIsUploading(true);
        const token = localStorage.getItem("authToken");

        // Create flow always POSTs to /media (media_update is only for the edit flow)
        const endpoint = `/api/listing/${listingSlug}/media`;
        const method = "POST";

        const allFiles = [media.coverPhoto, ...media.images].filter(
          Boolean,
        ) as File[];

        toast.loading("Preparing files...");
        const optimizedFiles = await Promise.all(
          allFiles.map(smartCompressImage),
        );

        // 2. Strategy: Attempt Bulk Upload first
        const attemptBulkUpload = async (files: File[]): Promise<boolean> => {
          try {
            toast.loading("Uploading files...");

            const formData = new FormData();
            files.forEach((file) => {
              formData.append("media[]", file);
            });

            formData.append("upload_strategy", "bulk");
            formData.append("total_files", files.length.toString());

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(endpoint, {
              method,
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              body: formData,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 413) {
              return false;
            }

            if (!response.ok) {
              if (response.status === 504 || response.status === 500)
                return false;

              const error = await response.json();
              throw new Error(error.message || "Bulk upload failed");
            }

            return true;
          } catch {
            return false;
          }
        };

        // 3. Strategy: Sequential Upload (Safest for Videos)
        const uploadSequential = async (files: File[]): Promise<boolean> => {
          const uploadedFiles: { index: number; success: boolean }[] = [];

          const CHUNK_SIZE = 1;

          for (let i = 0; i < files.length; i += CHUNK_SIZE) {
            const chunk = files.slice(i, i + CHUNK_SIZE);
            const currentFileIndex = i + 1;
            const totalFiles = files.length;

            toast.loading(
              `Uploading file ${currentFileIndex} of ${totalFiles}...`,
            );

            try {
              const formData = new FormData();
              chunk.forEach((file) => {
                formData.append("media[]", file);
              });

              formData.append("upload_strategy", "chunked");
              formData.append("chunk_index", currentFileIndex.toString());
              formData.append("total_chunks", totalFiles.toString());

              const response = await fetch(endpoint, {
                method,
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                },
                body: formData,
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Upload failed");
              }

              chunk.forEach((_, idx) => {
                uploadedFiles.push({ index: i + idx, success: true });
              });
            } catch (error) {
              console.error(
                `Failed to upload file ${currentFileIndex}:`,
                error,
              );
              chunk.forEach((_, idx) => {
                uploadedFiles.push({ index: i + idx, success: false });
              });
              toast.error(`File ${currentFileIndex} failed to upload.`);
            }
          }

          const failedUploads = uploadedFiles.filter((f) => !f.success);
          return failedUploads.length === 0;
        };

        // Execute Upload
        const bulkSuccess = await attemptBulkUpload(optimizedFiles);

        if (!bulkSuccess) {
          toast.info("Large files detected. Switching to sequential upload...");
          const sequentialSuccess = await uploadSequential(optimizedFiles);

          if (!sequentialSuccess) {
            throw new Error("Some files failed to upload. Please try again.");
          }
        }

        toast.success("All media uploaded successfully!");
        return true;
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : "Media upload failed",
        );
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
          uploadWithChunking().then((success) => {
            if (!success) {
              console.error("Background upload failed");
            }
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
            Upload up to 4 files. The first file will be your cover.
          </p>
          <div className="text-xs text-muted-foreground mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="font-semibold text-blue-800">Supported Formats:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1 text-blue-700">
              <li>
                <strong>Images:</strong> JPEG, PNG, JPG
              </li>
              <li>
                <strong>Videos:</strong> MP4, MOV, WEBM
              </li>
              <li>
                <strong>Max Size:</strong> {MAX_FILE_SIZE_MB}MB per file (Images
                & Videos)
              </li>
              <li>
                Large images are automatically optimized. Videos are uploaded
                as-is.
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-8">
          {/* Cover Media */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900">
                Cover Media (1 photo)
              </h3>
              {media.coverPhoto && (
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  {media.coverPhoto.type.startsWith("video")
                    ? "🎥 Video Selected"
                    : "🖼️ Image Selected"}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-3">
              This is the main visual for your listing. Images work best for
              thumbnails, but videos are supported.
            </p>
            <FileUploader
              label=""
              multiple={false}
              files={media.coverPhoto ? [media.coverPhoto] : []}
              onChange={(files) => setMedia({ ...media, coverPhoto: files[0] })}
              emptyText="Click to upload Cover (Image or Video)"
              accept="image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/webm"
              maxSize={MAX_FILE_SIZE_BYTES}
            />
          </div>

          {/* Gallery Media */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900">
                Gallery Media ( Up to {MAX_GALLERY_IMAGES} Photos and videos)
              </h3>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  media.images.length > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {media.images.length > 0
                  ? `${media.images.length} Selected`
                  : "0 Selected"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Add 3 more items to showcase your listing. Mix of photos and
              videos is allowed.
            </p>
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
              maxFiles={3}
              accept="image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/webp"
              maxSize={MAX_FILE_SIZE_BYTES}
              emptyText="Upload up to 3 gallery items"
            />
          </div>

          {/* Upload Status Bar */}
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