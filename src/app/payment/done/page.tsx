'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { useCart } from '@/context/CartContext'
import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { confirmPayment, type CreatePaymentResponse } from '@/api/payment'
import styles from './PaymentDone.module.css'

const SUCCESS_STATUSES = ['FullyPaid', 'Paid', 'Success']
const CANCELLED_STATUSES = ['Cancelled', 'Canceled', 'Rejected']

function PaymentDoneContent() {
    const { t, locale } = useLocale()
    const { clearCart } = useCart()
    const searchParams = useSearchParams()
    const status = (searchParams.get('STATUS') ?? '').trim()
    const bankOrderId = searchParams.get('ID') ?? ''
    const confirmSent = useRef(false)
    const [createdOrder, setCreatedOrder] = useState<CreatePaymentResponse['createdOrder'] | null>(null)
    const receiptRef = useRef<HTMLDivElement>(null)

    const isSuccess = SUCCESS_STATUSES.includes(status)
    const isCancelled = CANCELLED_STATUSES.includes(status)
    const isFailed = status && !isSuccess && !isCancelled

    useEffect(() => {
        if (isSuccess) clearCart()
    }, [isSuccess])

    useEffect(() => {
        if (!isSuccess || !bankOrderId || confirmSent.current) return
        confirmSent.current = true
        confirmPayment(bankOrderId, status).then((res) => {
            if (res?.createdOrder) setCreatedOrder(res.createdOrder)
        }).catch(() => {})
    }, [isSuccess, bankOrderId, status])

    const handlePrintReceipt = useCallback(() => {
        window.print()
    }, [])

    const dateFormat = locale === 'az' ? 'az-AZ' : 'en-GB'
    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString(dateFormat, {
                day: 'numeric', month: 'short', year: 'numeric',
            })
        } catch {
            return d
        }
    }

    const title = isSuccess
        ? t('paymentSuccess')
        : isCancelled
            ? t('paymentCancelled')
            : isFailed
                ? t('paymentFailed')
                : t('paymentSuccess')
    const message = isSuccess
        ? t('paymentSuccessMessage')
        : isCancelled
            ? t('paymentCancelledMessage')
            : isFailed
                ? t('paymentFailedMessage')
                : t('paymentSuccessMessage')

    return (
        <div className="container">
            <div className={styles.card}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.message}>{message}</p>

                {isSuccess && createdOrder && (
                    <div ref={receiptRef} className={styles.receipt} data-print-receipt>
                        <h2 className={styles.receiptTitle}>{t('receiptTitle')}</h2>
                        <p className={styles.receiptOrderNumber}>
                            {t('orderNumber')}: <strong>{createdOrder.order_number}</strong>
                        </p>
                        <p className={styles.receiptDate}>{formatDate(createdOrder.order_date)}</p>
                        <div className={styles.receiptCustomer}>
                            <p><strong>{createdOrder.customer_name}</strong></p>
                            <p>{createdOrder.mobile}</p>
                            {createdOrder.address && <p>{createdOrder.address}</p>}
                        </div>
                        <table className={styles.receiptTable}>
                            <thead>
                                <tr>
                                    <th>{t('items')}</th>
                                    <th>Qty</th>
                                    <th>{t('subtotal')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(createdOrder.items ?? []).map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}{item.size ? ` (${item.size})` : ''}</td>
                                        <td>{item.quantity}</td>
                                        <td>₼{(item.quantity * Number(item.price)).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className={styles.receiptTotal}>
                            {t('orderTotal')}: <strong>₼{Number(createdOrder.total_price).toFixed(2)}</strong>
                        </p>
                        <button
                            type="button"
                            className={`btn btn-primary ${styles.printBtn} print-receipt-hide`}
                            onClick={handlePrintReceipt}
                        >
                            {t('printReceipt')}
                        </button>
                    </div>
                )}

                <Link href="/shop" className="btn btn-primary">
                    {t('backToShop')}
                </Link>
            </div>
        </div>
    )
}

export default function PaymentDone() {
    return (
        <Suspense fallback={<div className="container"><div className={styles.card}><p>Loading…</p></div></div>}>
            <PaymentDoneContent />
        </Suspense>
    )
}
