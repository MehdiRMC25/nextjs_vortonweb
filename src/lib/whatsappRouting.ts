export type WhatsAppRoutingInput = {
  isAuthenticated: boolean
  userCountry?: string
  locale?: string
  geoCountry?: string
  phoneAz?: string
  phoneIntl?: string
  phoneLegacy?: string
  phoneFallback?: string
}

export function toDigits(value: string | undefined): string {
  if (!value) return ''
  return value.replace(/[^\d]/g, '')
}

function normalizedText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

export function isAzerbaijanCountry(value: string | undefined): boolean {
  const raw = normalizedText(value)
  if (!raw) return false
  const compact = raw.replace(/\s+/g, '')
  return (
    compact === 'az' ||
    compact === 'azerbaijan' ||
    compact === 'azərbaycan' ||
    compact === 'azerbaycan'
  )
}

function isAzStorefront(locale: string | undefined, geoCountry: string | undefined): boolean {
  if (normalizedText(locale) === 'az') return true
  return isAzerbaijanCountry(geoCountry)
}

/**
 * Region-aware phone selection with legacy fallback:
 * - AZ path: AZ -> legacy -> Intl
 * - Intl path: Intl -> legacy -> AZ
 */
export function selectWhatsAppDigits(input: WhatsAppRoutingInput): string {
  const az = toDigits(input.phoneAz)
  const intl = toDigits(input.phoneIntl)
  const legacy = toDigits(input.phoneLegacy)
  const fallback = toDigits(input.phoneFallback)

  if (input.isAuthenticated) {
    const userCountry = normalizedText(input.userCountry)
    if (userCountry) {
      if (isAzerbaijanCountry(userCountry)) return az || legacy || intl || fallback || ''
      return intl || legacy || az || fallback || ''
    }
  }

  // Signed-out or signed-in with missing country: use storefront/geo as fallback.
  const useAzPath = isAzStorefront(input.locale, input.geoCountry)
  if (!input.isAuthenticated && !input.locale && !input.geoCountry) {
    // Unknown visitor region: explicit fallback number, defaulting to AZ path.
    return fallback || az || legacy || intl || ''
  }

  if (useAzPath) return az || legacy || intl || ''
  return intl || legacy || az || ''
}

export function buildWhatsAppHref(digits: string, message?: string): string {
  const base = `https://wa.me/${digits}`
  const trimmed = (message ?? '').trim()
  if (!trimmed) return base
  return `${base}?text=${encodeURIComponent(trimmed)}`
}
