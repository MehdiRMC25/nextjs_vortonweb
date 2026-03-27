'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import { createPayment, type PaymentOrderPayload } from '@/api/payment'
import type { AuthUser } from '@/api/auth'
import type { CartItem } from '@/types'
import {
    clampRedemptionForMinPayable,
    discountAznFromRedeemPoints,
    maxRedeemablePoints,
} from '@/lib/rewardPointsRedemption'
import WhatsAppButton from '@/components/WhatsAppButton'
import styles from './Checkout.module.css'

function getItemPrice(item: CartItem): number {
    const v = item.product.variants?.[item.variantIndex]
    if (v) return v.discountedPrice ?? v.price
    return item.product.salePrice ?? item.product.price
}

const PRICE_EPS = 0.005

/** Lines below list/variant price or marked sale/discount do not earn reward points. */
function lineExcludedFromRewardPoints(item: CartItem): boolean {
    const p = item.product
    const v = p.variants?.[item.variantIndex]
    const listPrice = v != null ? v.price : p.price
    const paid = getItemPrice(item)
    if (paid < listPrice - PRICE_EPS) return true
    if (v?.isDiscounted === true) return true
    if (p.onSale === true && p.salePrice != null && p.salePrice < p.price - PRICE_EPS) return true
    return false
}

function parseCustomerId(u: AuthUser | null | undefined): number | undefined {
    if (u == null || u.id == null) return undefined
    const n = Number(u.id)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
}

function pointsBalanceFromUser(u: AuthUser | null | undefined): number {
    if (typeof u?.loyalty_credits !== 'number') return 0
    return Math.max(0, Math.round(u.loyalty_credits))
}

const today = () => new Date().toISOString().slice(0, 10)

