import { config } from '../config'

/** Backend must allow CORS for your frontend origin (e.g. http://localhost:5173, https://vorton.uk). */

/** Order payload sent with payment create; backend creates this order when payment confirms (FullyPaid). */
export type PaymentOrderPayload = {
  customer_id?: number
  customer_name: string
  mobile: string
  address?: string | null
  membership_level?: 'silver' | 'gold' | 'platinum' | 'none'
  order_date: string
  delivery_due_date?: string | null
  items: Array<{
    name: string
    quantity: number
    price: number
    sku_color?: string
    size?: string
    product_id?: string
  }>
  total_price: number
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
    [key: string]: unknown
  }
}

const PAYMENT_TIMEOUT_MS = 120_000 // Render free tier cold start can take 1–2 min; retry is usually fast

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
      const err = await res.text()
      throw new Error(err || `Payment API error ${res.status}`)
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
