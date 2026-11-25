// V2 Phase 1 organization types (md files/V2-phase1-release-1.4-api-contract.md).

/** V2 Phase 4.3: the public "by <Organization>" summary. Sent only for verified organizations while the backend flag is on. */
export interface PublicOrganization {
  name: string;
  slug: string;
  verified: boolean;
}

export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export type OrgPermission =
  | "organization.view"
  | "organization.update"
  | "members.view"
  | "members.manage"
  | "ownership.transfer"
  | "organization.archive"
  | "activity.view"
  | "listing.view"
  | "listing.create"
  | "listing.update"
  | "listing.media"
  | "listing.submit"
  | "listing.archive"
  | "review.reply"
  | "analytics.view"
  | "claim.submit"
  | "billing.manage";

export type OrgEntityKind =
  | "company"
  | "sole_trader"
  | "charity"
  | "association"
  | "informal_group"
  | "other";

/** One of the current user's memberships (auth payload and GET /organizations). */
export interface OrganizationMembership {
  id: number;
  slug: string;
  name: string;
  country: string | null;
  status: "active" | "suspended" | "archived";
  /** Present while archived or suspended. */
  status_reason?: string | null;
  profile_completed: boolean;
  listings_count: number | null;
  role: OrgRole;
  is_primary_owner: boolean;
  permissions: OrgPermission[];
}

/** An organization profile (GET/POST/PATCH /organizations…). */
export interface Organization {
  id: number;
  slug: string;
  name: string;
  country: string | null;
  type: "standard" | "agency";
  entity_kind: OrgEntityKind | null;
  status: "active" | "suspended" | "archived";
  status_reason?: string | null;
  verification_status: string;
  creation_source: "onboarding" | "claim" | "backfill" | "admin";
  profile_completed: boolean;
  listings_count?: number;
  /** Only present for callers with organization.update. */
  email?: string | null;
  primary_phone?: string | null;
  created_at: string;
}

export interface OrganizationDetail {
  data: Organization;
  membership: {
    role: OrgRole;
    is_primary_owner: boolean;
    permissions: OrgPermission[];
  };
}

export interface OrganizationMember {
  user_id: number;
  name: string;
  /** Only present for callers with members.manage. */
  email?: string;
  role: OrgRole;
  is_primary_owner: boolean;
  joined_at: string;
}

export interface CreateOrganizationInput {
  name: string;
  country: string;
  entity_kind?: OrgEntityKind | null;
}

export type UpdateOrganizationInput = Partial<{
  name: string;
  country: string;
  entity_kind: OrgEntityKind | null;
  email: string | null;
  primary_phone: string | null;
  mark_profile_complete: boolean;
}>;

/** An organization the claimant may claim into (claim_eligibility). */
export interface EligibleOrganization {
  id: number;
  slug: string;
  name: string;
  role: OrgRole;
}

/** What the claimant chose as the claim's destination. */
export type ClaimTargetChoice =
  | { mode: "existing"; organizationId: number }
  | { mode: "new"; name: string; country: string }
  | { mode: "default" };

/** Admin preview of where approving a claim puts the listing. */
export interface ClaimTargetPreview {
  type: "existing" | "new";
  source: "chosen" | "proposed" | "default";
  organization: { id: number; slug: string; name: string } | null;
  name: string;
  country: string | null;
}

export const ORG_ROLE_LABEL: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export const ORG_ENTITY_KIND_LABEL: Record<OrgEntityKind, string> = {
  company: "Company",
  sole_trader: "Sole trader",
  charity: "Charity",
  association: "Association",
  informal_group: "Informal group",
  other: "Other",
};

/** A listing row as returned by GET /organizations/{slug}/listings (ListingResource subset used by the org hub). */
export interface OrganizationListingItem {
  id: number;
  slug: string;
  name: string;
  type: "business" | "event" | "community";
  status: "draft" | "pending" | "approved" | "rejected" | "suspended" | "changes_requested";
  claim_status?: string | null;
  images?: { original: string; thumb?: string; card?: string; webp?: string }[];
  created_at?: string;
}

/** Laravel paginator envelope for the organization listings endpoint. */
export interface OrganizationListingsPage {
  data: OrganizationListingItem[];
  meta?: { current_page: number; last_page: number; total: number; per_page: number };
}

