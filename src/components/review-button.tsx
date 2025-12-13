"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner"; // Assuming you are using sonner for toasts
import { useRouter } from "next/navigation";
import Image from "next/image";

export type Review = {
  author: string;
  rating: number;
  date: string;
  comment: string;
  avatar?: string;
};

const Divider = () => <div className="w-full h-px bg-gray-200 mt-5 mb-4" />;

interface ReviewsSectionProps {
  reviews: Review[];
  listingSlug: string; // Required for the API endpoint
}

export function ReviewsSection({ reviews, listingSlug }: ReviewsSectionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // 1. Validation
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (!text.trim()) {
      toast.error("Please write a comment");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("You must be logged in to leave a review");
      // Optional: router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      // 2. API Call
      const url = `${API_URL}/api/listing/${listingSlug}/rating`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: rating,
          comment: text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      // 3. Success Handling
      toast.success(
        "Review submitted successfully! It will appear after moderation."
      );
      setOpen(false);
      setRating(0);
      setText("");
      router.refresh(); // Refresh page to potentially show updated state
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-black">Reviews ({reviews.length})</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-md">
              <span className="text-gray-700 mr-2">
                <Star className="w-4 h-4" />
              </span>
              Leave Review
            </Button>
          </DialogTrigger>
          <DialogContent className="lg:max-w-xl">
            <DialogHeader className="text-left">
              <DialogTitle>Leave a review</DialogTitle>
              <DialogDescription>
                Share your experience to help others make informed decisions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Rate your experience</div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Rate ${i + 1}`}
                      onClick={() => setRating(i + 1)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          i + 1 <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Your review</div>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  disabled={isSubmitting}
                  placeholder="Tell others about your experience; what you liked and what you did not like"
                  className="h-32 w-full resize-none rounded-md border p-3 text-sm outline-none bg-gray-50 focus:bg-white transition-colors"
                />
                <div className="text-xs text-gray-500 text-right">
                  {text.length}/500 characters
                </div>
                <Divider />
                <div>
                  <p className="text-gray-500 text-sm">
                    Your review will be made public after moderation
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col lg:flex-row w-full gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#93C01F] hover:bg-[#84ad1b]"
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0 || text.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {reviews.length > 0 ? (
          reviews.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700 overflow-hidden">
                  {r.avatar ? (
                    <Image
                      src={r.avatar}
                      alt={r.author}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    r.author.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-900 font-black">{r.author}</div>
                    <div className="mt-1 text-xs text-gray-400">{r.date}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-4 w-4 ${
                          idx + 1 <= Math.round(r.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No reviews yet. Be the first to share your experience!
          </div>
        )}
      </div>
    </div>
  );
}
