export type ListingType = "business" | "community" | "event";
export type ListingStepState = "not_started" | "needs_attention" | "complete" | "optional";

export interface ListingFormStep {
  id: number;
  key: string;
  title: string;
  description: string;
  optional?: boolean;
}

export interface ReadinessBlocker {
  code: string;
  message: string;
  step: string;
  field: string;
  severity: "required";
}

export interface ListingReadiness {
  is_complete: boolean;
  missing_count: number;
  blockers: ReadinessBlocker[];
  can_submit: boolean;
  can_resubmit: boolean;
  changed_since_review_began: boolean;
  review_submitted_at: string | null;
  review_content_updated_at: string | null;
  step_states: Array<{ step: string; state: ListingStepState; blocker_count: number }>;
  recommendations: Array<{ code: string; message: string; step: string }>;
}

export const LISTING_JOURNEYS: Record<ListingType, ListingFormStep[]> = {
  business: [
    { id: 1, key: "basic_information", title: "Basics", description: "Name, category and description" },
    { id: 2, key: "location_operations", title: "Location & operations", description: "Headquarters, reach and availability" },
    { id: 3, key: "media", title: "Media", description: "Cover and gallery" },
    { id: 4, key: "preview", title: "Preview", description: "Readiness and submission" },
  ],
  community: [
    { id: 1, key: "basic_information", title: "Basics", description: "Name, category and description" },
    { id: 2, key: "reach_participation", title: "Reach & participation", description: "Scope and how people participate" },
    { id: 3, key: "contact_links", title: "Contact & links", description: "Public ways to connect" },
    { id: 4, key: "media", title: "Media", description: "Cover and gallery" },
    { id: 5, key: "preview", title: "Preview", description: "Readiness and submission" },
  ],
  event: [
    { id: 1, key: "basic_information", title: "Basics", description: "Title, category and summary" },
    { id: 2, key: "date_time_format", title: "Date & time", description: "Schedule and timezone" },
    { id: 3, key: "location_online_access", title: "Location / online access", description: "Format, venue and access plan" },
    { id: 4, key: "registration_tickets", title: "Registration & tickets", description: "Attendance and ticket details" },
    { id: 5, key: "media", title: "Media", description: "Cover and gallery" },
    { id: 6, key: "contact_social", title: "Social media & public contact", description: "Optional ways for attendees to connect", optional: true },
    { id: 7, key: "preview", title: "Preview & submit", description: "Final readiness and submission" },
  ],
};

export function creatorStatusLabel(status: string, creatorStatus?: string): string {
  return ({
    draft: "Draft",
    pending: "In review",
    in_review: "In review",
    approved: "Published",
    published: "Published",
    rejected: "Rejected",
    suspended: "Suspended",
    ended: "Ended",
  } as Record<string, string>)[creatorStatus ?? status] ?? status;
}