// ── V2 Phase 2: teams (invites, member management, activity) ────────────────

export type InviteStatus = "pending" | "accepted" | "declined" | "revoked" | "expired";

/** A pending invite as listed to team managers. */
export interface OrganizationInvite {
  id: number;
  email: string;
  role: OrgRole;
  status: InviteStatus;
  invited_by?: { id: number; name: string } | null;
  expires_at: string;
  last_sent_at: string | null;
  resend_count: number;
  created_at: string;
}

/** Public preview behind an invite link (GET /invites/{token}). */
export interface InvitePreview {
  organization: { name: string };
  role: OrgRole;
  email: string;
  invited_by: string | null;
  expires_at: string;
  account_exists: boolean;
}

export interface ActivityEntry {
  id: number;
  action: string;
  actor: { id: number | null; name: string } | null;
  target: { id: number; name: string } | null;
  details: { role?: string; from?: string; to?: string; listings_moved?: number; rejoined?: boolean; reason?: string; listings_suspended?: number; listings_restored?: number };
  created_at: string;
}

export interface ActivityPage {
  data: ActivityEntry[];
  current_page: number;
  last_page: number;
}

export const ACTIVITY_LABEL: Record<string, string> = {
  "organization.invite.sent": "sent an invitation",
  "organization.invite.resent": "resent an invitation",
  "organization.invite.revoked": "revoked an invitation",
  "organization.invite.accepted": "accepted an invitation",
  "organization.invite.declined": "declined an invitation",
  "organization.member.added": "added a member",
  "organization.member.role_changed": "changed a member's role",
  "organization.member.removed": "removed a member",
  "organization.member.left": "left the organization",
  "organization.ownership.transferred": "transferred primary ownership",
  "organization.archived": "archived the organization",
  "organization.restored": "restored the organization",
  "organization.suspended": "suspended the organization",
  "organization.unsuspended": "restored the organization",
  "organization.listings.restored": "returned suspended listings to review",
};

// ── V2 Phase 2.4: lifecycle ────────────────────────────────────────────────

/** A listing that blocks archiving (HTTP 409, reason archive_blocked). */
export interface ArchiveBlockingListing {
  id: number;
  slug: string;
  name: string;
}

/** Admin list/detail shapes (GET /admin/organizations…). */
export interface AdminOrganizationRow extends Organization {
  active_memberships_count?: number;
}

export interface AdminOrganizationDetail {
  data: Organization;
  members: (OrganizationMember & { status: string })[];
  listings: { id: number; slug: string; name: string; type: string; status: string; archived: boolean }[];
}

export interface AdminOrganizationPage {
  data: AdminOrganizationRow[];
  meta?: { current_page: number; last_page: number; total: number };
}

// ── V2 Phase 2.6: sensitive-field review ───────────────────────────────────

/** One held field of a live listing: the live value and the proposed one. */
export interface PendingReviewField {
  field: string;
  current: unknown;
  proposed: unknown;
  /** Category names, present for field category_ids. */
  current_labels?: string[];
  proposed_labels?: string[];
}

/** A held change (GET /listing/{slug}/pending_review, and in save responses). */
export interface PendingReview {
  revision_id: number;
  status: "pending" | "changes_requested";
  moderation_reason: string | null;
  submitted_at: string | null;
  fields: PendingReviewField[];
}

export interface SensitiveReviewItem {
  id: number;
  status: string;
  revision_version: number;
  submitted_at: string | null;
  author: { id: number; name: string } | null;
  listing: {
    id: number;
    slug: string;
    name: string;
    status: string;
    organization: { id: number; name: string; status: string } | null;
  };
  review: PendingReview | null;
}

export interface SensitiveReviewPage {
  data: SensitiveReviewItem[];
  current_page: number;
  last_page: number;
}

export const SENSITIVE_FIELD_LABEL: Record<string, string> = {
  name: "Name",
  email: "Contact email",
  category_ids: "Categories",
  country: "Country",
  city: "City",
  address: "Address",
  google_plus_code: "Plus code",
  latitude: "Latitude",
  longitude: "Longitude",
  event_venue_address: "Venue address",
  event_city: "Event city",
  event_country: "Event country",
};
