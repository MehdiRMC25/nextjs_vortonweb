'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { useCart } from '@/context/CartContext'
import { Suspense, useEffect, useRef, useState } from 'react'
import { confirmPayment, type CreatePaymentResponse } from '@/api/payment'
import { OrderReceipt } from '@/components/OrderReceipt'
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
    const [createdOrder, setCreatedOrder] = useState<CreatePaymentResponse['createdOrder'] | null>(null)

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
                    <div className={styles.receipt}>
                        <OrderReceipt
                            order={{
                                order_number: createdOrder.order_number,
                                order_date: createdOrder.order_date,
                                customer_name: createdOrder.customer_name,
                                mobile: createdOrder.mobile,
                                address: createdOrder.address ?? undefined,
                                total_price: Number(createdOrder.total_price),
                                items: (createdOrder.items ?? []).map((item) => ({
                                    name: item.name,
                                    quantity: item.quantity,
                                    price: Number(item.price),
                                    size: item.size ?? undefined,
                                    sku_color: item.sku_color ?? undefined,
                                })),
                            }}
                        />
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
