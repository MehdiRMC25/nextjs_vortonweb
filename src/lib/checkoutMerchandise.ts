/**
 * Checkout merchandise math: promo vs catalogue lines, membership on catalogue only (mobile parity).
 * Display / client-side only — payment API must recompute server-side.
 */
import type { AuthUser } from '@/api/auth'
import type { CartItem } from '@/types'
import { membershipDiscountFractionFromAuthUser, roundMoney } from '@/lib/membershipDiscount'

export const CHECKOUT_PRICE_EPS = 0.005

export type CartLinePriceBasis = {
  listUnit: number
  effectiveUnit: number
  /** Promotional: do not stack membership; charge effective unit only. */
  isPromotional: boolean
}

/** List price vs effective sell price (promo when strictly below list). */
export function cartLineListAndEffective(item: CartItem): CartLinePriceBasis {
  const p = item.product
  const v = p.variants?.[item.variantIndex]
  if (v) {
    const list = roundMoney(v.price)
    const dp = v.discountedPrice
    const isPromotional = dp != null && dp < list - CHECKOUT_PRICE_EPS
    const effective = roundMoney(isPromotional ? dp! : list)
    return { listUnit: list, effectiveUnit: effective, isPromotional }
  }
  const list = roundMoney(p.price)
  const sp = p.salePrice
  const isPromotional = sp != null && sp < list - CHECKOUT_PRICE_EPS
  const effective = roundMoney(isPromotional ? sp! : list)
  return { listUnit: list, effectiveUnit: effective, isPromotional }
}

/**
 * Unit price charged after membership rules (member: % off list on catalogue lines only).
 */
export function unitPriceAtCheckout(
  basis: CartLinePriceBasis,
  opts: { applyMembership: boolean; fraction: number }
): number {
  if (!opts.applyMembership || opts.fraction <= 0 || basis.isPromotional) {
    return basis.effectiveUnit
  }
  return roundMoney(basis.listUnit * (1 - opts.fraction))
}

/**
 * Lines below list / marked sale or discount — excluded from reward-point earning subtotal (unchanged policy).
 */
export function lineExcludedFromRewardPoints(item: CartItem): boolean {
  const p = item.product
  const v = p.variants?.[item.variantIndex]
  const listPrice = v != null ? v.price : p.price
  const basis = cartLineListAndEffective(item)
  const paid = basis.effectiveUnit
  if (paid < listPrice - CHECKOUT_PRICE_EPS) return true
  if (v?.isDiscounted === true) return true
  if (p.onSale === true && p.salePrice != null && p.salePrice < p.price - CHECKOUT_PRICE_EPS) return true
  return false
}

export function cartItemKey(item: CartItem): string {
  return `${item.product.id}\u0000${item.variantIndex}\u0000${item.size}`
}

export type CheckoutMerchandiseSummary = {
  /** Sum of effective unit × qty (promo or list); membership not applied. */
  subtotalBeforeMembership: number
  /** Sum of charged unit × qty after membership on eligible catalogue lines. */
  merchandiseSubtotalAfterMembership: number
  membershipDiscountAzn: number
  membershipFraction: number
  applyMembership: boolean
  /** Charged unit price per cart line key. */
  unitPriceByKey: Map<string, number>
  /** Basis per cart line key (for tests / debugging). */
  basisByKey: Map<string, CartLinePriceBasis>
  /** Post-membership eligible subtotal for points earn estimate (non-promo policy lines). */
  eligibleSubtotalPostMembership: number
}

export function computeCheckoutMerchandiseSummary(
  items: CartItem[],
  isAuthenticated: boolean,
  user: AuthUser | null | undefined
): CheckoutMerchandiseSummary {
  const applyMembership = Boolean(isAuthenticated && user)
  const fraction = applyMembership ? membershipDiscountFractionFromAuthUser(user) : 0

  let subtotalBeforeMembership = 0
  let merchandiseSubtotalAfterMembership = 0
  let eligibleSubtotalPostMembership = 0

  const unitPriceByKey = new Map<string, number>()
  const basisByKey = new Map<string, CartLinePriceBasis>()

  for (const item of items) {
    const basis = cartLineListAndEffective(item)
    const key = cartItemKey(item)
    basisByKey.set(key, basis)

    const unit = unitPriceAtCheckout(basis, { applyMembership, fraction })
    unitPriceByKey.set(key, unit)

    const qty = item.quantity
    subtotalBeforeMembership += roundMoney(basis.effectiveUnit * qty)
    merchandiseSubtotalAfterMembership += roundMoney(unit * qty)

    if (!lineExcludedFromRewardPoints(item)) {
      eligibleSubtotalPostMembership += roundMoney(unit * qty)
    }
  }

  subtotalBeforeMembership = roundMoney(subtotalBeforeMembership)
  merchandiseSubtotalAfterMembership = roundMoney(merchandiseSubtotalAfterMembership)
  eligibleSubtotalPostMembership = roundMoney(eligibleSubtotalPostMembership)

  const membershipDiscountAzn = roundMoney(
    Math.max(0, subtotalBeforeMembership - merchandiseSubtotalAfterMembership)
  )

  return {
    subtotalBeforeMembership,
    merchandiseSubtotalAfterMembership,
    membershipDiscountAzn,
    membershipFraction: fraction,
    applyMembership,
    unitPriceByKey,
    basisByKey,
    eligibleSubtotalPostMembership,
  }
}

/** Display / payload: effective line total (promo/list), no membership in row. */
export function effectiveLineTotalAzn(item: CartItem): number {
  const basis = cartLineListAndEffective(item)
  return roundMoney(basis.effectiveUnit * item.quantity)
}
