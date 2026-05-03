import { z } from 'zod'

export const promoCampaignApiSchema = z.object({
  active: z.boolean(),
  campaignId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  promoCode: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().url().optional(),
  endsAt: z.string().optional(),
})

export type PromoCampaignPayload = z.infer<typeof promoCampaignApiSchema>

export function parsePromoCampaignPayload(data: unknown): PromoCampaignPayload | null {
  const r = promoCampaignApiSchema.safeParse(data)
  return r.success ? r.data : null
}

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

export function parseEndsAt(endsAt: string | undefined): Date | null {
  if (!endsAt) return null
  const d = new Date(endsAt)
  return Number.isNaN(d.getTime()) ? null : d
}