export default function Checkout() {
    const { t } = useLocale()
    const { user, isAuthenticated, refreshUser } = useAuth()
    const { items } = useCart()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [guestName, setGuestName] = useState('')
    const [guestMobile, setGuestMobile] = useState('')
    const [guestAddress, setGuestAddress] = useState('')
    const [useRewardPoints, setUseRewardPoints] = useState(false)

    const subtotal = Math.round(items.reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0) * 100) / 100
    const eligibleSubtotal = Math.round(
        items
            .filter((i) => !lineExcludedFromRewardPoints(i))
            .reduce((sum, i) => sum + getItemPrice(i) * i.quantity, 0) * 100
    ) / 100

    const earnRate = eligibleSubtotal <= 120 ? 0.03 : eligibleSubtotal <= 300 ? 0.05 : 0.07
    const estimatedEarnPoints = Math.max(0, Math.round(eligibleSubtotal * earnRate * 11))
    const pointsBalance = pointsBalanceFromUser(user)
    const maxPointsForCart = maxRedeemablePoints(subtotal, pointsBalance)
    const chosenPointsRaw =
        useRewardPoints && isAuthenticated && maxPointsForCart > 0 ? maxPointsForCart : 0
    const chosenPoints = clampRedemptionForMinPayable(subtotal, chosenPointsRaw)
    const discountAzn = discountAznFromRedeemPoints(chosenPoints)
    const payableTotal = Math.round((subtotal - discountAzn) * 100) / 100

    if (items.length === 0) {
        return (
            <>
                <div className="container">
                    <h1 className={styles.title}>{t('checkout')}</h1>
                    <div className={styles.empty}>
                        <p>{t('yourCartEmpty')}</p>
                        <Link href="/shop" className="btn btn-primary">
                            {t('continueShopping')}
                        </Link>
                    </div>
                </div>
                <WhatsAppButton pageTag="checkout" />
            </>
        )
    }

    function buildOrderPayload(netPay: number, pointsToRedeem: number): PaymentOrderPayload {
        const customer_name = isAuthenticated && user
            ? ((user.name ?? ([user.first_name, user.last_name].filter(Boolean).join(' ') || 'Customer')).trim() || 'Customer')
            : guestName.trim()
        const mobile = (isAuthenticated && user ? user.phone : guestMobile.trim()) || ''
        const address = isAuthenticated && user
            ? (user.address ?? [user.address_line1, user.address_line2, user.city, user.postcode, user.country].filter(Boolean).join(', ')).trim() || null
            : guestAddress.trim() || null
        const membership_level = (isAuthenticated && user && user.membership_level) ? user.membership_level : 'none'
        const customer_id = parseCustomerId(user)
        const orderItems = items.map((item) => {
            const price = getItemPrice(item)
            const v = item.product.variants?.[item.variantIndex]
            const excluded = lineExcludedFromRewardPoints(item)
            return {
                name: item.product.name,
                quantity: item.quantity,
                price,
                sku_color: v?.skuColor ?? item.product.sku,
                size: item.size || undefined,
                product_id: item.product.id,
                ...(excluded ? { is_discounted: true as const } : {}),
                ...(item.product.onSale === true && !excluded ? { promotional: true as const } : {}),
            }
        })
        return {
            ...(customer_id !== undefined ? { customer_id } : {}),
            customer_name: customer_name || 'Customer',
            mobile: mobile || '—',
            address: address || null,
            membership_level,
            order_date: today(),
            delivery_due_date: null,
            items: orderItems,
            total_price: netPay,
            ...(pointsToRedeem > 0 ? { points_to_redeem: pointsToRedeem } : {}),
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
            let profile = user
            if (useRewardPoints && isAuthenticated) {
                profile = (await refreshUser()) ?? user
            }
            const bal = pointsBalanceFromUser(profile)
            const maxP = maxRedeemablePoints(subtotal, bal)
            let pts = useRewardPoints && isAuthenticated && maxP > 0 ? maxP : 0
            pts = clampRedemptionForMinPayable(subtotal, pts)
            if (pts > 0 && parseCustomerId(profile) == null) {
                setError(t('signIn'))
                setLoading(false)
                return
            }
            const disc = discountAznFromRedeemPoints(pts)
            const net = Math.round((subtotal - disc) * 100) / 100

            const returnUrl = `${window.location.origin}/payment/done`
            const order = buildOrderPayload(net, pts)
            const res = await createPayment({
                amount: net,
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

    const canOptIntoPoints = maxPointsForCart > 0 && parseCustomerId(user) != null

    return (
        <>
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
                        <span>{t('merchandiseSubtotal')}</span>
                        <span>₼{subtotal.toFixed(2)}</span>
                    </p>

                    <div className={styles.pointsPanel}>
                        <h3 className={styles.pointsTitle}>{t('rewardPointsEstimateTitle')}</h3>
                        <p className={styles.pointsEstimateLine}>
                            {t('rewardPointsEstimatePrefix')}{' '}
                            <strong className={styles.pointsEstimateStrong}>{estimatedEarnPoints.toLocaleString()}</strong>{' '}
                            {t('orderPointsColumn')}
                        </p>
                        <p className={styles.pointsHint}>
                            {t('eligibleSubtotalLabel')}: ₼{eligibleSubtotal.toFixed(2)} • {(earnRate * 100).toFixed(0)}%
                        </p>

                        {isAuthenticated ? (
                            <>
                                <h3 className={styles.pointsTitle}>{t('useMyPoints')}</h3>
                                <p className={styles.pointsBalance}>
                                    {t('rewardPointsBalance')}: {pointsBalance.toLocaleString()} {t('orderPointsColumn')}
                                </p>
                                {canOptIntoPoints ? (
                                    <div className={styles.pointsRowActions}>
                                        {!useRewardPoints ? (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={async () => {
                                                    await refreshUser()
                                                    setUseRewardPoints(true)
                                                }}
                                            >
                                                {t('useMyPoints')}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setUseRewardPoints(false)}
                                            >
                                                {t('removePointsDiscount')}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className={styles.pointsMuted}>{t('checkoutNoPointsBalance')}</p>
                                )}
                            </>
                        ) : (
                            <div className={styles.pointsSignInRow}>
                                <p className={styles.pointsMuted}>{t('signInToUsePoints')}</p>
                                <Link href="/signin" className="btn btn-secondary">
                                    {t('signIn')}
                                </Link>
                            </div>
                        )}
                    </div>

                    {chosenPoints > 0 && (
                        <p className={styles.discountRow}>
                            <span>{t('pointsDiscount')} (−{chosenPoints} {t('orderPointsColumn')})</span>
                            <span>−₼{discountAzn.toFixed(2)}</span>
                        </p>
                    )}
                    <p className={styles.payableRow}>
                        <span>{t('amountToPay')}</span>
                        <span>₼{payableTotal.toFixed(2)}</span>
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
            <WhatsAppButton pageTag="checkout" />
        </>
    )
}
