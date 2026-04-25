import { config } from '../config'

/** Backend must allow CORS for your frontend origin (e.g. http://localhost:5173, https://vorton.uk). */

/** Order payload sent with payment create; backend creates this order when payment confirms (FullyPaid). */
export type PaymentOrderPayload = {
  customer_id?: number
  customer_name: string
  mobile: string
  address?: string | null
  membership_level?: 'silver' | 'gold' | 'platinum' | 'platinum_plus' | 'none'
  order_date: string
  delivery_due_date?: string | null
  items: Array<{
    name: string
    quantity: number
    /** Catalogue list unit; server applies membership on non-promo lines. */
    price: number
    /** Promo/sale unit when below list — server skips membership stacking on these lines. */
    discounted_price?: number
    /** Same as discounted_price; some API layers use camelCase. */
    discountedPrice?: number
    sku_color?: string
    size?: string
    product_id?: string
    /** When true, line is excluded from reward-point earning subtotal */
    is_discounted?: boolean
    promotional?: boolean
  }>
  total_price: number
  /** Whole points to redeem; omit when paying full price. */
  points_to_redeem?: number
  /** From POST /auth/checkout-delivery — linked to the order after payment. */
  delivery_contact_log_id?: number
  /** ISO country for server shipping (align with checkout preview). */
  delivery_country?: string
  /** City — used for Azerbaijan domestic routing when applicable. */
  delivery_city?: string | null
  /** Display / quote currency used at checkout (AZN | USD | GBP). */
  checkout_currency?: string
}

export type CreatePaymentRequest = {
  amount: number
  currency: string
  reference: string
  returnUrl: string
  /** Optional. When payment confirms, backend creates this order and emits order_created. */
  order?: PaymentOrderPayload
}

export type CreatePaymentResponse = {
  paymentId: string
  bankOrderId: string
  bankOrderSecret: string
  status: string
  amount: number
  currency: string
  reference: string
  redirectUrl: string
  paymentUrl: string
  createdAt: string
  /** When payment succeeds and order is created, backend returns the order. */
  createdOrder?: {
    id: string
    order_number: string
    customer_name: string
    mobile: string
    address: string | null
    items: Array<{ name: string; quantity: number; price: number; sku_color?: string; size?: string }>
    total_price: number
    order_date: string
    points_earned?: number
    points_redeemed?: number
    reward_discount_azn?: number
    [key: string]: unknown
  }
}

const PAYMENT_TIMEOUT_MS = 120_000 // Render free tier cold start can take 1–2 min; retry is usually fast

/** Use in checkout to show translated copy instead of raw gateway text. */
export const PAYMENT_ERROR_GENERIC = 'PAYMENT_GATEWAY_UNAVAILABLE'

/**
 * Internal validation / accounting copy from the API — never show raw to customers.
 * Checkout maps this to `paymentFailedMessage`.
 */
export const PAYMENT_ERROR_FAILED_GENERIC = 'PAYMENT_FAILED_GENERIC'

/** Replace backend-only wording with a stable client code before throwing. */
function normalizePaymentErrorMessage(raw: string): string {
  const m = raw.trim()
  if (!m) return PAYMENT_ERROR_GENERIC
  if (/payment amount must equal/i.test(m)) return PAYMENT_ERROR_FAILED_GENERIC
  if (/merchandise excl/i.test(m)) return PAYMENT_ERROR_FAILED_GENERIC
  return m
}

/** Never surface raw HTML or huge JSON bodies from the payment API in the UI. */
function messageFromPaymentErrorResponse(status: number, bodyText: string): string {
  const t = bodyText.trim()
  if (!t) {
    return PAYMENT_ERROR_GENERIC
  }
  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t) as {
        error?: string
        message?: string
        expectedPayableAzn?: number
        computed?: { expectedPayableAzn?: number }
      }
      const msg = (typeof j.error === 'string' && j.error.trim()) || (typeof j.message === 'string' && j.message.trim())
      if (msg) {
        if (msg.length > 800 || /<html|<!DOCTYPE/i.test(msg)) {
          return PAYMENT_ERROR_GENERIC
        }
        const normalized = normalizePaymentErrorMessage(msg)
        const expected = j.expectedPayableAzn ?? j.computed?.expectedPayableAzn
        const devHint =
          process.env.NODE_ENV === 'development' && typeof expected === 'number'
            ? ` [dev: expected ${expected} AZN]`
            : ''
        return normalized + devHint
      }
    } catch {
      /* not JSON */
    }
  }
  if (/<!DOCTYPE|<html/i.test(t) || t.length > 800) {
    return PAYMENT_ERROR_GENERIC
  }
  if (t.length > 400) {
    return PAYMENT_ERROR_GENERIC
  }
  return normalizePaymentErrorMessage(t)
}

/** Call after redirect from bank: confirms payment and triggers backend to create order + emit order_created for Delivery and Order Tracking. */
export async function confirmPayment(bankOrderId: string, status: string): Promise<CreatePaymentResponse | null> {
  const base = config.paymentApiUrl.replace(/\/$/, '')
  const path = base.includes('/api/v1') ? '/payments/confirm' : '/api/v1/payments/confirm'
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}?ID=${encodeURIComponent(bankOrderId)}&STATUS=${encodeURIComponent(status)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function createPayment(body: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PAYMENT_TIMEOUT_MS)

  try {
    const url = `${config.paymentApiUrl}${config.paymentCreatePath.startsWith('/') ? '' : '/'}${config.paymentCreatePath}`
  const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(messageFromPaymentErrorResponse(res.status, errText))
    }
    return res.json()
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        throw new Error('PAYMENT_TIMEOUT')
      }
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        throw new Error('PAYMENT_CORS_OR_NETWORK')
      }
    }
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
}
