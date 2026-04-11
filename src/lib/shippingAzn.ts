/**
 * Delivery fee zones for Azerbaijan checkout (Baku vs outside Baku).
 * Amounts come from config / NEXT_PUBLIC_* — keep in sync with backend charging rules.
 */
import { config } from '@/config'
import type { AuthUser } from '@/api/auth'
import { roundMoney } from '@/lib/membershipDiscount'

export type ShippingZone = 'baku' | 'national'

/** True if combined address/city text indicates delivery within Baku city. */
export function addressLooksLikeBaku(city: string | null | undefined, addressBlob: string | null | undefined): boolean {
  const s = [city, addressBlob].filter(Boolean).join(', ').toLowerCase()
  if (!s.trim()) return false
  // Latin / common variants; Bakı in Unicode
  return /\b(baku|bakı|bakü|bak\s)\b/i.test(s) || /\bbak[iı]\b/i.test(s)
}

export function detectShippingZone(args: {
  city?: string | null
  addressText?: string | null
}): ShippingZone {
  if (addressLooksLikeBaku(args.city, args.addressText)) return 'baku'
  const blob = [args.city, args.addressText].filter(Boolean).join(', ').trim()
  if (!blob && config.shipping.unknownAddressUsesNational) return 'national'
  if (!blob && !config.shipping.unknownAddressUsesNational) return 'baku'
  return 'national'
}

export function shippingFeeAznForZone(zone: ShippingZone): number {
  const { bakuAzn, nationalAzn } = config.shipping
  const n = zone === 'baku' ? bakuAzn : nationalAzn
  return roundMoney(n)
}

/** Guest vs logged-in: single blob for zone detection. */
export function checkoutDeliveryContext(
  isAuthenticated: boolean,
  user: AuthUser | null | undefined,
  deliveryAddress: string,
  guestAddress: string
): { city: string | null; addressText: string | null } {
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
    return { city, addressText: addr || null }
  }
  const g = guestAddress.trim()
  return { city: null, addressText: g || null }
}

export function shippingZoneAndFee(
  isAuthenticated: boolean,
  user: AuthUser | null | undefined,
  deliveryAddress: string,
  guestAddress: string
): { zone: ShippingZone; shippingAzn: number } {
  const ctx = checkoutDeliveryContext(isAuthenticated, user, deliveryAddress, guestAddress)
  const zone = detectShippingZone(ctx)
  return { zone, shippingAzn: shippingFeeAznForZone(zone) }
}
