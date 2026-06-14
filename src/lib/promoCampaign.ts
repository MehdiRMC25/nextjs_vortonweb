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