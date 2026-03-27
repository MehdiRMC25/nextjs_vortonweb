/**
 * Checkout earn-rate estimate (UI only). Authoritative accrual is server-side.
 * See src/data/rewardPolicy.internal.md — thresholds use the same currency as cart subtotal (currently AZN / ₼).
 */
export const EARN_TIER_1_MAX = 72
export const EARN_TIER_2_MAX = 180

export const POINTS_PER_CURRENCY_UNIT = 11

export function earnRateFromEligibleSubtotal(eligibleSubtotal: number): number {
  if (eligibleSubtotal <= 0) return 0
  if (eligibleSubtotal <= EARN_TIER_1_MAX) return 0.02
  if (eligibleSubtotal <= EARN_TIER_2_MAX) return 0.035
  return 0.05
}

/** Matches internal policy: reward value × points rate, rounded down to whole points. */
export function estimatedEarnPointsFromEligible(eligibleSubtotal: number): number {
  const rate = earnRateFromEligibleSubtotal(eligibleSubtotal)
  if (rate <= 0) return 0
  return Math.max(0, Math.floor(eligibleSubtotal * rate * POINTS_PER_CURRENCY_UNIT))
}

export function formatEarnPercentLabel(rate: number): string {
  if (rate <= 0) return '0'
  const pct = rate * 100
  if (Number.isInteger(pct)) return String(pct)
  return pct.toFixed(1).replace(/\.0$/, '')
}
