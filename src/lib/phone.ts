import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js/min";

/**
 * Validates a phone number string against a specific country.
 * Accepts both local format (e.g. "020 1234 5678" for GB) and
 * international format (e.g. "+44 20 1234 5678").
 */
export function validatePhone(phone: string, iso2: string): boolean {
  if (!phone || !iso2) return false;
  const country = iso2.toUpperCase() as CountryCode;
  const parsed = parsePhoneNumberFromString(phone, country);
  return parsed?.isValid() ?? false;
}

/**
 * Validates a phone number already in international/E.164 format.
 * Used for WhatsApp numbers entered with a + prefix.
 */
export function validatePhoneInternational(phone: string): boolean {
  if (!phone) return false;
  const parsed = parsePhoneNumberFromString(phone);
  return parsed?.isValid() ?? false;
}

/**
 * Strips the country dial code prefix and leading zeros from a full phone string
 * to produce the local subscriber number the backend expects.
 * e.g. "+44 020 1234 5678" with dialCode "+44" → "2012345678"
 */
export function cleanPhone(fullPhone: string, dialCode: string): string {
  if (!fullPhone) return "";
  const digits = fullPhone.replace(/\D/g, "");
  const codeDigits = dialCode.replace(/\D/g, "");
  const local = digits.startsWith(codeDigits) ? digits.slice(codeDigits.length) : digits;
  return local.replace(/^0+/, "");
}
