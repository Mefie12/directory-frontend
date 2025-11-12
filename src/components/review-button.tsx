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
import { Star } from "lucide-react";
import { useState } from "react";
import { Textarea } from "./ui/textarea";

export type Review = {
  author: string;
  rating: number;
  date: string;
  comment: string;
};

const Divider = () => <div className="w-full h-px bg-gray-200 mt-5 mb-4" />;

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-black">Reviews ({reviews.length})</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-md">
              <span className="text-gray-700">
                <Star />
              </span>
              Leave Review
            </Button>
          </DialogTrigger>
          <DialogContent className="lg:max-w-xl">
            <DialogHeader className="text-left">
              <DialogTitle>Leave a review</DialogTitle>
              <DialogDescription>
                Share your experience to help others make informed decisions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Rate your experience</div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Rate ${i + 1}`}
                      onClick={() => setRating(i + 1)}
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
                  placeholder="Tell others about your experience; what you liked and what you did not like"
                  className="h-32 w-full resize-none rounded-md border p-3 text-sm outline-none bg-gray-100"
                />
                <div className="text-xs text-gray-500">
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
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#93C01F] hover:bg-[#84ad1b]"
                onClick={() => setOpen(false)}
              >
                Submit Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {reviews.map((r, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                {r.author.charAt(0).toUpperCase()}
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
        ))}
      </div>
    </div>
  );
}
