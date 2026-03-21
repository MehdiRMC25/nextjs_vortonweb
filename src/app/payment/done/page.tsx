'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { useCart } from '@/context/CartContext'
import { Suspense, useEffect, useRef } from 'react'
import { confirmPayment } from '@/api/payment'
import styles from './PaymentDone.module.css'

const SUCCESS_STATUSES = ['FullyPaid', 'Paid', 'Success']
const CANCELLED_STATUSES = ['Cancelled', 'Canceled', 'Rejected']

function PaymentDoneContent() {
    const { t } = useLocale()
    const { clearCart } = useCart()
    const searchParams = useSearchParams()
    const status = (searchParams.get('STATUS') ?? '').trim()
    const bankOrderId = searchParams.get('ID') ?? ''
    const confirmSent = useRef(false)

    const isSuccess = SUCCESS_STATUSES.includes(status)
    const isCancelled = CANCELLED_STATUSES.includes(status)
    const isFailed = status && !isSuccess && !isCancelled

    useEffect(() => {
        if (isSuccess) clearCart()
    }, [isSuccess])

    useEffect(() => {
        if (!isSuccess || !bankOrderId || confirmSent.current) return
        confirmSent.current = true
        confirmPayment(bankOrderId, status).catch(() => {})
    }, [isSuccess, bankOrderId, status])

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
