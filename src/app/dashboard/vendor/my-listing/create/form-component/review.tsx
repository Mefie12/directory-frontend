import { useListing } from "@/context/listing-form-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  listingSlug: string;
  onSubmit?: () => void;
};

export function ReviewSubmitStep({ listingSlug, onSubmit }: Props) {
  const { basicInfo, businessDetails, media } = useListing();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (!listingSlug) {
        throw new Error("Listing ID is missing");
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const API_URL = process.env.API_URL || "https://me-fie.co.uk";
      const endpoint = `${API_URL}/api/listing/{listing_slug}/show`; // listingId is the slug

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "published",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to publish listing");
      }

      toast.success("Listing published successfully!");
      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to publish listing"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Publish & Plan</h2>
        <p className="text-sm text-muted-foreground">
          Choose a listing and fill out the forms
        </p>
      </div>

      {/* Cover Photo Section */}
      <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
        {media.coverPhoto ? (
          <Image
            src={URL.createObjectURL(media.coverPhoto)}
            alt="Cover"
            className="w-full h-full object-cover"
            width={480}
            height={320}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No cover photo uploaded
          </div>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 rounded-full h-10 w-10"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Information Card */}
      <Card className="relative">
        <CardContent className="p-6 space-y-6">
          {/* Two Column Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            <div className="space-y-1">
              <span className="text-sm font-medium">Business name:</span>
              <span className="text-sm text-muted-foreground ml-1">
                {basicInfo.name || "Not provided"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium">Category:</span>
              <span className="text-sm text-muted-foreground ml-1 capitalize">
                {basicInfo.category || "Not provided"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium">Location:</span>
              <span className="text-sm text-muted-foreground ml-1">
                {businessDetails.location || "Not provided"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium">Address:</span>
              <span className="text-sm text-muted-foreground ml-1">
                {businessDetails.address || "Not provided"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium">Email Address:</span>
              <span className="text-sm text-muted-foreground ml-1">
                {businessDetails.email || "Not provided"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium">Business hours:</span>
              <span className="text-sm text-muted-foreground ml-1">
                {businessDetails.businessHours.filter(
                  (schedule) => schedule.enabled
                ).length > 0
                  ? businessDetails.businessHours
                      .filter((schedule) => schedule.enabled)
                      .map((schedule) => `${schedule.day.slice(0, 3)}`)
                      .join(", ") +
                    ", " +
                    businessDetails.businessHours.filter(
                      (schedule) => schedule.enabled
                    )[0]?.startTime +
                    " - " +
                    businessDetails.businessHours.filter(
                      (schedule) => schedule.enabled
                    )[0]?.endTime +
                    "hrs"
                  : "Not specified"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium">Tags:</span>
              <span className="text-sm text-muted-foreground ml-1 capitalize">
                {businessDetails.tags.length > 0
                  ? businessDetails.tags.join(", ")
                  : "Not provided"}
              </span>
            </div>
          </div>

          {/* Description Box */}
          <div className="bg-[#F7FCE9] border border-[#9ACC23] rounded-lg p-4">
            <p className="text-sm">
              {basicInfo.description || "No description provided"}
            </p>
          </div>
        </CardContent>

        {/* Edit Button */}
        <div className="absolute top-4 right-4">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full h-10 w-10"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Image Gallery */}
      {media.images.length > 0 && (
        <div className="flex gap-4">
          {media.images.map((file, i) => (
            <div
              key={i}
              className="relative w-48 h-32 rounded-lg overflow-hidden group"
            >
              <Image
                src={URL.createObjectURL(file)}
                alt={`Preview ${i + 1}`}
                width={480}
                height={320}
                className="w-full h-full object-cover"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {i === 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  +{media.images.length - 2}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t border-gray-100 mt-8">
        <Button
          onClick={handleFinalSubmit}
          className="bg-[#93C01F] text-white hover:bg-[#82ab1b]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish Listing"
          )}
        </Button>
      </div>
    </div>
  );
}
