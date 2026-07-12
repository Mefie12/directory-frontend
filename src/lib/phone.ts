import { CountryCode, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js/min";

export type NormalizedPhone = {
  countryCode: string;
  e164: string;
  nationalNumber: string;
};

function getCountry(iso2: string): CountryCode | null {
  if (!iso2 || !/^[a-z]{2}$/i.test(iso2)) return null;
  return iso2.toUpperCase() as CountryCode;
}

/**
 * Parses a number entered for a selected country into one canonical shape.
 * The phone input may provide either national input ("020 7123 4567") or an
 * international value containing the national trunk prefix ("+44 020 ...").
 */
export function normalizePhone(phone: string, iso2: string): NormalizedPhone | null {
  const country = getCountry(iso2);
  if (!phone?.trim() || !country) return null;

  try {
    const parsed = parsePhoneNumberFromString(phone, country);
    // Compare calling codes, not ISO country codes. The +1 NANP zone (US, CA,
    // BM, JM, …) shares one calling code but resolves to different countries by
    // area code, so a strict country match falsely rejects valid siblings
    // (e.g. a +1 441 Bermuda number entered under the US flag).
    if (!parsed?.isValid() || parsed.countryCallingCode !== getCountryCallingCode(country)) {
      return null;
    }

    return {
      countryCode: `+${getCountryCallingCode(country)}`,
      e164: parsed.number,
      nationalNumber: parsed.nationalNumber,
    };
  } catch {
    return null;
  }
}

/**
 * Removes a national trunk prefix when the phone input has already included
 * the selected country's international calling code. For example, UK users
 * entering "+44 0200..." see "+44 200..." instead. Countries whose leading
 * zero is significant in international format (such as Italy) are preserved.
 */
export function normalizePhoneInput(phone: string, iso2: string): string {
  const country = getCountry(iso2);
  if (!phone?.startsWith("+") || !country) return phone;

  try {
    const callingCode = getCountryCallingCode(country);
    const enteredDigits = phone.replace(/\D/g, "");
    const expectedPrefix = `${callingCode}0`;
    const parsed = parsePhoneNumberFromString(phone, country);

    if (
      enteredDigits.startsWith(expectedPrefix) &&
      parsed?.number?.startsWith(`+${callingCode}`) &&
      parsed.number.replace(/\D/g, "") !== enteredDigits
    ) {
      return parsed.number;
    }
  } catch {
    // Keep the typed value when it cannot yet be parsed.
  }

  return phone;
}

/**
 * Validates a phone number against a specific country.
 *
 * Accepts a complete national or international number for the selected country.
 */
export function validatePhone(phone: string, iso2: string): boolean {
  return normalizePhone(phone, iso2) !== null;
}

/** Returns a user-facing validation message, or null when the phone is valid. */
export function getPhoneValidationError(phone: string, iso2: string): string | null {
  if (!phone?.trim()) return "Phone number is required";
  if (normalizePhone(phone, iso2)) return null;

  const country = getCountry(iso2);
  if (country) {
    try {
      const enteredDigits = phone.replace(/\D/g, "");
      if (enteredDigits === getCountryCallingCode(country)) {
        return `Enter the rest of the phone number after +${enteredDigits}`;
      }
    } catch {
      // The generic validation message below covers unsupported country codes.
    }
  }

  return "Please enter a complete valid phone number for the selected country";
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
  const parsed = parsePhoneNumberFromString(fullPhone);
  if (parsed?.isValid()) return parsed.nationalNumber;

  const digits = fullPhone.replace(/\D/g, "");
  const codeDigits = dialCode.replace(/\D/g, "");
  const local = digits.startsWith(codeDigits) ? digits.slice(codeDigits.length) : digits;
  return local.replace(/^0+/, "");
}
