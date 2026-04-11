import { getCountryCallingCode, parsePhoneNumberWithError, type CountryCode } from 'libphonenumber-js'

/** E.164 string for payment / order mobile. */
export function guestPhoneToE164(iso: CountryCode, nationalDigits: string): string {
  const n = nationalDigits.replace(/\D/g, '')
  if (!n) return ''
  const cc = getCountryCallingCode(iso)
  return `+${cc}${n}`
}

export function isValidGuestPhone(iso: CountryCode, nationalDigits: string): boolean {
  const full = guestPhoneToE164(iso, nationalDigits)
  if (full.length < 8) return false
  try {
    return parsePhoneNumberWithError(full).isValid()
  } catch {
    return false
  }
}
