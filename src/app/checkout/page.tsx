'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import { createPayment, type PaymentOrderPayload } from '@/api/payment'
import type { CartItem } from '@/types'
import styles from './Checkout.module.css'

function getItemPrice(item: CartItem): number {
    const v = item.product.variants?.[item.variantIndex]
    if (v) return v.discountedPrice ?? v.price
    return item.product.salePrice ?? item.product.price
}

const today = () => new Date().toISOString().slice(0, 10)

export default function Checkout() {
    const { t } = useLocale()
    const { user, isAuthenticated } = useAuth()
    const { items } = useCart()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [guestName, setGuestName] = useState('')
    const [guestMobile, setGuestMobile] = useState('')
    const [guestAddress, setGuestAddress] = useState('')

    const subtotal = items.reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0)

    if (items.length === 0) {
        return (
            <div className="container">
                <h1 className={styles.title}>{t('checkout')}</h1>
                <div className={styles.empty}>
                    <p>{t('yourCartEmpty')}</p>
                    <Link href="/shop" className="btn btn-primary">
                        {t('continueShopping')}
                    </Link>
                </div>
            </div>
        )
    }

    function buildOrderPayload(): PaymentOrderPayload {
        const customer_name = isAuthenticated && user
            ? ((user.name ?? ([user.first_name, user.last_name].filter(Boolean).join(' ') || 'Customer')).trim() || 'Customer')
            : guestName.trim()
        const mobile = (isAuthenticated && user ? user.phone : guestMobile.trim()) || ''
        const address = isAuthenticated && user
            ? (user.address ?? [user.address_line1, user.address_line2, user.city, user.postcode, user.country].filter(Boolean).join(', ')).trim() || null
            : guestAddress.trim() || null
        const membership_level = (isAuthenticated && user && user.membership_level) ? user.membership_level : 'none'
        const customer_id = isAuthenticated && user && typeof user.id === 'number' ? user.id : undefined
        const orderItems = items.map((item) => {
            const price = getItemPrice(item)
            const v = item.product.variants?.[item.variantIndex]
            return {
                name: item.product.name,
                quantity: item.quantity,
                price,
                sku_color: v?.skuColor ?? item.product.sku,
                size: item.size || undefined,
                product_id: item.product.id,
            }
        })
        const total_price = Math.round(subtotal * 100) / 100
        return {
            ...(customer_id !== undefined ? { customer_id } : {}),
            customer_name: customer_name || 'Customer',
            mobile: mobile || '—',
            address: address || null,
            membership_level,
            order_date: today(),
            delivery_due_date: null,
            items: orderItems,
            total_price,
        }
    }

    async function handleProceedToPayment() {
        setError(null)
        if (!isAuthenticated && (!guestName.trim() || !guestMobile.trim())) {
            setError(t('checkoutGuestFields'))
            return
        }
        setLoading(true)
        try {
            const returnUrl = `${window.location.origin}/payment/done`
            const order = buildOrderPayload()
            const res = await createPayment({
                amount: order.total_price,
                currency: 'AZN',
                reference: `order-${Date.now()}`,
                returnUrl,
                order,
            })
            const url = res.redirectUrl || res.paymentUrl
            if (url) window.location.href = url
            else throw new Error('No payment URL returned')
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Payment failed'
            const corsMsg =
                msg === 'PAYMENT_CORS_OR_NETWORK'
                    ? `${t('paymentCorsError')} (${t('youAreOn')}: ${window.location.origin})`
                    : null
            setError(
                msg === 'PAYMENT_TIMEOUT'
                    ? t('paymentTimeoutMessage')
                    : corsMsg ?? msg
            )
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <h1 className={styles.title}>{t('checkout')}</h1>
            <div className={styles.wrap}>
                <div className={styles.summaryCard}>
                    {!isAuthenticated && (
                        <div className={styles.guestFields}>
                            <h3 className={styles.guestTitle}>{t('contactDetails')}</h3>
                            <label className={styles.guestLabel}>
                                {t('nameLabel')} *
                                <input
                                    type="text"
                                    className={styles.guestInput}
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder={t('yourName')}
                                />
                            </label>
                            <label className={styles.guestLabel}>
                                {t('mobileLabel')} *
                                <input
                                    type="text"
                                    className={styles.guestInput}
                                    value={guestMobile}
                                    onChange={(e) => setGuestMobile(e.target.value)}
                                    placeholder="+994..."
                                />
                            </label>
                            <label className={styles.guestLabel}>
                                {t('addressOptional')}
                                <input
                                    type="text"
                                    className={styles.guestInput}
                                    value={guestAddress}
                                    onChange={(e) => setGuestAddress(e.target.value)}
                                    placeholder={t('optional')}
                                />
                            </label>
                        </div>
                    )}
                    <h2 className={styles.summaryTitle}>{t('orderSummary')}</h2>
                    <ul className={styles.itemList}>
                        {items.map((item) => {
                            const price = getItemPrice(item)
                            const lineTotal = price * item.quantity
                            return (
                                <li key={`${item.product.id}-${item.variantIndex}-${item.size}`}>
                                    <span>{item.product.name} × {item.quantity}</span>
                                    <span>₼{lineTotal.toFixed(2)}</span>
                                </li>
                            )
                        })}
                    </ul>
                    <p className={styles.totalRow}>
                        <span>{t('subtotal')}</span>
                        <span>₼{subtotal.toFixed(2)}</span>
                    </p>
                    <p className={styles.note}>{t('shippingNote')}</p>
                    {error && <p className={styles.error}>{error}</p>}
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: 16 }}
                        onClick={handleProceedToPayment}
                        disabled={loading}
                    >
                        {loading ? t('loading') : t('proceedToPayment')}
                    </button>
                    {loading && (
                        <p className={styles.loadingHint}>{t('paymentLoadingHint')}</p>
                    )}
                    <Link href="/cart" className={styles.backLink}>
                        ← {t('cart')}
                    </Link>
                </div>
            </div>
        </div>
    )
}
