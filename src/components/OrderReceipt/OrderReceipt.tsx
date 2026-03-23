'use client'

import { useCallback } from 'react'
import { useLocale } from '@/context/LocaleContext'
import styles from './OrderReceipt.module.css'

/** Order-like data for receipt display (Order or CreatePaymentResponse.createdOrder) */
export interface ReceiptOrderData {
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

const COMPANY_NAME = 'Vorton'

export function OrderReceipt({
  order,
  showPrintButton = true,
  className = '',
}: OrderReceiptProps) {
  const { t, locale } = useLocale()

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const dateFormat = locale === 'az' ? 'az-AZ' : 'en-GB'
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(dateFormat, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }

  return (
    <div
      className={`${styles.receipt} ${className}`}
      data-print-receipt
    >
      <h2 className={styles.companyName}>{COMPANY_NAME}</h2>
      <h3 className={styles.receiptTitle}>{t('receiptTitle')}</h3>

      <div className={styles.meta}>
        <p className={styles.metaRow}>
          <span className={styles.metaLabel}>{t('orderNumber')}:</span>
          <strong>{order.order_number}</strong>
        </p>
        <p className={styles.metaRow}>
          <span className={styles.metaLabel}>{t('orderDate')}:</span>
          {formatDate(order.order_date)}
        </p>
      </div>

      <div className={styles.customer}>
        <p><strong>{order.customer_name}</strong></p>
        <p>{order.mobile}</p>
        {order.address && <p>{order.address}</p>}
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('items')}</th>
            <th>Qty</th>
            <th>{t('subtotal')}</th>
          </tr>
        </thead>
        <tbody>
          {(order.items ?? []).map((item, i) => (
            <tr key={i}>
              <td>
                {item.name}
                {item.size ? ` (${item.size})` : ''}
              </td>
              <td>{item.quantity}</td>
              <td>₼{(item.quantity * Number(item.price)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className={styles.total}>
        {t('orderTotal')}: <strong>₼{Number(order.total_price).toFixed(2)}</strong>
      </p>

      <p className={styles.thankYou}>{t('receiptThankYou')}</p>

      {showPrintButton && (
        <button
          type="button"
          className={`btn btn-primary ${styles.printBtn} print-receipt-hide`}
          onClick={handlePrint}
        >
          {t('printReceipt')}
        </button>
      )}
    </div>
  )
}
