import { config } from '@/config'

const GUEST_PATH =
    process.env.NEXT_PUBLIC_CHECKOUT_PREVIEW_GUEST_PATH || 'checkout/preview-guest'

function guestPreviewUrl(): string {
  const base = config.ordersApiBaseUrl.replace(/\/$/, '')
  const path = GUEST_PATH.replace(/^\//, '')
  return `${base}/${path}`
}

function promoErrorCode(breakdown: Record<string, unknown>): string {
  const raw = breakdown.promo_error_code ?? breakdown.promoErrorCode
  return typeof raw === 'string' ? raw.trim().toUpperCase() : ''
}

/**
 * Same Postgres rules as cart/checkout — via checkout preview-guest API.
 */
export async function isPromoValidViaCheckoutPreview(promoCode: string): Promise<boolean> {
  const code = promoCode.trim().toUpperCase()
  if (!code) return false

  const items = [
    {
      name: 'Promo validation',
      quantity: 1,
      price: Number(process.env.PROMO_VALIDATE_STUB_PRICE || '100'),
      product_id: process.env.PROMO_VALIDATE_PRODUCT_ID || 'promo-validate-stub',
      sku_color: process.env.PROMO_VALIDATE_SKU_COLOR || 'STUB',
      size: process.env.PROMO_VALIDATE_SIZE || 'M',
    },
  ]

  const res = await fetch(guestPreviewUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      promo_code: code,
      delivery_country: process.env.PROMO_VALIDATE_COUNTRY || 'AZ',
      checkout_currency: 'AZN',
      items,
    }),
    cache: 'no-store',
  })

  if (!res.ok) return false

  const json = (await res.json()) as { breakdown?: Record<string, unknown> }
  const breakdown = json.breakdown ?? {}
  const err = promoErrorCode(breakdown)

  if (err === 'PROMO_EXPIRED' || err === 'INVALID_PROMO_CODE') return false
  return true
}

export function promoCodeFromCampaignPayload(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  const raw =
      (typeof o.promoCode === 'string' && o.promoCode) ||
      (typeof o.promo_code === 'string' && o.promo_code) ||
      ''
  return raw.trim().toUpperCase()
}