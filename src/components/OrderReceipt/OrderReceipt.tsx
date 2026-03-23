'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from '@/context/LocaleContext'
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

/** Order-like data for receipt display (Order or CreatePaymentResponse.createdOrder) */
export interface ReceiptOrderData {
  id?: string
  order_number: string
  order_date: string
  customer_name: string
  mobile: string
  address?: string | null
  total_price: number
  items: Array<{
    name: string
    quantity: number
    price: number
    size?: string
    sku_color?: string
  }>
}

interface OrderReceiptProps {
  order: ReceiptOrderData
  /** Optional: show print button. Default true. */
  showPrintButton?: boolean
  /** Optional: custom class for the outer wrapper */
  className?: string
}

const BRAND_NAME = 'VORTON'
const SITE_URL = 'https://vorton.uk'

function formatCurrency(amount: number): string {
  return `₼${Math.round(amount)}`
}

function formatDateShort(d: string, locale: string): string {
  try {
    return new Date(d).toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

function BarcodeCell({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!value || !svgRef.current) return
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        displayValue: true,
        margin: 2,
        width: 1.5,
        height: 32,
      })
    } catch {
      // Skip barcode if invalid
    }
  }, [value])

  if (!value) return null
  return (
    <svg ref={svgRef} className="block mx-auto mt-1 print:max-h-10" />
  )
}

function ReceiptQRCode({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 80,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setDataUrl)
  }, [url])

  if (!dataUrl) return null
  return (
    <img
      src={dataUrl}
      alt="Order QR"
      className="w-20 h-20 object-contain flex-shrink-0"
    />
  )
}

export function OrderReceipt({
  order,
  showPrintButton = true,
  className = '',
}: OrderReceiptProps) {
  const { t, locale } = useLocale()

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const firstSku = order.items?.[0]?.sku_color?.trim()
  const qrUrl = order.id
    ? firstSku
      ? `${SITE_URL}/product/${encodeURIComponent(firstSku)}?order=${encodeURIComponent(order.id)}`
      : `${SITE_URL}/account/track/${order.id}`
    : null

  return (
    <div
      className={`max-w-[600px] mx-auto bg-white border border-[#E5E7EB] rounded-lg p-6 md:p-8 text-left print:shadow-none print:border print:max-w-full ${className}`}
      data-print-receipt
    >
      {/* Print link - screen only */}
      {showPrintButton && (
        <div className="mb-4 print:hidden">
          <button
            type="button"
            className="text-[#ea580c] font-medium text-sm hover:underline cursor-pointer bg-transparent border-none p-0 print-receipt-hide"
            onClick={handlePrint}
          >
            {t('printShort')}
          </button>
        </div>
      )}

      {/* Header */}
      <header className="mb-6 pb-4 border-b border-[#E5E7EB]">
        <h1 className="text-2xl font-bold tracking-wide text-[#111827] uppercase">
          {BRAND_NAME}
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          {t('receiptTitle')}
        </p>
      </header>

      {/* Order info */}
      <section className="mb-5">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-[#6B7280]">{t('orderNumber')}: </span>
            <span className="font-semibold text-[#111827]">{order.order_number}</span>
          </div>
          <div>
            <span className="text-[#6B7280]">{t('orderDate')}: </span>
            <span className="text-[#111827]">{formatDateShort(order.order_date, locale)}</span>
          </div>
        </div>
      </section>

      {/* Customer info */}
      <section className="mb-5 py-4 border-y border-[#E5E7EB]">
        <p className="font-semibold text-[#111827]">{order.customer_name}</p>
        <p className="text-sm text-[#111827] mt-0.5">{order.mobile}</p>
        {order.address && (
          <p className="text-sm text-[#111827] mt-0.5">{order.address}</p>
        )}
      </section>

      {/* Product table */}
      <section className="mb-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left py-3 px-0 text-[#6B7280] font-medium uppercase tracking-wide text-xs">
                {t('items')}
              </th>
              <th className="text-center py-3 px-3 text-[#6B7280] font-medium uppercase tracking-wide text-xs w-14">
                Qty
              </th>
              <th className="text-right py-3 px-0 text-[#6B7280] font-medium uppercase tracking-wide text-xs w-20">
                {t('subtotal')}
              </th>
            </tr>
          </thead>
          <tbody>
            {(order.items ?? []).map((item, i) => (
              <tr key={i} className="border-b border-[#E5E7EB]">
                <td className="py-3 px-0">
                  <span className="font-medium text-[#111827]">
                    {item.name}
                    {item.size ? ` (${item.size})` : ''}
                  </span>
                  {item.sku_color && (
                    <BarcodeCell value={item.sku_color} />
                  )}
                </td>
                <td className="py-3 px-3 text-center text-[#111827]">
                  {item.quantity}
                </td>
                <td className="py-3 px-0 text-right text-[#111827]">
                  {formatCurrency(item.quantity * Number(item.price))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Total */}
      <section className="mb-6 py-4 border-t-2 border-[#E5E7EB]">
        <div className="flex justify-between items-baseline">
          <span className="text-[#6B7280] font-medium">{t('orderTotal')}</span>
          <span className="text-xl font-bold text-[#111827]">
            {formatCurrency(Number(order.total_price))}
          </span>
        </div>
      </section>

      {/* Footer with QR */}
      <footer className="flex flex-wrap items-end justify-between gap-4 pt-6 border-t border-[#E5E7EB]">
        <div>
          <p className="text-sm text-[#6B7280] italic">{t('receiptThankYou')}</p>
          <p className="text-sm font-medium text-[#111827] mt-1">vorton.uk</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Caspian Textile LLC</p>
        </div>
        {qrUrl && (
          <div className="flex-shrink-0">
            <ReceiptQRCode url={qrUrl} />
          </div>
        )}
      </footer>
    </div>
  )
}
