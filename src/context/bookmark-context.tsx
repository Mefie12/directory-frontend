"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

// Define the allowed types for bookmarks
export type BookmarkItemType = "business" | "event" | "community";

interface BookmarkContextType {
  bookmarkedIds: string[];
  isLoading: boolean;
  toggleBookmark: (itemId: string, type: BookmarkItemType) => Promise<void>;
  isBookmarked: (itemId: string) => boolean;
  refreshBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(
  undefined
);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
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
      // This endpoint should return an array of IDs of items the user has bookmarked
      const response = await fetch(`${API_URL}/api/user/bookmarks/ids`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure we handle the response structure correctly (e.g., data.ids or just data)
        const ids = Array.isArray(data) ? data : data.ids || [];
        setBookmarkedIds(ids.map(String)); // Ensure all IDs are strings
      }
    } catch (error) {
      console.error("Failed to sync bookmarks", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBookmark = async (itemId: string, type: BookmarkItemType) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("Authentication required", {
        description: "Please login to bookmark items",
      });
      return;
    }

    // Optimistic Update: Update UI immediately before API call
    const isCurrentlyBookmarked = bookmarkedIds.includes(itemId);

    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );

    try {
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";
      const method = isCurrentlyBookmarked ? "DELETE" : "POST";

      const response = await fetch(`${API_URL}/api/bookmarks/${itemId}`, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ type }), // Sending 'community', 'business', or 'event'
      });

      if (!response.ok) {
        throw new Error("Failed to update bookmark");
      }

      toast.success(
        isCurrentlyBookmarked ? "Removed from bookmarks" : "Saved to bookmarks"
      );
    } catch {
      // Revert change if API fails
      setBookmarkedIds((prev) =>
        isCurrentlyBookmarked
          ? [...prev, itemId]
          : prev.filter((id) => id !== itemId)
      );
      toast.error("Something went wrong", {
        description: "Could not update bookmark. Please try again.",
      });
    }
  };

  const isBookmarked = (itemId: string) => bookmarkedIds.includes(itemId);

  return (
    <BookmarkContext.Provider
      value={{
        bookmarkedIds,
        isLoading,
        toggleBookmark,
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
