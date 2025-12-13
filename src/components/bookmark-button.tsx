"use client";

import { Button } from "@/components/ui/button";
import { Bookmark, Loader2 } from "lucide-react";
import { useBookmark } from "@/context/bookmark-context";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface BookmarkButtonProps {
  slug: string;
}

export function BookmarkButton({ slug }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmark();

  // 1. Initialize local state from context
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Sync local state with context (handles initial load & updates from other components)
  useEffect(() => {
    setIsSaved(isBookmarked(slug));
  }, [isBookmarked, slug]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || !slug) return;

    // 3. OPTIMISTIC UPDATE:
    // Flip the state immediately so the user sees "Saved" instantly
    const newState = !isSaved;
    setIsSaved(newState);
    setIsLoading(true);

    try {
      await toggleBookmark(slug);
    } catch (error) {
      console.error("Bookmark toggle failed", error);
      // 4. Revert ONLY if the API call throws an error
      setIsSaved(!newState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleToggle}
      className={cn(
        "border shadow-sm transition backdrop-blur-md",
        isSaved
          ? "border-[#93C01F]/20 bg-[#93C01F]/10 text-[#93C01F] hover:bg-[#93C01F]/20"
          : "border-white/60 bg-white/80 text-gray-700 hover:bg-white"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Bookmark
          className={cn(
            "h-4 w-4 mr-2 transition-colors",
            isSaved
              ? "fill-[#93C01F] text-[#93C01F]"
              : "text-gray-500 group-hover:text-[#93C01F]"
          )}
        />
      )}
      {isSaved ? "Saved" : "Bookmark"}
    </Button>
  );
}
