/**
 * Order line items for checkout preview and payments/create — same shape.
 * __delivery__ price must match server preview (AZN).
 */
import type { PaymentOrderPayload } from '@/api/payment'
import type { CartItem } from '@/types'
import {
  cartLineListAndEffective,
  lineExcludedFromRewardPoints,
} from '@/lib/checkoutMerchandise'

export type CheckoutOrderLineItem = PaymentOrderPayload['items'][number]

/**
 * @param deliveryLinePriceAzn — `null` = omit __delivery__ (e.g. POST /checkout/preview with server-side shipping from country).
 */
export function buildCheckoutOrderLineItems(
  cartItems: CartItem[],
  deliveryLinePriceAzn: number | null
): CheckoutOrderLineItem[] {
  const lines: CheckoutOrderLineItem[] = cartItems.map((item) => {
    const basis = cartLineListAndEffective(item)
    const v = item.product.variants?.[item.variantIndex]
    const excluded = lineExcludedFromRewardPoints(item)
    return {
      name: item.product.name,
      quantity: item.quantity,
      price: basis.listUnit,
      ...(basis.isPromotional
        ? { discounted_price: basis.effectiveUnit, discountedPrice: basis.effectiveUnit }
        : {}),
      sku_color: v?.skuColor ?? item.product.sku,
      size: item.size || undefined,
      product_id: item.product.id,
      ...(excluded ? { is_discounted: true as const } : {}),
      ...(basis.isPromotional ? { promotional: true as const } : {}),
    }
  })
  if (deliveryLinePriceAzn != null && deliveryLinePriceAzn > 0) {
    lines.push({
      name: 'Delivery',
      quantity: 1,
      price: deliveryLinePriceAzn,
      product_id: '__delivery__',
    })
  }
  return lines
}
