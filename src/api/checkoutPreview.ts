import { config } from '@/config'

export type CheckoutQuoteCurrency = 'AZN' | 'USD' | 'GBP'

/** Matches payement-backend checkout preview JSON (camelCase + optional snake_case). */
export type CheckoutPreviewBreakdown = {
  payableTotalAzn: number
  merchandiseSubtotalAzn?: number
  membershipDiscountAzn?: number
  pointsDiscountAzn?: number
  shippingAzn?: number
  /** Server-provided quote for the shipping row (preferred for display). */
  shippingQuoteAmount?: number
  shippingQuoteCurrency?: string
  shippingInternationalFeeUsd?: number
  shippingDomesticFeeAzn?: number
  shippingZone?: string
  shippingCountryIso2?: string
  [key: string]: unknown
}

export type CheckoutPreviewResponse = {
  ok: boolean
  audience: 'guest' | 'member'
  note?: string
  breakdown: CheckoutPreviewBreakdown
}

export class CheckoutPreviewRequestError extends Error {
  readonly code: string
  readonly countryIso2?: string

  constructor(opts: { code: string; message: string; countryIso2?: string }) {
    super(opts.message)
    this.name = 'CheckoutPreviewRequestError'
    this.code = opts.code
    this.countryIso2 = opts.countryIso2
  }
}

