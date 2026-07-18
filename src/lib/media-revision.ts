// Shared atomic media save — the one canonical workflow both the main create/edit
// wizard and the manual-listing flow use (listing-media PRD §11). One call stages
// every new file, waits for server-side normalization, then commits the complete
// desired state in a single atomic operation. The previous active collection
// stays live until the commit succeeds.

import {
  ApiRateLimitError,
  ListingActiveMedia,
  MediaRef,
  cancelMediaRevision,
  createMediaRevision,
  commitMediaRevision,
  getMediaRevision,
  stageRevisionItem,
  updateRevisionDesiredState,
  uploadRevisionItemFile,
} from "@/lib/api";

export type MediaSlotInput = File | { id: number };

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 180_000;

const FAILURE_MESSAGES: Record<string, string> = {
  below_minimum_dimensions:
    "is too small — covers need at least 600×338px, gallery images 600×600px.",
  unsupported_or_disguised_format: "is not a supported image format.",
  file_too_large: "exceeds the 5MB limit.",
  staging_file_missing: "did not finish uploading. Please try again.",
  image_processing_failed: "could not be processed. Please try a different file.",
  invalid_video: "is not a valid playable video.",
  video_too_long: "is longer than the 30 second limit.",
  video_processing_failed: "could not be converted. Please try a different video.",
  poster_generation_failed: "could not generate a preview image.",
};

function isFile(input: MediaSlotInput): input is File {
  return typeof File !== "undefined" && input instanceof File;
}

function wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout);
      reject(new DOMException('Media save cancelled.', 'AbortError'));
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Atomically saves a listing's complete media state.
 *
 * `cover` is required; `gallery` is the desired final gallery in display order.
 * Existing server media is passed as `{id}`; new selections as `File`. Anything
 * currently active but absent from the desired state is removed by the commit.
 */
export async function saveListingMediaAtomic(options: {
  listingSlug: string;
  cover: MediaSlotInput;
  gallery: MediaSlotInput[];
  coverAltText?: string;
  galleryAltTexts?: string[];
  token?: string;
  onFileProgress?: (fileName: string, percent: number) => void;
  signal?: AbortSignal;
}): Promise<ListingActiveMedia> {
  const { listingSlug, cover, gallery, coverAltText, galleryAltTexts, token, onFileProgress, signal } = options;

  const revision = await createMediaRevision(listingSlug, token);

  try {
    signal?.throwIfAborted();
    // Stage + upload every new file, remembering which staged item fills which slot.
    const stagedIds = new Map<File, number>();
    const uploads: Array<{ file: File; role: "cover" | "gallery" }> = [];
    if (isFile(cover)) uploads.push({ file: cover, role: "cover" });
    gallery.forEach((slot) => {
      if (isFile(slot)) uploads.push({ file: slot, role: "gallery" });
    });

    for (const { file, role } of uploads) {
      const stage = await stageRevisionItem(
        revision.id,
        {
          role,
          kind: file.type.startsWith("video/") ? "video" : "image",
          original_filename: file.name,
          mime_type: file.type,
          file_size: file.size,
        },
        token,
      );
      await uploadRevisionItemFile(revision.id, stage, file, token, (pct) => {
        onFileProgress?.(file.name, pct);
      },
        signal,
      );
      stagedIds.set(file, stage.item_id);
    }

    // Wait for server-side normalization of every staged item.
    if (uploads.length > 0) {
      const deadline = Date.now() + POLL_TIMEOUT_MS;
      let pollInterval = POLL_INTERVAL_MS;
      for (;;) {
        signal?.throwIfAborted();
        let state;
        try {
          state = await getMediaRevision(revision.id, token);
        } catch (error) {
          if (error instanceof ApiRateLimitError) {
            await wait(error.retryAfterSeconds * 1000, signal);
            continue;
          }
          throw error;
        }
        const staged = state.items.filter((i) =>
          Array.from(stagedIds.values()).includes(i.id),
        );

        const failed = staged.find((i) => i.status === "failed");
        if (failed) {
          const reason =
            FAILURE_MESSAGES[failed.failure_code ?? ""] ?? "failed to process.";
          throw new Error(`"${failed.original_filename}" ${reason}`);
        }

        if (staged.every((i) => i.status === "ready")) break;

        if (Date.now() > deadline) {
          throw new Error(
            "Media processing is taking longer than expected. Please try again in a moment.",
          );
        }
        await wait(pollInterval, signal);
        pollInterval = Math.min(MAX_POLL_INTERVAL_MS, Math.ceil(pollInterval * 1.25));
      }
    }

    const toRef = (slot: MediaSlotInput): MediaRef =>
      isFile(slot)
        ? { type: "item", id: stagedIds.get(slot) as number }
        : { type: "media", id: slot.id };

    await updateRevisionDesiredState(
      revision.id,
      {
        cover: toRef(cover),
        gallery: gallery.map(toRef),
        alt_texts: {
          cover: coverAltText?.trim() ?? "",
          ...Object.fromEntries(
            gallery.map((_, index) => [
              `gallery_${index + 1}`,
              galleryAltTexts?.[index]?.trim() ?? "",
            ]),
          ),
        },
      },
      token,
    );

    const result = await commitMediaRevision(revision.id, token);
    return result.media;
  } catch (error) {
    // A rate limit is temporary and does not mean the revision itself is bad.
    // Leave it resumable instead of issuing another request into a busy system.
    if (!(error instanceof ApiRateLimitError)) {
      await cancelMediaRevision(revision.id, token).catch(() => undefined);
    }
    throw error;
  }
}
