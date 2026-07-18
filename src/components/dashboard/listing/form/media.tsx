/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { useListing } from "@/context/listing-form-context";
import { FileUploader } from "@/components/dashboard/listing/media-uploader";
import { z } from "zod";
import { handleSessionExpired } from "@/lib/session";
import { MediaSlotInput, saveListingMediaAtomic } from "@/lib/media-revision";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  listingType: "business" | "event" | "community";
  listingSlug: string;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 30;
const MAX_GALLERY_IMAGES = 3;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/webp", "image/png"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];

const gallerySchema = z
  .array(z.any())
  .max(MAX_GALLERY_IMAGES, {
    message: `You can only upload a maximum of ${MAX_GALLERY_IMAGES} gallery items.`,
  })
  .refine(
    (files) =>
      files.every((file) =>
        !file.size || file.size <= (file.type?.startsWith("video/") ? MAX_VIDEO_SIZE_BYTES : MAX_FILE_SIZE_BYTES),
      ),
    { message: "Images must be 5MB or less and videos 20MB or less." },
  )
  .refine(
    (files) =>
      files.every(
        (file) =>
          !(file instanceof File) || [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(file.type),
      ),
    { message: "Gallery media must be JPEG, WebP, PNG, MP4, or MOV." },
  )
  .refine(
    (files) => files.filter((file) =>
      file instanceof File ? file.type.startsWith("video/") : file?.kind === "video",
    ).length <= 1,
    { message: "Only one gallery video is allowed." },
  );

const readVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`"${file.name}" is not a playable video.`));
    };
    video.src = url;
  });

const coverSchema = z
  .any()
  .refine((file) => !file || !file.size || file.size <= MAX_FILE_SIZE_BYTES, {
    message: `Cover photo must be less than ${MAX_FILE_SIZE_MB}MB.`,
  })
  .refine(
    (file) =>
      !file || !(file instanceof File) || ALLOWED_IMAGE_TYPES.includes(file.type),
    { message: "Cover photo must be a JPEG, WebP, or PNG image." },
  );

const shouldCompressImage = (file: File): boolean => {
  if (!file || !(file instanceof File) || !file.type.startsWith("image/"))
    return false;
  return file.size > MAX_FILE_SIZE_BYTES;
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
          if (width > height) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }),
              );
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

const getExistingId = (item: any): number | null => {
  if (!item || item instanceof File) return null;
  const id = Number(item.id);
  return Number.isFinite(id) && id > 0 ? id : null;
};

