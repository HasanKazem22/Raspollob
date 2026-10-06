/** Bangladeshi mobile numbers: 11 digits, "01" + operator digit 3–9 + 8 digits. */
export const BD_PHONE_LENGTH = 11;

/** Accepts the local form, plus +88 / 88 prefixes (the backend accepts the same). */
export const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

export const BD_PHONE_ERROR = "Enter a valid 11-digit mobile number (e.g. 01712345678)";

/**
 * Cleans typed or pasted input into the local 11-digit form:
 * "+880 1712-345678" → "01712345678". Extra digits are dropped.
 */
export function normalizePhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  // Country code: 8801XXXXXXXXX → 01XXXXXXXXX
  if (digits.startsWith("880")) digits = digits.slice(2);
  return digits.slice(0, BD_PHONE_LENGTH);
}

export function isValidBdPhone(value: string | undefined | null): boolean {
  return !!value && BD_PHONE_REGEX.test(value.trim());
}
