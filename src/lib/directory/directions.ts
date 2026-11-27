/**
 * Directions to a listing (V2 Phase 6.1, decision C-7).
 *
 * Extracted unchanged from ListingLocationCard so the location card and the
 * listing action bar always build the same Google Maps link: coordinates when
 * known, otherwise the listing name plus its cleaned address. No API key needed;
 * on phones it opens the Maps app.
 */

export interface DirectionsTarget {
  name: string;
  addressParts: Array<string | null | undefined>;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** A trimmed address part, or null for blanks and parts that are really links. */
export function cleanLocationPart(value?: string | null): string | null {
  const part = value?.trim();
  if (!part || /^(?:https?:\/\/|www\.)/i.test(part)) return null;
  return part;
}

/** Address parts plus country, cleaned and de-duplicated (case-insensitive), in order. */
export function locationParts(addressParts: DirectionsTarget["addressParts"], country?: string | null): string[] {
  const seen = new Set<string>();
  return [...addressParts, cleanLocationPart(country)]
    .map(cleanLocationPart)
    .filter((part): part is string => {
      if (!part) return false;
      const key = part.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function hasCoordinates(latitude?: number | null, longitude?: number | null): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}

/** The destination string, or "" when there is nothing to navigate to. */
export function directionsDestination({ name, addressParts, country, latitude, longitude }: DirectionsTarget): string {
  if (hasCoordinates(latitude, longitude)) return `${latitude},${longitude}`;
  const label = locationParts(addressParts, country).join(", ");
  // A name alone is not a place: only offer directions when there is an address too.
  return label ? [name, label].filter(Boolean).join(" ") : "";
}

/** Google Maps directions URL, or null when the listing has no location to navigate to. */
export function buildDirectionsUrl(target: DirectionsTarget): string | null {
  const destination = directionsDestination(target);
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
}
