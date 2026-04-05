import { config } from '@/config'

/**
 * Kapital Bank expects a registered HTTPS callback. The mobile app uses
 * `https://vorton.uk/payment/done`. Sending `http://localhost:3000/payment/done` from local dev
 * often causes the bank API to fail (500/HTML), while the simulator works because it uses the same URL as mobile.
 */
export function getPaymentReturnUrl(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  const explicit = config.paymentReturnUrl?.trim()
  if (explicit) {
    return explicit
  }

  const host = window.location.hostname
  const isLocalDev =
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.local')

  if (isLocalDev) {
    return `${config.siteUrl}/payment/done`
  }

  return `${window.location.origin}/payment/done`
}
