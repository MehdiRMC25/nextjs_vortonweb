import { config } from '@/config'

/** Matches payement-backend checkout preview JSON (camelCase + optional snake_case). */
export type CheckoutPreviewBreakdown = {
  payableTotalAzn: number
  merchandiseSubtotalAzn?: number
  membershipDiscountAzn?: number
  pointsDiscountAzn?: number
  shippingAzn?: number
  [key: string]: unknown
}

export type CheckoutPreviewResponse = {
  ok: boolean
  audience: 'guest' | 'member'
  note?: string
  breakdown: CheckoutPreviewBreakdown
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

async function readPreviewError(res: Response): Promise<string> {
  const t = await res.text()
  if (!t.trim()) return `CHECKOUT_PREVIEW_${res.status}`
  try {
    const j = JSON.parse(t) as { error?: string; message?: string }
    const m = (typeof j.error === 'string' && j.error.trim()) || (typeof j.message === 'string' && j.message.trim())
    if (m) return m.length > 500 ? 'CHECKOUT_PREVIEW_ERROR' : m
  } catch {
    /* ignore */
  }
  return t.length > 200 ? 'CHECKOUT_PREVIEW_ERROR' : t
}

const MEMBER_PREVIEW_PATH =
  process.env.NEXT_PUBLIC_CHECKOUT_PREVIEW_PATH || 'checkout/preview'
const GUEST_PREVIEW_PATH =
  process.env.NEXT_PUBLIC_CHECKOUT_PREVIEW_GUEST_PATH || 'checkout/preview-guest'

export type PreviewMemberBody = {
  items: unknown[]
  points_to_redeem?: number
}

/**
 * Authenticated member preview — same breakdown shape as guest; server applies membership + points.
 */
export async function postCheckoutPreview(
  token: string,
  body: PreviewMemberBody,
  signal?: AbortSignal
): Promise<CheckoutPreviewResponse> {
  const payload: Record<string, unknown> = { items: body.items }
  if (body.points_to_redeem != null && body.points_to_redeem > 0) {
    payload.points_to_redeem = Math.floor(body.points_to_redeem)
  }
  const res = await fetch(apiV1Url(MEMBER_PREVIEW_PATH), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    signal,
  })
  if (!res.ok) {
    throw new Error(await readPreviewError(res))
  }
  return parsePreviewResponse(await res.json())
}

/**
 * Guest preview — items only; no points (server rejects points_to_redeem &gt; 0).
 */
export async function postCheckoutPreviewGuest(
  body: { items: unknown[] },
  signal?: AbortSignal
): Promise<CheckoutPreviewResponse> {
  const res = await fetch(apiV1Url(GUEST_PREVIEW_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: body.items }),
    signal,
  })
  if (!res.ok) {
    throw new Error(await readPreviewError(res))
  }
  return parsePreviewResponse(await res.json())
}