function apiV1Url(path: string): string {
  const base = config.ordersApiBaseUrl.replace(/\/$/, '')
  const p = path.replace(/^\//, '')
  return `${base}/${p}`
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function parseBreakdown(raw: unknown): CheckoutPreviewBreakdown {
  if (!raw || typeof raw !== 'object') {
    throw new Error('CHECKOUT_PREVIEW_INVALID')
  }
  const b = raw as Record<string, unknown>
  const payable =
    num(b.payableTotalAzn) ??
    num(b.payable_total_azn) ??
    num((b as { payable?: unknown }).payable)
  if (payable == null || !Number.isFinite(payable)) {
    throw new Error('CHECKOUT_PREVIEW_NO_PAYABLE')
  }
  return {
    ...b,
    payableTotalAzn: payable,
    merchandiseSubtotalAzn:
      num(b.merchandiseSubtotalAzn) ??
      num(b.merchandise_subtotal_azn) ??
      num(b.merchandiseExclShippingAzn) ??
      num(b.merchandise_excl_shipping_azn),
    membershipDiscountAzn:
      num(b.membershipDiscountAzn) ?? num(b.membership_discount_azn) ?? num(b.membershipDiscount),
    pointsDiscountAzn: num(b.pointsDiscountAzn) ?? num(b.points_discount_azn),
    shippingAzn: num(b.shippingAzn) ?? num(b.shipping_azn),
    shippingQuoteAmount: num(b.shippingQuoteAmount) ?? num(b.shipping_quote_amount),
    shippingQuoteCurrency:
      typeof b.shippingQuoteCurrency === 'string'
        ? b.shippingQuoteCurrency
        : typeof b.shipping_quote_currency === 'string'
          ? b.shipping_quote_currency
          : undefined,
    shippingInternationalFeeUsd:
      num(b.shippingInternationalFeeUsd) ?? num(b.shipping_international_fee_usd),
    shippingDomesticFeeAzn: num(b.shippingDomesticFeeAzn) ?? num(b.shipping_domestic_fee_azn),
    shippingZone: typeof b.shippingZone === 'string' ? b.shippingZone : typeof b.shipping_zone === 'string' ? b.shipping_zone : undefined,
    shippingCountryIso2:
      typeof b.shippingCountryIso2 === 'string'
        ? b.shippingCountryIso2
        : typeof b.shipping_country_iso2 === 'string'
          ? b.shipping_country_iso2
          : undefined,
  } as CheckoutPreviewBreakdown
}

function parsePreviewResponse(json: unknown): CheckoutPreviewResponse {
  if (!json || typeof json !== 'object') throw new Error('CHECKOUT_PREVIEW_INVALID')
  const o = json as Record<string, unknown>
  const breakdown = parseBreakdown(o.breakdown)
  const audience = o.audience === 'guest' || o.audience === 'member' ? o.audience : 'member'
  return {
    ok: Boolean(o.ok),
    audience,
    note: typeof o.note === 'string' ? o.note : undefined,
    breakdown,
  }
}

async function parsePreviewFailure(res: Response): Promise<never> {
  const t = await res.text()
  let j: Record<string, unknown> = {}
  try {
    j = t.trim() ? (JSON.parse(t) as Record<string, unknown>) : {}
  } catch {
    throw new CheckoutPreviewRequestError({
      code: `HTTP_${res.status}`,
      message: t.length > 200 ? 'CHECKOUT_PREVIEW_ERROR' : t || 'Preview failed',
    })
  }
  const code =
    (typeof j.code === 'string' && j.code.trim()) ||
    (typeof j.error === 'string' && j.error === 'SHIPPING_UNAVAILABLE' ? 'SHIPPING_UNAVAILABLE' : '') ||
    ''
  const countryIso2 =
    (typeof j.countryIso2 === 'string' && j.countryIso2) ||
    (typeof j.country_iso2 === 'string' && j.country_iso2) ||
    undefined
  const msg =
    (typeof j.message === 'string' && j.message.trim()) ||
    (typeof j.error === 'string' && j.error.trim() && j.error !== 'SHIPPING_UNAVAILABLE' ? j.error : '') ||
    'Preview failed'

  if (code === 'SHIPPING_UNAVAILABLE' || j.error === 'SHIPPING_UNAVAILABLE') {
    throw new CheckoutPreviewRequestError({
      code: 'SHIPPING_UNAVAILABLE',
      message: msg,
      countryIso2,
    })
  }
  throw new CheckoutPreviewRequestError({
    code: code || `HTTP_${res.status}`,
    message: msg.length > 500 ? 'CHECKOUT_PREVIEW_ERROR' : msg,
    countryIso2,
  })
}

const MEMBER_PREVIEW_PATH =
  process.env.NEXT_PUBLIC_CHECKOUT_PREVIEW_PATH || 'checkout/preview'
const GUEST_PREVIEW_PATH =
  process.env.NEXT_PUBLIC_CHECKOUT_PREVIEW_GUEST_PATH || 'checkout/preview-guest'

export type PreviewDeliveryContext = {
  delivery_country: string
  /** Required for domestic Azerbaijan routing when applicable. */
  delivery_city?: string | null
  checkout_currency: CheckoutQuoteCurrency
}

export type PreviewMemberBody = PreviewDeliveryContext & {
  items: unknown[]
  points_to_redeem?: number
}

function mergePreviewPayload(
  body: PreviewMemberBody | (PreviewDeliveryContext & { items: unknown[] })
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    items: body.items,
    delivery_country: body.delivery_country.trim(),
    checkout_currency: body.checkout_currency,
  }
  if (body.delivery_city != null && String(body.delivery_city).trim() !== '') {
    payload.delivery_city = String(body.delivery_city).trim()
  }
  if ('points_to_redeem' in body && body.points_to_redeem != null && body.points_to_redeem > 0) {
    payload.points_to_redeem = Math.floor(body.points_to_redeem)
  }
  return payload
}

/**
 * Authenticated member preview — JWT + items + delivery + checkout_currency + optional points.
 */
export async function postCheckoutPreview(
  token: string,
  body: PreviewMemberBody,
  signal?: AbortSignal
): Promise<CheckoutPreviewResponse> {
  const res = await fetch(apiV1Url(MEMBER_PREVIEW_PATH), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(mergePreviewPayload(body)),
    signal,
  })
  if (!res.ok) {
    await parsePreviewFailure(res)
  }
  return parsePreviewResponse(await res.json())
}

/**
 * Guest preview — items + delivery + checkout_currency (no JWT).
 */
export async function postCheckoutPreviewGuest(
  body: PreviewDeliveryContext & { items: unknown[] },
  signal?: AbortSignal
): Promise<CheckoutPreviewResponse> {
  const res = await fetch(apiV1Url(GUEST_PREVIEW_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mergePreviewPayload(body)),
    signal,
  })
  if (!res.ok) {
    await parsePreviewFailure(res)
  }
  return parsePreviewResponse(await res.json())
}

export function isCheckoutPreviewRequestError(e: unknown): e is CheckoutPreviewRequestError {
  return e instanceof CheckoutPreviewRequestError
}
