"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export type BookmarkItemType = "business" | "event" | "community";

interface BookmarkContextType {
  bookmarkedSlugs: string[]; // Changed to track Slugs since Toggle uses Slug
  isLoading: boolean;
  toggleBookmark: (slug: string) => Promise<void>; // Uses Slug
  deleteBookmarkById: (bookmarkId: string | number) => Promise<void>; // Uses Bookmark ID
  isBookmarked: (slug: string) => boolean;
  refreshBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(
  undefined
);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  // We track Slugs for the UI state because the Toggle API relies on them
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch initial state on load
  useEffect(() => {
    refreshBookmarks();
  }, []);

  const refreshBookmarks = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";
      // This endpoint should ideally return the list of SLUGS the user has bookmarked
      const response = await fetch(`${API_URL}/api/user/bookmarks/id`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Assuming the API returns a list of slugs or IDs.
        // We cast to string to be safe.
        const items = Array.isArray(data) ? data : data.data || [];
        setBookmarkedSlugs(items.map(String));
      }
    } catch (error) {
      console.error("Failed to sync bookmarks", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. Toggle Bookmark (Uses Slug POST API) ---
  const toggleBookmark = async (slug: string) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("Authentication required", {
        description: "Please login to bookmark items",
      });
      return;
    }

    // Optimistic Update: Update UI immediately
    const isCurrentlyBookmarked = bookmarkedSlugs.includes(slug);

    setBookmarkedSlugs((prev) =>
      isCurrentlyBookmarked ? prev.filter((s) => s !== slug) : [...prev, slug]
    );

    try {
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      // API: POST /api/listings/{slug}/bookmark/toggle
      const response = await fetch(
        `${API_URL}/api/listings/${slug}/bookmark/toggle`,
        {
          method: "POST", // API docs say POST for toggle
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          // Body is usually empty for this specific toggle route structure
          // unless your API specifically asks for { type: ... }
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle bookmark");
      }

      const result = await response.json();

      toast.success(
        result.message ||
          (isCurrentlyBookmarked
            ? "Removed from bookmarks"
            : "Added to bookmarks")
      );
    } catch (error) {
      // Revert optimistic update if API fails
      setBookmarkedSlugs((prev) =>
        isCurrentlyBookmarked ? [...prev, slug] : prev.filter((s) => s !== slug)
      );
      console.error(error);
      toast.error("Could not update bookmark");
    }
  };

  // --- 3. Delete Bookmark by ID (Uses Delete API) ---
  // Use this when you have the specific Bookmark ID (e.g., from a user dashboard list)
  const deleteBookmarkById = async (bookmarkId: string | number) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      // API: DELETE /api/bookmark/{id}
      const response = await fetch(`${API_URL}/api/bookmark/${bookmarkId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete bookmark");
      }

      toast.success("Bookmark removed");
      // Ideally refresh the list to sync state, as we don't know the slug here easily
      refreshBookmarks();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete bookmark");
    }
  };

  const isBookmarked = (slug: string) => bookmarkedSlugs.includes(slug);

  return (
    <BookmarkContext.Provider
      value={{
        bookmarkedSlugs,
        isLoading,
        toggleBookmark,
        deleteBookmarkById,
        isBookmarked,
        refreshBookmarks,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export const useBookmark = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error("useBookmark must be used within a BookmarkProvider");
  }
  return context;
};
