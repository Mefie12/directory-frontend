"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { PublicContactForm } from "@/components/dashboard/listing/form/public-contact";
import { SocialMediaForm } from "@/components/dashboard/listing/form/social-media";

interface Props { listingSlug: string; }

export const EventContactSocialStep = forwardRef<ListingFormHandle, Props>(({ listingSlug }, ref) => {
  const contactRef = useRef<ListingFormHandle>(null);
  const socialRef = useRef<ListingFormHandle>(null);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      const [contactSaved, socialsSaved] = await Promise.all([
        contactRef.current?.submit() ?? true,
        socialRef.current?.submit() ?? true,
      ]);

      return Boolean(contactSaved && socialsSaved);
    },
  }));

  return <div className="space-y-10">
    <div><h1 className="text-2xl font-semibold">Social media & public contact</h1><p className="text-sm text-muted-foreground">Optionally add public ways attendees can follow or contact this Event.</p></div>
    <section><PublicContactForm ref={contactRef} listingSlug={listingSlug} /></section>
    <section className="border-t pt-8"><SocialMediaForm ref={socialRef} listingType="event" listingSlug={listingSlug} /></section>
  </div>;
});

EventContactSocialStep.displayName = "EventContactSocialStep";
