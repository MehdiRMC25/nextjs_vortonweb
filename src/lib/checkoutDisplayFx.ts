/**
 * Convert AZN amounts to the checkout display currency (UI only; payment stays AZN).
 */
import { config } from '@/config'
import type { CheckoutQuoteCurrency } from '@/api/checkoutPreview'
import { roundMoney } from '@/lib/membershipDiscount'
import { formatShippingDisplay, type CheckoutShippingCurrency } from '@/lib/shippingAzn'

export function aznToDisplayAmount(azn: number, currency: CheckoutQuoteCurrency): number {
  if (!Number.isFinite(azn)) return 0
  if (currency === 'AZN') return roundMoney(azn)
  const { aznPerUsd, aznPerGbp } = config.displayFx
  if (currency === 'USD') {
    if (!aznPerUsd || aznPerUsd <= 0) return roundMoney(azn)
    return roundMoney(azn / aznPerUsd)
  }
  if (!aznPerGbp || aznPerGbp <= 0) return roundMoney(azn)
  return roundMoney(azn / aznPerGbp)
}

export function formatCheckoutMoneyFromAzn(azn: number, currency: CheckoutQuoteCurrency): string {
  const v = aznToDisplayAmount(azn, currency)
  return formatShippingDisplay(v, currency as CheckoutShippingCurrency)
}
