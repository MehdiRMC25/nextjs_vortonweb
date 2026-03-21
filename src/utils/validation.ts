import { parsePhoneNumberWithError, type CountryCode } from 'libphonenumber-js'

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Validates email format. Returns true if valid or empty (empty not valid for required fields).
 */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) return false
  return EMAIL_REGEX.test(trimmed)
}

/**
 * Validates phone number. Uses libphonenumber-js; tries to infer country from +prefix or defaults to AZ.
 * Returns true only if the number is valid for the country.
 */
export function isValidPhone(value: string, defaultCountry: CountryCode = 'AZ'): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) return false
  try {
    const parsed = parsePhoneNumberWithError(trimmed, defaultCountry)
    return parsed.isValid()
  } catch {
    return false
  }
}

/**
 * Detects if a string looks like an email (contains @).
 */
export function looksLikeEmail(value: string): boolean {
  return value.trim().includes('@')
}
