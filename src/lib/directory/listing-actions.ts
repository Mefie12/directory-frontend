/**
 * The free listing action bar (V2 Phase 6.1, md files/V2-phase6-listing-actions-cta-spec.md §4.1).
 *
 * Every listing gets its contact actions at the top of its page, built only from
 * data the listing already has. Website and WhatsApp come from the API's `links`
 * field, which only holds links that pass the outbound-link policy.
 */

export type ListingActionKind =
  | "call"
  | "whatsapp"
  | "website"
  | "directions"
  | "email"
  | "tickets"
  | "register"
  | "online";

export interface ListingAction {
  kind: ListingActionKind;
  /** Visible text: every action has a text label (WCAG 2.5.3). */
  label: string;
  href: string;
  /** Opens in a new tab (web links); tel:/mailto: open in place. */
  external: boolean;
  /** For "call": the number to show and copy on devices that can't dial. */
  phone?: string;
}

export interface ListingActionSource {
  type?: string;
  phone?: string | null;
  email?: string | null;
  /** Policy-checked links from the API (`links`). */
  website?: string | null;
  whatsapp?: string | null;
  directionsUrl?: string | null;
  event?: {
    attendance_type?: string;
    purchase_method?: string;
    event_ticket_url?: string;
    registration_url?: string;
    online_access_policy?: string;
    event_online_url?: string;
  } | null;
}

/** Whether the listing action bar is switched on (Vercel env, default off; spec Q-11). */
export function isListingActionBarEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LISTING_ACTION_BAR === "true";
}

/** Only plain web links; anything else (javascript:, data:, relative) is dropped. */
function webUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** A dialable number: digits with an optional leading +, at least 6 digits. */
function dialable(phone?: string | null): string | null {
  const compact = phone?.replace(/[\s().-]/g, "") ?? "";
  return /^\+?\d{6,15}$/.test(compact) ? compact : null;
}

/** A plausible email address for a mailto: link. */
function emailAddress(email?: string | null): string | null {
  const trimmed = email?.trim() ?? "";
  return /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/.test(trimmed) ? trimmed : null;
}

/**
 * Ordered actions for a listing.
 * Business / community: Call, WhatsApp, Website, Directions, Email.
 * Event: Get tickets / Register, Join online, Directions (spec §4.1).
 */
export function buildListingActions(source: ListingActionSource): ListingAction[] {
  const actions: ListingAction[] = [];
  const directions = webUrl(source.directionsUrl);

  if (source.type === "event") {
    const event = source.event;
    const tickets =
      event?.attendance_type === "paid" && event.purchase_method === "external_url" ? webUrl(event.event_ticket_url) : null;
    const register =
      event?.attendance_type === "free_registration_required" ? webUrl(event.registration_url) : null;
    const online = event?.online_access_policy === "public_link" ? webUrl(event.event_online_url) : null;

    if (tickets) actions.push({ kind: "tickets", label: "Get tickets", href: tickets, external: true });
    if (register) actions.push({ kind: "register", label: "Register", href: register, external: true });
    if (online) actions.push({ kind: "online", label: "Join online", href: online, external: true });
    if (directions) actions.push({ kind: "directions", label: "Directions", href: directions, external: true });
    return actions;
  }

  const phone = dialable(source.phone);
  const whatsapp = webUrl(source.whatsapp);
  const website = webUrl(source.website);
  const email = emailAddress(source.email);

  if (phone) actions.push({ kind: "call", label: "Call", href: `tel:${phone}`, external: false, phone: source.phone?.trim() });
  if (whatsapp) actions.push({ kind: "whatsapp", label: "WhatsApp", href: whatsapp, external: true });
  if (website) actions.push({ kind: "website", label: "Website", href: website, external: true });
  if (directions) actions.push({ kind: "directions", label: "Directions", href: directions, external: true });
  if (email) actions.push({ kind: "email", label: "Email", href: `mailto:${email}`, external: false });

  return actions;
}

/**
 * Link attributes (spec Q-16): free links are never marked `sponsored`; contact
 * schemes (tel:, mailto:) and WhatsApp get no `rel`.
 */
export function actionRel(action: ListingAction): string | undefined {
  if (!action.external) return undefined;
  if (action.kind === "whatsapp") return "noopener noreferrer";
  return "nofollow noopener noreferrer";
}
