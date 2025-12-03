"use client";

import { forwardRef, useImperativeHandle } from "react";
import { toast } from "sonner";
import { ListingFormHandle } from "@/app/dashboard/vendor/my-listing/create/new-listing-content";
import { useListing } from "@/context/listing-form-context";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface Props {
  listingSlug: string;
}

export const ReviewSubmitStep = forwardRef<ListingFormHandle, Props>(
  ({ listingSlug }, ref) => {
    const { basicInfo, businessDetails, media } = useListing();

    useImperativeHandle(ref, () => ({
      async submit() {
        try {
          const token = localStorage.getItem("authToken");
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

          const res = await fetch(
            `${API_URL}/api/listing/${listingSlug}/show`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          if (!res.ok) throw new Error("Publish failed");
          toast.success("Listing Published!");
          return true;
        } catch (error) {
          // Removed unused 'e', used 'error'
          console.error(error);
          toast.error("Failed to publish");
          return false;
        }
      },
    }));

    return (
      <div className="space-y-6 px-4 py-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Publish & Plan</h2>
          <p className="text-sm text-muted-foreground">
            Review your details before publishing
          </p>
        </div>

        {/* Cover Photo */}
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
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No cover photo
            </div>
          )}
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">
                {basicInfo.name || "Untitled Listing"}
              </h3>
              <Button size="icon" variant="ghost">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Category:</strong> {basicInfo.category || "N/A"}
              </p>
              <p>
                <strong>Location:</strong> {businessDetails.location || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {businessDetails.email || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ReviewSubmitStep.displayName = "ReviewSubmitStep";
