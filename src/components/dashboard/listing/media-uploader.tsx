"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CloudUpload, GripVertical, Info, Play, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type FileOrMedia =
  | File
  | {
      id?: number;
      original?: string;
      url?: string;
      name?: string;
      mime_type?: string;
      kind?: "image" | "video";
    };

interface FileUploaderProps {
  label: string;
  multiple?: boolean;
  files: FileOrMedia[];
  onChange: (files: FileOrMedia[]) => void;
  emptyText?: string;
  maxFiles?: number;
  accept?: string;
  maxSize?: number;
  sortable?: boolean;
  confirmPersistedRemoval?: boolean;
  allowPersistedRemoval?: boolean;
}

interface PendingRemoval {
  item: FileOrMedia;
  index: number;
  key: string;
}

function isPersisted(item: FileOrMedia): boolean {
  return !(item instanceof File) && Number.isFinite(Number(item.id));
}

function isVideoItem(item: FileOrMedia): boolean {
  if (item instanceof File) return item.type.startsWith("video/");
  if (item.kind) return item.kind === "video";
  if (item.mime_type) return item.mime_type.startsWith("video/");
  return /\.(mp4|mov|webm)$/i.test(item.url || item.original || "");
}

function getFileName(item: FileOrMedia): string {
  if (item instanceof File) return item.name;
  return item.name || (item.url ?? item.original ?? "").split("/").pop() || "existing-file";
}

function MediaPreview({ item, name }: { item: FileOrMedia; name: string }) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    if (!(item instanceof File)) {
      return;
    }

    let active = true;
    const objectUrl = URL.createObjectURL(item);
    queueMicrotask(() => {
      if (active) setLocalUrl(objectUrl);
    });

    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [item]);

  const src = localUrl || (item instanceof File ? "" : item.url || item.original || "");

  if (!src) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
        Preparing preview…
      </div>
    );
  }

  if (previewFailed) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-3 text-center text-xs text-destructive">
        Preview unavailable. Choose a JPEG, PNG, or WebP file.
      </div>
    );
  }

  if (isVideoItem(item)) {
    return (
      <div className="relative h-32 w-full overflow-hidden rounded-lg border bg-black">
        <video
          src={src}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
          onError={() => setPreviewFailed(true)}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="h-8 w-8 fill-white text-white" />
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={400}
      height={300}
      unoptimized
      className="h-32 w-full rounded-lg border object-cover"
      onError={() => setPreviewFailed(true)}
    />
  );
}

function SortableMediaCard({
  item,
  itemKey,
  sortable,
  onRemove,
}: {
  item: FileOrMedia;
  itemKey: string;
  sortable: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemKey,
    disabled: !sortable,
  });
  const name = getFileName(item);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative rounded-lg", isDragging && "z-10 opacity-70")}
    >
      <MediaPreview item={item} name={name} />
      {sortable && (
        <button
          type="button"
          className="absolute left-2 top-2 rounded-full bg-black/65 p-1.5 text-white"
          aria-label={`Move ${name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="mt-1 truncate text-xs text-muted-foreground">{name}</p>
    </div>
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
  sortable = false,
  confirmPersistedRemoval = false,
  allowPersistedRemoval = true,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localKeys] = useState(() => new WeakMap<File, string>());
  const [dragActive, setDragActive] = useState(false);
  const [removalCandidate, setRemovalCandidate] = useState<{ item: FileOrMedia; index: number } | null>(null);
  const [pendingRemovals, setPendingRemovals] = useState<PendingRemoval[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const itemKey = (item: FileOrMedia): string => {
    if (!(item instanceof File)) return `media-${item.id ?? item.original ?? item.url}`;
    const existing = localKeys.get(item);
    if (existing) return existing;
    const key = `file-${crypto.randomUUID()}`;
    localKeys.set(item, key);
    return key;
  };

  const keys = files.map(itemKey);

  const acceptSelection = (selected: File[]) => {
    if (maxSize) {
      const oversized = selected.find((file) => file.size > maxSize);
      if (oversized) {
        toast.error(`"${oversized.name}" exceeds the ${Math.round(maxSize / 1024 / 1024)} MB limit.`);
        return;
      }
    }

    const combined = multiple ? [...files, ...selected] : selected.slice(0, 1);
    if (maxFiles && combined.length > maxFiles) {
      toast.error(`You can add no more than ${maxFiles} item${maxFiles === 1 ? "" : "s"}.`);
      return;
    }
    onChange(combined);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    acceptSelection(selected);
  };

  const removeFile = (index: number) => {
    const item = files[index];
    if (isPersisted(item) && !allowPersistedRemoval) {
      inputRef.current?.click();
      return;
    }
    if (isPersisted(item) && confirmPersistedRemoval) {
      setRemovalCandidate({ item, index });
      return;
    }
    onChange(files.filter((_, itemIndex) => itemIndex !== index));
  };

  const confirmRemoval = () => {
    if (!removalCandidate) return;
    const key = itemKey(removalCandidate.item);
    setPendingRemovals((current) => [...current, { ...removalCandidate, key }]);
    onChange(files.filter((item) => itemKey(item) !== key));
    setRemovalCandidate(null);
  };

  const undoRemoval = (pending: PendingRemoval) => {
    const restored = [...files];
    restored.splice(Math.min(pending.index, restored.length), 0, pending.item);
    onChange(restored);
    setPendingRemovals((current) => current.filter((item) => item.key !== pending.key));
  };

  const handleSortEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = keys.indexOf(String(active.id));
    const newIndex = keys.indexOf(String(over.id));
    if (oldIndex >= 0 && newIndex >= 0) onChange(arrayMove(files, oldIndex, newIndex));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">Upload media to showcase your listing</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragLeave={(event) => { event.preventDefault(); setDragActive(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          acceptSelection(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center transition-colors hover:border-primary hover:bg-accent/50",
          dragActive && "border-primary bg-accent/50",
        )}
      >
        <input ref={inputRef} type="file" multiple={multiple} accept={accept} onChange={handleFileChange} className="hidden" />
        <p className="mb-2 text-sm text-foreground">Drag and drop files here</p>
        <p className="mb-4 text-sm text-muted-foreground">or</p>
        <Button type="button" className="rounded-full bg-foreground text-background hover:bg-foreground/90" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>
          Choose files <CloudUpload className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {files.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSortEnd}>
          <SortableContext items={keys} strategy={verticalListSortingStrategy}>
            <div className={cn("grid gap-3", multiple ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1")}>
              {files.map((item, index) => (
                <div className="group" key={keys[index]}>
                  <SortableMediaCard item={item} itemKey={keys[index]} sortable={sortable && files.length > 1} onRemove={() => removeFile(index)} />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
      )}

      {pendingRemovals.map((pending) => (
        <div key={pending.key} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <span><strong>{getFileName(pending.item)}</strong> will be removed when you save.</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => undoRemoval(pending)}>
            <RotateCcw className="mr-1 h-4 w-4" /> Undo
          </Button>
        </div>
      ))}

      <AlertDialog open={!!removalCandidate} onOpenChange={(open) => !open && setRemovalCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this gallery item?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be marked for removal and deleted only when you save your media changes. You can undo before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep item</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoval} className="bg-rose-600 text-white hover:bg-rose-700">Mark for removal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
