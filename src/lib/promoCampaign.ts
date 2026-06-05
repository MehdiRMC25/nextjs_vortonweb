import { z } from 'zod'

/** Backend GET /promotions/active — Postgres show_on_home only. */
export const promoActiveApiSchema = z.object({
  active: z.boolean(),
})

export type PromoActiveResponse = z.infer<typeof promoActiveApiSchema>

export function parsePromoActiveResponse(data: unknown): PromoActiveResponse | null {
  const r = promoActiveApiSchema.safeParse(data)
  return r.success ? r.data : null
}

/** Fixed id — API no longer sends campaignId. */
export const HOME_PROMO_DISMISS_ID = 'home-promo'

export function dismissStorageKey(campaignId: string): string {
  return `promo-dismiss:${campaignId}`
}

export function isCampaignDismissed(campaignId: string): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(dismissStorageKey(campaignId)) === '1'
}

export function setCampaignDismissed(campaignId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(dismissStorageKey(campaignId), '1')
}