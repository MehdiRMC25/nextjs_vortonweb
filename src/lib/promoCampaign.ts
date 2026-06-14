import { z } from 'zod'

/** Backend GET /promotions/active — Postgres show_on_home only. */
export const promoActiveApiSchema = z.object({
  active: z.boolean(),
  code: z.string().optional(),
  titleAz: z.string().optional(),
  titleEn: z.string().optional(),
  messageAz: z.string().optional(),
  messageEn: z.string().optional(),
})

export type PromoActiveResponse = z.infer<typeof promoActiveApiSchema>

export function parsePromoActiveResponse(data: unknown): PromoActiveResponse | null {
  const r = promoActiveApiSchema.safeParse(data)
  return r.success ? r.data : null
}

export function promoDismissId(data: PromoActiveResponse): string {
  const code = data.code?.trim()
  return code ? code.toUpperCase() : HOME_PROMO_DISMISS_ID
}

export function promoBillboardCopy(
    data: PromoActiveResponse,
    locale: 'az' | 'en'
): { title: string; message: string } {
  const title = (locale === 'az' ? data.titleAz : data.titleEn)?.trim() ?? ''
  const message = (locale === 'az' ? data.messageAz : data.messageEn)?.trim() ?? ''
  return { title, message }
}

/** Fixed id — API no longer sends campaignId. */
export const HOME_PROMO_DISMISS_ID = 'home-promo'

/**
 * How long close/shop hides the home billboard (ms).
 * 0 = show again on every home visit/refresh.
 * 30 * 60 * 1000 = 30 minutes.
 * 5 * 1000 = 5 seconds (testing).
 */
export const PROMO_DISMISS_TTL_MS = 30 * 60 * 1000

export function dismissStorageKey(campaignId: string): string {
  return `promo-dismiss:${campaignId}`
}

export function isCampaignDismissed(campaignId: string): boolean {
  if (typeof window === 'undefined') return false
  if (PROMO_DISMISS_TTL_MS <= 0) return false
  const raw = window.localStorage.getItem(dismissStorageKey(campaignId))
  if (!raw) return false
  const dismissedAt = Number(raw)
  if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) return false
  return Date.now() - dismissedAt < PROMO_DISMISS_TTL_MS
}

export function setCampaignDismissed(campaignId: string): void {
  if (typeof window === 'undefined') return
  if (PROMO_DISMISS_TTL_MS <= 0) return
  window.localStorage.setItem(dismissStorageKey(campaignId), String(Date.now()))
}