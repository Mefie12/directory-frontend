"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";
import { useListing } from "@/context/listing-form-context";
import { FileUploader } from "@/components/dashboard/listing/media-uploader";

interface Props {
  listingType: "business" | "event" | "community";
  listingSlug: string;
}

// --- Configuration ---
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Helper to check if we need compression (Images only)
const shouldCompressImage = (file: File): boolean => {
  // Only compress images, NEVER videos
  if (!file.type.startsWith("image/")) return false;

  // Optimization threshold: Compress if over 5MB (even if allowed up to 50MB)
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
    const { media, setMedia } = useListing();
    const [isUploading, setIsUploading] = useState(false);

    const uploadWithChunking = async () => {
      // Forgiving: Allow proceeding without cover photo (soft requirement)
      if (!media.coverPhoto) {
        toast.error("Cover media is required");
        return false;
      }

      try {
        setIsUploading(true);
        const token = localStorage.getItem("authToken");
        const API_URL = process.env.API_URL || "https://me-fie.co.uk";

        const allFiles = [media.coverPhoto, ...media.images];

        // 1. Optimize Images (Videos are skipped)
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
            // INCREASED TIMEOUT: Videos take longer. 60s timeout.
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

            if (response.status === 413) {
              return false;
            }

            if (!response.ok) {
              // If it's a server timeout or size issue, try chunking
              if (response.status === 504 || response.status === 500)
                return false;

              const error = await response.json();
              throw new Error(error.message || "Bulk upload failed");
            }

            return true;
          } catch {
            // Try sequential upload
            return false;
          }
        };

        // 3. Strategy: Sequential Upload (Safest for Videos)
        const uploadSequential = async (files: File[]): Promise<boolean> => {
          const uploadedFiles: { index: number; success: boolean }[] = [];

          // Upload 1 file at a time for reliability with videos
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
        return await uploadWithChunking();
      },
    }));

    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Media Upload</h2>
          <p className="text-sm text-muted-foreground">
            Upload exactly 4 files. The first file will be your cover.
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
                Cover Media (Required)
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
                Gallery Media (Required: 3)
              </h3>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  media.images.length === 3
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {media.images.length}/3 Selected
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Add 3 more items to showcase your listing. Mix of photos and
              videos is allowed.
            </p>
            <FileUploader
              label=""
              files={media.images}
              onChange={(files) => setMedia({ ...media, images: files })}
              multiple={true}
              maxFiles={3}
              accept="image/jpeg,image/jpg,image/webp,video/mp4,video/quicktime,video/webp"
              maxSize={MAX_FILE_SIZE_BYTES}
              emptyText="Upload 3 gallery items"
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
                Ready to upload
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
