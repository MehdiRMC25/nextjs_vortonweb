/**
 * Order line items for checkout preview and payments/create — same shape, same builder.
 */
import type { AuthUser } from '@/api/auth'
import type { PaymentOrderPayload } from '@/api/payment'
import type { CartItem } from '@/types'
import {
  cartLineListAndEffective,
  lineExcludedFromRewardPoints,
} from '@/lib/checkoutMerchandise'
import { shippingZoneAndFee } from '@/lib/shippingAzn'

export type CheckoutOrderLineItem = PaymentOrderPayload['items'][number]

export function buildCheckoutOrderLineItems(
  cartItems: CartItem[],
  isAuthenticated: boolean,
  user: AuthUser | null | undefined,
  deliveryAddress: string,
  guestAddress: string
): CheckoutOrderLineItem[] {
  const { shippingAzn } = shippingZoneAndFee(isAuthenticated, user, deliveryAddress, guestAddress)
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
      ...(item.product.onSale === true && !excluded ? { promotional: true as const } : {}),
    }
  })
  if (shippingAzn > 0) {
    lines.push({
      name: 'Delivery',
      quantity: 1,
      price: shippingAzn,
      product_id: '__delivery__',
    })
  }
  return lines
}
