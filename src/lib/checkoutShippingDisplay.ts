import type { CheckoutPreviewBreakdown } from '@/api/checkoutPreview'
import type { CheckoutQuoteCurrency } from '@/api/checkoutPreview'
import { formatCheckoutMoneyFromAzn } from '@/lib/checkoutDisplayFx'
import { formatShippingDisplay, type CheckoutShippingCurrency } from '@/lib/shippingAzn'

function qcNorm(c: string | undefined): string {
  return (c ?? '').toUpperCase().trim()
}

/**
 * Prefer server quote when currency matches checkout; otherwise convert AZN (API or fallback) using config FX.
 */
export function shippingLineLabelFromBreakdown(
  breakdown: CheckoutPreviewBreakdown | null,
  clientFallbackShippingAzn: number,
  checkoutCurrency: CheckoutQuoteCurrency
): string {
  const cur = checkoutCurrency
  if (breakdown) {
    const qa = breakdown.shippingQuoteAmount
    const qc = qcNorm(
      typeof breakdown.shippingQuoteCurrency === 'string' ? breakdown.shippingQuoteCurrency : undefined
    )
    if (typeof qa === 'number' && Number.isFinite(qa) && ['AZN', 'USD', 'GBP'].includes(qc)) {
      if (qc === cur) {
        return formatShippingDisplay(qa, qc as CheckoutShippingCurrency)
      }
    }
    const sa = breakdown.shippingAzn
    if (typeof sa === 'number' && Number.isFinite(sa)) {
      return formatCheckoutMoneyFromAzn(sa, cur)
    }
  }
  return formatCheckoutMoneyFromAzn(clientFallbackShippingAzn, cur)
}
