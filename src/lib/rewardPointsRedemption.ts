/** Mirrors payment backend / `src/data/rewardPolicy.internal.md` redemption rules (keep in sync). */
export const POINTS_PER_AZN = 11
export const REDEMPTION_MAX_PERCENT = 100

export function discountAznFromRedeemPoints(points: number): number {
  if (points <= 0) return 0
  return Math.round((points / POINTS_PER_AZN) * 100) / 100
}

export function maxRedeemablePoints(grossMerchandiseAzn: number, balancePoints: number): number {
  if (grossMerchandiseAzn <= 0 || balancePoints <= 0) return 0
  const maxDisc =
    Math.round(grossMerchandiseAzn * (REDEMPTION_MAX_PERCENT / 100) * 100) / 100
  const cap = Math.min(maxDisc, grossMerchandiseAzn)
  let p = Math.min(balancePoints, Math.ceil(cap * POINTS_PER_AZN))
  while (p > 0 && discountAznFromRedeemPoints(p) > cap + 0.001) p -= 1
  while (p > 0 && discountAznFromRedeemPoints(p) > grossMerchandiseAzn + 0.001) p -= 1
  return p
}

const MIN_CARD_PAY_AZN = 0.01

/** Avoid a net total below the minimum payment amount validators allow. */
export function clampRedemptionForMinPayable(grossAzn: number, requestedPoints: number): number {
  let p = Math.max(0, Math.floor(requestedPoints))
  while (p > 0 && grossAzn - discountAznFromRedeemPoints(p) < MIN_CARD_PAY_AZN - 1e-9) {
    p -= 1
  }
  return p
}
