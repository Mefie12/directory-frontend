"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, FileText, Info, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClaimEvidenceConstraints,
  ClaimEvidenceItem,
  getClaimEvidenceSignedUrl,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FALLBACK_CONSTRAINTS: ClaimEvidenceConstraints = {
  max_files_per_submission: 5,
  max_file_size_bytes: 5 * 1024 * 1024,
  accepted_extensions: ["pdf", "jpg", "jpeg", "png", "webp"],
  accepted_mime_types: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
};

export interface PreviousClaimEvidence {
  claimId: number;
  evidence: ClaimEvidenceItem;
}

export function ClaimEvidencePreviewButton({ item }: { item: PreviousClaimEvidence }) {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken") || undefined;
      const result = await getClaimEvidenceSignedUrl(item.claimId, item.evidence.id, token);
      setPreview({ name: item.evidence.original_filename, mimeType: item.evidence.mime_type, url: result.url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open evidence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => void open()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        <span className="sr-only">Preview {item.evidence.original_filename}</span>
      </Button>
      <Dialog open={Boolean(preview)} onOpenChange={(openState) => !openState && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>Private claim evidence preview</DialogDescription>
          </DialogHeader>
          <div className="relative min-h-[55vh] overflow-hidden rounded-xl bg-gray-100">
            {preview?.mimeType.startsWith("image/") ? (
              <Image src={preview.url} alt={preview.name} fill unoptimized className="object-contain" />
            ) : preview ? (
              <iframe src={preview.url} title={`Preview of ${preview.name}`} className="h-[65vh] w-full bg-white" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PreviewState {
  name: string;
  mimeType: string;
  url: string;
}

function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ClaimEvidencePicker({
  files,
  onChange,
  constraints = FALLBACK_CONSTRAINTS,
  previousEvidence = [],
  title = "New evidence to submit",
}: {
  files: File[];
  onChange: (files: File[]) => void;
  constraints?: ClaimEvidenceConstraints;
  previousEvidence?: PreviousClaimEvidence[];
  title?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectionErrors, setSelectionErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const localUrls = useMemo(() => {
    const urls: Record<string, string> = {};
    files.forEach((file) => { urls[fileKey(file)] = URL.createObjectURL(file); });
    return urls;
  }, [files]);

  useEffect(() => {
    return () => Object.values(localUrls).forEach((url) => URL.revokeObjectURL(url));
  }, [localUrls]);

  const previousFingerprints = useMemo(
    () => new Set(previousEvidence.map(({ evidence }) => `${evidence.original_filename}:${evidence.file_size}`)),
    [previousEvidence],
  );

  const accept = constraints.accepted_extensions.map((extension) => `.${extension}`).join(",");

  const handleSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const next = [...files];
    const errors: string[] = [];

    selected.forEach((file) => {
      if (next.length >= constraints.max_files_per_submission) {
        errors.push(`${file.name}: only ${constraints.max_files_per_submission} files can be submitted at once.`);
        return;
      }
      if (file.size > constraints.max_file_size_bytes) {
        errors.push(`${file.name}: file exceeds the ${formatBytes(constraints.max_file_size_bytes)} limit.`);
        return;
      }
      if (!constraints.accepted_mime_types.includes(file.type)) {
        errors.push(`${file.name}: select a PDF, JPEG, PNG, or WebP file.`);
        return;
      }
      next.push(file);
    });

    setSelectionErrors(errors);
    onChange(next);
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      {previousEvidence.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-bold text-[#1F3A4C]">Previously submitted evidence</h4>
            <p className="text-xs text-gray-500">Review these files before adding another copy.</p>
          </div>
          <div className="space-y-2">
            {previousEvidence.map((item) => (
              <div key={`${item.claimId}-${item.evidence.id}`} className="flex items-center gap-3 rounded-lg border bg-white p-3">
                <FileText className="h-5 w-5 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-700">{item.evidence.original_filename}</p>
                  <p className="text-[11px] text-gray-400">
                    {formatBytes(item.evidence.file_size)} · {new Date(item.evidence.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ClaimEvidencePreviewButton item={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h4 className="mb-2 text-sm font-bold text-[#1F3A4C]">{title}</h4>
        <input ref={inputRef} type="file" multiple accept={accept} onChange={handleSelection} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= constraints.max_files_per_submission}
          className={cn(
            "flex w-full flex-col items-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-6 text-center transition-colors",
            files.length < constraints.max_files_per_submission && "hover:border-[#93C01F]/60 hover:bg-[#93C01F]/5",
          )}
        >
          <Upload className="mb-2 h-6 w-6 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">Choose evidence files</span>
          <span className="mt-1 text-xs text-gray-400">
            PDF, JPG, PNG or WebP · {formatBytes(constraints.max_file_size_bytes)} each · up to {constraints.max_files_per_submission}
          </span>
        </button>

        {selectionErrors.length > 0 && (
          <div className="mt-2 space-y-1" role="alert">
            {selectionErrors.map((error) => <p key={error} className="text-xs text-red-600">{error}</p>)}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {files.map((file, index) => {
              const duplicate = previousFingerprints.has(`${file.name}:${file.size}`);
              const url = localUrls[fileKey(file)];
              return (
                <div key={fileKey(file)} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    className="relative flex h-28 w-full items-center justify-center bg-gray-50"
                    onClick={() => url && setPreview({ name: file.name, mimeType: file.type, url })}
                  >
                    {file.type.startsWith("image/") && url ? (
                      <Image src={url} alt={`Preview of ${file.name}`} fill unoptimized className="object-cover" />
                    ) : (
                      <FileText className="h-10 w-10 text-gray-400" />
                    )}
                    <span className="absolute bottom-2 right-2 rounded-full bg-white/90 p-1.5 shadow"><Eye className="h-3.5 w-3.5" /></span>
                  </button>
                  <div className="flex items-start gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-700">{file.name}</p>
                      <p className="text-[11px] text-gray-400">{formatBytes(file.size)}</p>
                      {duplicate && (
                        <p className="mt-1 flex items-start gap-1 text-[11px] text-amber-700">
                          <Info className="mt-0.5 h-3 w-3 shrink-0" /> This matches a previously submitted filename and size.
                        </p>
                      )}
                    </div>
                    <button type="button" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} className="text-gray-400 hover:text-red-600">
                      <X className="h-4 w-4" /><span className="sr-only">Remove {file.name}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>Private claim evidence preview</DialogDescription>
          </DialogHeader>
          <div className="relative min-h-[55vh] overflow-hidden rounded-xl bg-gray-100">
            {preview?.mimeType.startsWith("image/") ? (
              <Image src={preview.url} alt={preview.name} fill unoptimized className="object-contain" />
            ) : preview ? (
              <iframe src={preview.url} title={`Preview of ${preview.name}`} className="h-[65vh] w-full bg-white" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
