import { parsePhoneNumberWithError, type CountryCode } from 'libphonenumber-js'
import tlds from 'tlds'

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/** IANA TLD list (via `tlds` package) — rejects fake suffixes like `.comg` / `.comgg`. */
const VALID_TLDS = new Set(tlds as readonly string[])

function emailRightmostLabel(hostname: string): string | null {
  const host = hostname.trim().toLowerCase().replace(/\.+$/, '')
  if (!host) return null
  const labels = host.split('.').filter(Boolean)
  if (labels.length < 2) return null
  return labels[labels.length - 1] ?? null
}

/**
 * Validates email format and TLD (same idea as mobile app: only real IANA TLDs).
 * Returns true if valid or empty (empty not valid for required fields).
 */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) return false
  if (!EMAIL_REGEX.test(trimmed)) return false
  const at = trimmed.lastIndexOf('@')
  if (at < 1) return false
  const domain = trimmed.slice(at + 1)
  const tld = emailRightmostLabel(domain)
  if (!tld) return false
  return VALID_TLDS.has(tld)
}

/**
 * Validates phone for Azerbaijan by default: libphonenumber `isValid()` plus
 * national number length 9 when the number resolves to country AZ (mobile/landline NSN).
 */
export function isValidPhone(value: string, defaultCountry: CountryCode = 'AZ'): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0) return false
  try {
    const parsed = parsePhoneNumberWithError(trimmed, defaultCountry)
    if (!parsed.isValid()) return false
    if (parsed.country === 'AZ') {
      const national = String(parsed.nationalNumber)
      if (national.length !== 9) return false
    }
    return true
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
