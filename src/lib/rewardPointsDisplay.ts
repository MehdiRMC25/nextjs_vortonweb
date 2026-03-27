/** Normalise API `points_earned` (number or numeric string) for UI. */
export function orderPointsEarned(order: { points_earned?: unknown }): number {
  const v = order.points_earned
  if (typeof v === 'number' && v > 0) return Math.round(v)
  if (typeof v === 'string') {
    const n = parseInt(v, 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  }
  return 0
}
