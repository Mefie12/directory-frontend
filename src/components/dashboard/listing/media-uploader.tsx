import { useRef, ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { X, Info, CloudUpload, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FileOrImage = any;

interface FileUploaderProps {
  label: string;
  multiple?: boolean;
  files: FileOrImage[];
  onChange: (files: FileOrImage[]) => void;
  emptyText?: string;
  maxFiles?: number;
  accept?: string;
  maxSize?: number;
}

function isVideoItem(item: FileOrImage): boolean {
  if (item instanceof File) return item.type.startsWith("video/");
  if (item?.mime_type) return (item.mime_type as string).startsWith("video/");
  const url: string = item?.url || item?.original || "";
  return /\.(mp4|mov|avi|wmv|webm)$/i.test(url);
}

function resolveMediaUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  return `${API_URL}/${url.replace(/^\//, "")}`;
}

function getPreviewSrc(item: FileOrImage): string {
  if (item instanceof File) return URL.createObjectURL(item);
  const raw = item?.url || item?.original || "";
  return resolveMediaUrl(raw);
}

function getFileName(item: FileOrImage): string {
  if (item instanceof File) return item.name;
  return (
    item?.name ||
    (item?.url ?? item?.original ?? "").split("/").pop() ||
    "existing-file"
  );
}

export function FileUploader({
  label,
  multiple = false,
  files,
  onChange,
  emptyText = "No files uploaded yet",
  maxFiles,
  accept,
  maxSize,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []) as File[];
    // Reset so the same file can be re-selected
    e.target.value = "";

    if (maxSize) {
      const oversized = selected.filter((f) => f.size > maxSize);
      if (oversized.length > 0) return;
    }

    const combined: FileOrImage[] = multiple
      ? [...files, ...selected]
      : selected.slice(0, 1);

    if (maxFiles && combined.length > maxFiles) {
      onChange(combined.slice(0, maxFiles));
      return;
    }

    onChange(combined);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_: FileOrImage, i: number) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Upload images or videos to showcase your listing</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center cursor-pointer transition-colors",
          "hover:border-primary hover:bg-accent/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-sm text-foreground mb-2">Drag and drop files here</p>
        <p className="text-sm text-muted-foreground mb-4">or</p>
        <Button
          type="button"
          variant="default"
          className="bg-foreground rounded-full text-background hover:bg-foreground/90"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Choose files <CloudUpload className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {files.length > 0 ? (
        <div
          className={cn(
            "grid gap-3",
            multiple ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1",
          )}
        >
          {files.map((file: FileOrImage, index: number) => {
            const isVideo = isVideoItem(file);
            const src = getPreviewSrc(file);
            const name = getFileName(file);

            return (
              <div key={index} className="relative group">
                {isVideo ? (
                  <div className="relative w-full h-32 rounded-lg border overflow-hidden bg-black">
                    <video
                      src={src}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                ) : (
                  <Image
                    src={src}
                    alt={name}
                    width={400}
                    height={300}
                    unoptimized
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {name}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          {emptyText}
        </p>
      )}
    </div>
  );
}
