import { useRef, ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { X, Info, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

interface FileUploaderProps {
  label: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  emptyText?: string;
  maxFiles?: number;
  accept?: string;
  maxSize?: number;
}

export function FileUploader({
  label,
  multiple = false,
  files,
  onChange,
  emptyText = "No files uploaded yet",
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (multiple) {
      onChange([...files, ...selectedFiles]);
    } else {
      onChange(selectedFiles.slice(0, 1));
    }
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
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
              <p>
                Use images to engage people who are interested in your{" "}
                {multiple ? "listing" : "listing"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center cursor-pointer transition-colors",
          "hover:border-primary hover:bg-accent/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
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
            multiple ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"
          )}
        >
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <Image
                src={URL.createObjectURL(file)}
                alt={file.name}
                width={400}
                height={300}
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          {emptyText}
        </p>
      )}
    </div>
  );
}
