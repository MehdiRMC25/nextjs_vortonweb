/**
 * Delivery zones: Baku, rest of Azerbaijan, international.
 * AZN amounts are authoritative for payments/create (__delivery__ line).
 * USD/GBP are for checkout display when the user selects that currency.
 */
import { config } from '@/config'
import type { AuthUser } from '@/api/auth'
import { roundMoney } from '@/lib/membershipDiscount'

export type ShippingZone = 'baku' | 'azerbaijan' | 'international'

export type CheckoutShippingCurrency = 'AZN' | 'USD' | 'GBP'

/** True if combined address/city text indicates delivery within Baku city. */
export function addressLooksLikeBaku(city: string | null | undefined, addressBlob: string | null | undefined): boolean {
  const s = [city, addressBlob].filter(Boolean).join(', ').toLowerCase()
  if (!s.trim()) return false
  return (
    /\b(baku|bakı|bakü|bak\s|баку)\b/i.test(s) ||
    /\bbak[iı]\b/i.test(s)
  )
}

function countryLooksLikeAzerbaijan(country: string | null | undefined): boolean {
  if (!country || !String(country).trim()) return false
  const u = String(country).trim().toLowerCase()
  if (u === 'az') return true
  return (
    u === 'aze' ||
    u.includes('azerbaijan') ||
    u.includes('azərbaycan') ||
    u === 'azerbaijan'
  )
}

/** Heuristic: guest free-text suggests delivery outside Azerbaijan. */
function guestAddressLooksInternational(addressBlob: string | null | undefined): boolean {
  if (!addressBlob || !addressBlob.trim()) return false
  const s = addressBlob.toLowerCase()
  return /\b(usa|united states|u\.s\.a\.|uk\b|united kingdom|england|scotland|wales|germany|france|italy|spain|netherlands|belgium|canada|australia|japan|china|india|turkey|türkiye|russia|poland|sweden|norway|denmark|finland|switzerland|austria|portugal|greece|ireland|mexico|brazil|argentina|south korea|singapore|uae|dubai|qatar|kuwait|saudi)\b/i.test(
    s
  )
}

export function detectShippingZone(args: {
  city?: string | null
  addressText?: string | null
  country?: string | null
}): ShippingZone {
  if (args.country != null && String(args.country).trim() && !countryLooksLikeAzerbaijan(args.country)) {
    return 'international'
  }
  if (guestAddressLooksInternational(args.addressText)) {
    return 'international'
  }
  if (addressLooksLikeBaku(args.city, args.addressText)) return 'baku'
  const blob = [args.city, args.addressText].filter(Boolean).join(', ').trim()
  if (!blob && config.shipping.unknownAddressUsesNational) return 'azerbaijan'
  if (!blob && !config.shipping.unknownAddressUsesNational) return 'baku'
  return 'azerbaijan'
}

/** AZN fee for zone — used on __delivery__ and server preview. */
export function shippingFeeAznForZone(zone: ShippingZone): number {
  const s = config.shipping
  if (zone === 'baku') return roundMoney(s.bakuAzn)
  if (zone === 'azerbaijan') return roundMoney(s.azerbaijanAzn)
  return roundMoney(s.internationalAzn)
}

/** Display amount for shipping row only (fixed table; not FX conversion). */
export function shippingFeeDisplayForZone(zone: ShippingZone, currency: CheckoutShippingCurrency): number {
  const s = config.shipping
  if (currency === 'USD') {
    if (zone === 'baku') return roundMoney(s.bakuUsd)
    if (zone === 'azerbaijan') return roundMoney(s.azerbaijanUsd)
    return roundMoney(s.internationalUsd)
  }
  if (currency === 'GBP') {
    if (zone === 'baku') return roundMoney(s.bakuGbp)
    if (zone === 'azerbaijan') return roundMoney(s.azerbaijanGbp)
    return roundMoney(s.internationalGbp)
  }
  return shippingFeeAznForZone(zone)
}

export function formatShippingDisplay(amount: number, currency: CheckoutShippingCurrency): string {
  if (currency === 'USD') return `$${amount.toFixed(2)}`
  if (currency === 'GBP') return `£${amount.toFixed(2)}`
  return `₼${amount.toFixed(2)}`
}

/**
 * Which fixed shipping table to show for the shipping row (payment remains AZN).
 * Driven by site language (and optional geo hint for English): az → AZN; en + GB → GBP; else en → USD.
 */
export function checkoutShippingDisplayCurrency(locale: string, geoCountry?: string): CheckoutShippingCurrency {
  const gc = (geoCountry ?? '').trim().toUpperCase()
  if (gc === 'AZ') return 'AZN'
  if (locale === 'az') return 'AZN'
  if (locale === 'en' && (gc === 'GB' || gc === 'UK')) return 'GBP'
  if (locale === 'en') return 'USD'
  return 'USD'
}

/** Guest vs logged-in: city, address blob, and country when available. */
export function checkoutDeliveryContext(
  isAuthenticated: boolean,
  user: AuthUser | null | undefined,
  deliveryAddress: string,
  guestAddress: string,
  guestDelivery?: { countryIso?: string; city?: string } | null
): { city: string | null; addressText: string | null; country: string | null } {
  if (isAuthenticated && user) {
    const addr =
      deliveryAddress.trim() ||
      (typeof user.address === 'string' && user.address.trim()
        ? user.address.trim()
        : [user.address_line1, user.address_line2, user.city, user.postcode, user.country]
            .filter(Boolean)
            .join(', ')
            .trim()) ||
      ''
    const city = typeof user.city === 'string' && user.city.trim() ? user.city.trim() : null
    const country = typeof user.country === 'string' && user.country.trim() ? user.country.trim() : null
    return { city, addressText: addr || null, country }
  }
  const city = guestDelivery?.city?.trim() || null
  const country = guestDelivery?.countryIso?.trim() || null
  const g = guestAddress.trim()
  return { city, addressText: g || null, country }
}

export function shippingZoneAndFee(
  isAuthenticated: boolean,
  user: AuthUser | null | undefined,
  deliveryAddress: string,
  guestAddress: string,
  guestDelivery?: { countryIso?: string; city?: string } | null
): { zone: ShippingZone; shippingAzn: number } {
  const ctx = checkoutDeliveryContext(isAuthenticated, user, deliveryAddress, guestAddress, guestDelivery)
  const zone = detectShippingZone({
    city: ctx.city,
    addressText: ctx.addressText,
    country: ctx.country,
  })
  return { zone, shippingAzn: shippingFeeAznForZone(zone) }
}