export const MediaUploadStep = forwardRef<ListingFormHandle, Props>(
  ({ listingSlug }, ref) => {
    const { media, setMedia } = useListing();
    const [isUploading, setIsUploading] = useState(false);
    const activeSave = useRef<AbortController | null>(null);
    const [altTexts, setAltTexts] = useState<Record<string, string>>({});

    const mediaKey = (item: any): string => {
      if (item instanceof File) return `file:${item.name}:${item.size}:${item.lastModified}`;
      return `media:${item?.id ?? item?.original ?? "unknown"}`;
    };

    const accessibilityText = (item: any): string =>
      altTexts[mediaKey(item)] ?? (item instanceof File ? "" : item?.alt_text ?? "");

    const updateAccessibilityText = (item: any, value: string) => {
      setAltTexts((current) => ({ ...current, [mediaKey(item)]: value }));
    };

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
      // Gallery without a cover is not a valid state — the backend commit
      // requires an explicit cover (media PRD §6.2).
      if (!media.coverPhoto && media.images.length > 0) {
        toast.error("Please add a cover photo before adding gallery images.");
        return false;
      }
      return true;
    };

    /**
     * One atomic save: every change (add, replace, remove, reorder) is expressed
     * as a single desired state and committed in one operation — the previous
     * collection stays live if anything fails (media PRD §11).
     */
    const saveMedia = async () => {
      // A draft may be left without media entirely.
      if (!media.coverPhoto && media.images.length === 0) return true;

      try {
        setIsUploading(true);
        const controller = new AbortController();
        activeSave.current = controller;
        const token = localStorage.getItem("authToken") || undefined;

        for (const item of media.images) {
          if (item instanceof File && item.type.startsWith("video/")) {
            const duration = await readVideoDuration(item);
            if (duration > MAX_VIDEO_DURATION_SECONDS) {
              throw new Error(`"${item.name}" is longer than the 30 second limit.`);
            }
          }
        }

        const toSlot = async (item: any): Promise<MediaSlotInput> => {
          if (item instanceof File) return smartCompressImage(item);
          return { id: getExistingId(item) as number };
        };

        toast.loading("Saving media…");
        const cover = await toSlot(media.coverPhoto);
        const gallery = await Promise.all(media.images.map(toSlot));

        const active = await saveListingMediaAtomic({
          listingSlug,
          cover,
          gallery,
          coverAltText: accessibilityText(media.coverPhoto),
          galleryAltTexts: media.images.map(accessibilityText),
          token,
          onFileProgress: (name, pct) =>
            toast.loading(`Uploading ${name}… ${pct}%`),
          signal: controller.signal,
        });

        // Sync context with the committed canonical state so step navigation
        // shows server objects, not stale Files.
        setMedia({
          coverPhoto: active.cover ?? null,
          images: active.gallery,
        });

        toast.success("Media saved!");
        return true;
      } catch (error: any) {
        if (error?.name === "AbortError") {
          toast.info("Media save cancelled. Your current public media was not changed.");
          return false;
        }
        if (typeof error?.status === "number" && handleSessionExpired(error.status)) {
          return false;
        }
        toast.error(error.message || "Media save failed");
        return false;
      } finally {
        activeSave.current = null;
        setIsUploading(false);
        toast.dismiss();
      }
    };

    useImperativeHandle(ref, () => ({
      async submit() {
        if (!validateMediaState()) return false;
        return saveMedia();
      },
    }));

    return (
      <div className="py-4 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Media Upload</h2>
          <p className="text-sm text-muted-foreground">
            The cover must be an image. Gallery media supports images up to 5MB
            and one MP4 or MOV video up to 20MB and 30 seconds.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Cover Photo{" "}
              <span className="text-gray-400 font-normal text-sm">
                (required before publishing)
              </span>
            </h3>
            <FileUploader
              label=""
              multiple={false}
              files={media.coverPhoto ? [media.coverPhoto] : []}
              onChange={(files) => {
                const newItem = files[0] || null;
                if (newItem instanceof File) {
                  const result = coverSchema.safeParse(newItem);
                  if (!result.success) {
                    toast.error(result.error.issues[0].message);
                    return;
                  }
                }
                setMedia({ ...media, coverPhoto: newItem });
              }}
              accept="image/jpeg,image/jpg,image/webp,image/png"
              maxSize={MAX_FILE_SIZE_BYTES}
              allowPersistedRemoval={false}
            />
            {media.coverPhoto && (
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="cover-alt-text">Cover image description (optional)</Label>
                <Input
                  id="cover-alt-text"
                  value={accessibilityText(media.coverPhoto)}
                  maxLength={500}
                  placeholder="Defaults to the listing name"
                  onChange={(event) => updateAccessibilityText(media.coverPhoto, event.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Gallery Media{" "}
              <span className="text-gray-400 font-normal text-sm">
                (optional, up to {MAX_GALLERY_IMAGES})
              </span>
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
                  return;
                }
                setMedia({ ...media, images: files });
              }}
              multiple={true}
              maxFiles={3}
              accept="image/jpeg,image/jpg,image/webp,image/png,video/mp4,video/quicktime"
              sortable
              confirmPersistedRemoval
            />
            {media.images.length > 0 && (
              <div className="mt-4 space-y-3">
                {media.images.map((item: any, index: number) => {
                  const video = item instanceof File
                    ? item.type.startsWith("video/")
                    : item?.kind === "video" || item?.mime_type?.startsWith("video/");
                  return (
                    <div key={mediaKey(item)} className="space-y-1.5">
                      <Label htmlFor={`gallery-alt-${index}`}>
                        {video ? "Video title" : `Gallery image ${index + 1} description`} (optional)
                      </Label>
                      <Input
                        id={`gallery-alt-${index}`}
                        value={accessibilityText(item)}
                        maxLength={500}
                        placeholder={video ? "Describe the video" : "Describe what is shown"}
                        onChange={(event) => updateAccessibilityText(item, event.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
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
                {isUploading ? " Saving…" : " Ready"}
              </span>
            </div>
            {isUploading && (
              <div className="mt-3 space-y-3" aria-live="polite">
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full animate-progress w-full origin-left" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => activeSave.current?.abort()}
                >
                  Cancel media save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

MediaUploadStep.displayName = "MediaUploadStep";
