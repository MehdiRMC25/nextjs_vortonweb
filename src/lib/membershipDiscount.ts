import type { AuthUser, MembershipLevel } from '@/api/auth'

export function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

/** Lowercase, spaces → underscores — for tier string matching. */
export function normalizeMembershipTierKey(s: string | undefined): string {
  if (!s || typeof s !== 'string') return ''
  return s.trim().toLowerCase().replace(/\s+/g, '_')
}

/**
 * Table fallback when API does not send membership_discount_pct / fraction.
 * Platinum+ variants → 10%; platinum → 8%; gold 5%; silver 3%.
 */
export function membershipDiscountFractionFromTierKey(normalized: string): number {
  if (!normalized || normalized === 'none' || normalized === 'unknown') return 0
  if (normalized.startsWith('platinum')) {
    if (normalized.includes('plus')) return 0.1
    return 0.08
  }
  if (normalized === 'gold') return 0.05
  if (normalized === 'silver') return 0.03
  return 0
}

function fractionFromMembershipLevelEnum(level: MembershipLevel | undefined): number {
  if (!level) return 0
  if (level === 'platinum') return 0.08
  if (level === 'gold') return 0.05
  if (level === 'silver') return 0.03
  return 0
}

/**
 * Prefer server fields, then raw tier string (captures Platinum+), then enum level.
 */
export function membershipDiscountFractionFromAuthUser(user: AuthUser | null | undefined): number {
  if (!user) return 0

  const pct = user.membership_discount_pct
  if (typeof pct === 'number' && Number.isFinite(pct) && pct >= 0 && pct <= 100) {
    return roundMoney(pct / 100)
  }

  const fr = user.membership_discount_fraction
  if (typeof fr === 'number' && Number.isFinite(fr) && fr >= 0 && fr <= 1) {
    return roundMoney(fr)
  }

  const raw = typeof user.membership_tier_raw === 'string' ? user.membership_tier_raw.trim() : ''
  if (raw) {
    const fromRaw = membershipDiscountFractionFromTierKey(normalizeMembershipTierKey(raw))
    if (fromRaw > 0) return fromRaw
  }

  if (
    user.membership_level === 'silver' ||
    user.membership_level === 'gold' ||
    user.membership_level === 'platinum'
  ) {
    return fractionFromMembershipLevelEnum(user.membership_level)
  }

  return 0
}

/** @deprecated Prefer computeCheckoutMerchandiseSummary + membershipDiscountFractionFromAuthUser */
export function membershipDiscountRate(level: MembershipLevel | undefined): number {
  return fractionFromMembershipLevelEnum(level)
}

/** @deprecated Use computeCheckoutMerchandiseSummary for line-aware membership */
export function membershipDiscountFromEligibleAzn(
  eligibleMerchandiseAzn: number,
  level: MembershipLevel | undefined
): number {
  if (eligibleMerchandiseAzn <= 0 || !level) return 0
  const r = fractionFromMembershipLevelEnum(level)
  if (r <= 0) return 0
  return roundMoney(eligibleMerchandiseAzn * r)
}
