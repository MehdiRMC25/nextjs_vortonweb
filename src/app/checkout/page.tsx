'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import {
    createPayment,
    PAYMENT_ERROR_FAILED_GENERIC,
    PAYMENT_ERROR_GENERIC,
    type PaymentOrderPayload,
} from '@/api/payment'
import { appendCheckoutDelivery } from '@/api/auth'
import type { AuthUser } from '@/api/auth'
import type { CartItem } from '@/types'
import {
    clampRedemptionForMinPayable,
    discountAznFromRedeemPoints,
    maxRedeemablePoints,
} from '@/lib/rewardPointsRedemption'
import {
    earnRateFromEligibleSubtotal,
    estimatedEarnPointsFromEligible,
    formatEarnPercentLabel,
} from '@/lib/rewardPointsEarn'
import WhatsAppButton from '@/components/WhatsAppButton'
import { productDisplayName } from '@/lib/productDisplay'
import { isValidPhone } from '@/utils/validation'
import { getPaymentReturnUrl } from '@/lib/paymentReturnUrl'
import {
    cartItemKey,
    cartLineListAndEffective,
    computeCheckoutMerchandiseSummary,
} from '@/lib/checkoutMerchandise'
import { shippingZoneAndFee } from '@/lib/shippingAzn'
import { buildCheckoutOrderLineItems } from '@/lib/checkoutOrderLineItems'
import {
    postCheckoutPreview,
    postCheckoutPreviewGuest,
    type CheckoutPreviewBreakdown,
} from '@/api/checkoutPreview'
import styles from './Checkout.module.css'

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

function getItemImage(item: CartItem) {
    const v = item.product.variants?.[item.variantIndex]
    return v?.image || item.product.image
}

export default function Checkout() {
    const { t, locale } = useLocale()
    const { user, token, isAuthenticated, refreshUser } = useAuth()
    const { items } = useCart()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [guestName, setGuestName] = useState('')
    const [guestMobile, setGuestMobile] = useState('')
    const [guestAddress, setGuestAddress] = useState('')
    const [useRewardPoints, setUseRewardPoints] = useState(false)
    const [pointsToApply, setPointsToApply] = useState(0)
    const [deliveryMobile, setDeliveryMobile] = useState('')
    const [deliveryAddress, setDeliveryAddress] = useState('')
    const [deliveryEditing, setDeliveryEditing] = useState(false)
    const [deliveryBusy, setDeliveryBusy] = useState(false)
    const [deliveryError, setDeliveryError] = useState<string | null>(null)
    /** Set when user saves checkout delivery — sent with payment order to link log row to created order. */
    const [deliveryContactLogId, setDeliveryContactLogId] = useState<number | null>(null)

    const [previewBreakdown, setPreviewBreakdown] = useState<CheckoutPreviewBreakdown | null>(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const previewAbortRef = useRef<AbortController | null>(null)

    const cartFingerprint = useMemo(
        () => items.map((it) => `${cartItemKey(it)}:${it.quantity}`).join('|'),
        [items]
    )

    useEffect(() => {
        if (isAuthenticated && user) {
            setDeliveryMobile((user.phone ?? '').trim())
            const composed =
                typeof user.address === 'string' && user.address.trim()
                    ? user.address.trim()
                    : [user.address_line1, user.address_line2, user.city, user.postcode, user.country]
                          .filter(Boolean)
                          .join(', ')
                          .trim()
            setDeliveryAddress(composed)
        }
    }, [isAuthenticated, user])

    const merch = computeCheckoutMerchandiseSummary(items, isAuthenticated, user)
    const subtotalBeforeMembership = merch.subtotalBeforeMembership
    const merchandiseNet = merch.merchandiseSubtotalAfterMembership
    const membershipDiscountAzn = merch.membershipDiscountAzn
    const membershipRatePct = Math.round((merch.membershipFraction || 0) * 100)
    const eligibleSubtotal = merch.eligibleSubtotalPostMembership

    const earnRate = earnRateFromEligibleSubtotal(eligibleSubtotal)
    const estimatedEarnPoints = estimatedEarnPointsFromEligible(eligibleSubtotal)
    const pointsBalance = pointsBalanceFromUser(user)
    const maxPointsForCart = maxRedeemablePoints(merchandiseNet, pointsBalance)
    const chosenPointsRaw = useRewardPoints && isAuthenticated ? pointsToApply : 0
    const chosenPoints = clampRedemptionForMinPayable(
        merchandiseNet,
        Math.max(0, Math.min(maxPointsForCart, Math.floor(chosenPointsRaw)))
    )
    const discountAzn = discountAznFromRedeemPoints(chosenPoints)
    const { zone: shippingZone, shippingAzn } = shippingZoneAndFee(
        isAuthenticated,
        user,
        deliveryAddress,
        guestAddress
    )
    const payableTotal =
        Math.round((merchandiseNet - discountAzn + shippingAzn) * 100) / 100
    const balanceAzn = discountAznFromRedeemPoints(pointsBalance)
    const maxUseAzn = discountAznFromRedeemPoints(maxPointsForCart)
    const pointsAtMaximum =
        useRewardPoints && maxPointsForCart > 0 && chosenPoints >= maxPointsForCart

    const displayPayableTotal = previewBreakdown?.payableTotalAzn ?? payableTotal
    const displayMembershipDiscountAzn =
        previewBreakdown?.membershipDiscountAzn ?? membershipDiscountAzn
    const displayPointsDiscountAzn = previewBreakdown?.pointsDiscountAzn ?? discountAzn
    const displayShippingAzn = previewBreakdown?.shippingAzn ?? shippingAzn

    useEffect(() => {
        if (!useRewardPoints) {
            setPointsToApply(0)
            return
        }
        if (!isAuthenticated) return
        setPointsToApply((v) => {
            const next = v > 0 ? v : maxPointsForCart
            return Math.max(0, Math.min(maxPointsForCart, Math.floor(next)))
        })
    }, [useRewardPoints, isAuthenticated, maxPointsForCart])

    useEffect(() => {
        if (items.length === 0) return
        if (isAuthenticated && !token) {
            setPreviewBreakdown(null)
            setPreviewLoading(false)
            return
        }

        const ac = new AbortController()
        previewAbortRef.current?.abort()
        previewAbortRef.current = ac

        const timer = window.setTimeout(() => {
            void (async () => {
                setPreviewLoading(true)
                setPreviewError(null)
                try {
                    const lineItems = buildCheckoutOrderLineItems(
                        items,
                        isAuthenticated,
                        user,
                        deliveryAddress,
                        guestAddress
                    )
                    if (isAuthenticated && token) {
                        const ptsPreview = useRewardPoints ? chosenPoints : 0
                        const res = await postCheckoutPreview(
                            token,
                            {
                                items: lineItems,
                                points_to_redeem: ptsPreview > 0 ? ptsPreview : undefined,
                            },
                            ac.signal
                        )
                        if (!ac.signal.aborted) {
                            setPreviewBreakdown(res.breakdown)
                        }
                    } else {
                        const res = await postCheckoutPreviewGuest({ items: lineItems }, ac.signal)
                        if (!ac.signal.aborted) {
                            setPreviewBreakdown(res.breakdown)
                        }
                    }
                } catch (e) {
                    if (e instanceof Error && e.name === 'AbortError') return
                    if (!ac.signal.aborted) {
                        setPreviewBreakdown(null)
                        setPreviewError(e instanceof Error ? e.message : 'Preview failed')
                    }
                } finally {
                    if (!ac.signal.aborted) setPreviewLoading(false)
                }
            })()
        }, 380)

        return () => {
            window.clearTimeout(timer)
            ac.abort()
        }
    }, [
        cartFingerprint,
        isAuthenticated,
        token,
        user,
        deliveryAddress,
        guestAddress,
        useRewardPoints,
        chosenPoints,
        items.length,
    ])

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

    function buildOrderPayload(
        netPay: number,
        pointsToRedeem: number,
        /** Fresh profile after refreshUser — keeps line prices in sync with payment */
        profileForOrder?: AuthUser | null
    ): PaymentOrderPayload {
        const u = profileForOrder ?? user
        const customer_name = isAuthenticated && u
            ? ((u.name ?? ([u.first_name, u.last_name].filter(Boolean).join(' ') || 'Customer')).trim() || 'Customer')
            : guestName.trim()
        const mobile =
            isAuthenticated && u
                ? (deliveryMobile.trim() || (u.phone ?? '').trim() || '')
                : guestMobile.trim() || ''
        const address =
            isAuthenticated && u
                ? (deliveryAddress.trim() ||
                      (u.address ??
                          [u.address_line1, u.address_line2, u.city, u.postcode, u.country]
                              .filter(Boolean)
                              .join(', ')
                              .trim()) ||
                      null)
                : guestAddress.trim() || null
        const membership_level = (isAuthenticated && u && u.membership_level) ? u.membership_level : 'none'
        const customer_id = parseCustomerId(u)
        const orderItems = buildCheckoutOrderLineItems(
            items,
            Boolean(isAuthenticated && u),
            u,
            deliveryAddress,
            guestAddress
        )
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
            ...(isAuthenticated &&
            u &&
            deliveryContactLogId != null &&
            deliveryContactLogId > 0
                ? { delivery_contact_log_id: deliveryContactLogId }
                : {}),
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
            if (isAuthenticated && !token) {
                setError(t('signIn'))
                setLoading(false)
                return
            }
            let profile = user
            if (isAuthenticated) {
                profile = (await refreshUser()) ?? user
            }
            const summaryPay = computeCheckoutMerchandiseSummary(items, isAuthenticated, profile)
            const merchNetPay = summaryPay.merchandiseSubtotalAfterMembership
            const bal = pointsBalanceFromUser(profile)
            const maxP = maxRedeemablePoints(merchNetPay, bal)
            let pts = useRewardPoints && isAuthenticated ? Math.max(0, Math.floor(pointsToApply)) : 0
            pts = Math.min(maxP, pts)
            pts = clampRedemptionForMinPayable(merchNetPay, pts)
            if (pts > 0 && parseCustomerId(profile) == null) {
                setError(t('signIn'))
                setLoading(false)
                return
            }
            const lineItems = buildCheckoutOrderLineItems(
                items,
                isAuthenticated,
                profile,
                deliveryAddress,
                guestAddress
            )
            let payable: number
            if (isAuthenticated && token) {
                const prev = await postCheckoutPreview(token, {
                    items: lineItems,
                    points_to_redeem: pts > 0 ? pts : undefined,
                })
                payable = prev.breakdown.payableTotalAzn
            } else {
                const prev = await postCheckoutPreviewGuest({ items: lineItems })
                payable = prev.breakdown.payableTotalAzn
            }
            const net = Math.round(payable * 100) / 100

            const returnUrl = getPaymentReturnUrl()
            const order = buildOrderPayload(net, isAuthenticated ? pts : 0, profile)
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
            const gatewayMsg = msg === PAYMENT_ERROR_GENERIC ? t('paymentGatewayUnavailable') : null
            const friendlyFailMsg = msg === PAYMENT_ERROR_FAILED_GENERIC ? t('paymentFailedMessage') : null
            setError(
                msg === 'PAYMENT_TIMEOUT'
                    ? t('paymentTimeoutMessage')
                    : corsMsg ?? gatewayMsg ?? friendlyFailMsg ?? msg
            )
            setLoading(false)
        }
    }

    async function applyRewardPointsPrimary() {
        setError(null)
        const profile = (await refreshUser()) ?? user
        const balNow = pointsBalanceFromUser(profile)
        const maxP = maxRedeemablePoints(merchandiseNet, balNow)
        setUseRewardPoints(true)
        setPointsToApply(maxP)
    }

    async function saveCheckoutDelivery() {
        setDeliveryError(null)
        if (!token) {
            setDeliveryError(t('signIn'))
            return
        }
        const phone = deliveryMobile.trim()
        const addr = deliveryAddress.trim()
        if (!phone && !addr) {
            setDeliveryError(t('checkoutGuestFields'))
            return
        }
        if (phone && !isValidPhone(phone)) {
            setDeliveryError(t('invalidMobileNumber'))
            return
        }
        setDeliveryBusy(true)
        try {
            const { id } = await appendCheckoutDelivery(token, { phone, address: addr })
            setDeliveryContactLogId(id)
            setDeliveryEditing(false)
        } catch (e) {
            setDeliveryError(e instanceof Error ? e.message : 'Save failed')
        } finally {
            setDeliveryBusy(false)
        }
    }

    const canOptIntoPoints = maxPointsForCart > 0 && parseCustomerId(user) != null

    return (
        <>
            <div className="container">
                <h1 className={styles.title}>{t('checkout')}</h1>
                <div className={styles.wrap}>
                    {!isAuthenticated && (
                        <div className={`${styles.card} ${styles.guestCard}`}>
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
                        </div>
                    )}

                    <div className={`${styles.card} ${styles.compactProductsCard}`}>
                        <h3 className={styles.cardTitle}>{t('cart')}</h3>
                        <div className={styles.compactProductsList}>
                            {items.map((item) => {
                                const basis = cartLineListAndEffective(item)
                                const listUnit = basis.listUnit
                                const lineTotal = listUnit * item.quantity
                                const colorName = item.product.variants?.[item.variantIndex]?.color
                                const lineTitle = productDisplayName(item.product, locale)
                                return (
                                    <div
                                        key={`${item.product.id}-${item.variantIndex}-${item.size}`}
                                        className={styles.compactProductRow}
                                    >
                                        <div className={styles.compactProductImage}>
                                            <img
                                                src={getItemImage(item)}
                                                alt={lineTitle}
                                                className={styles.compactProductImageFill}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>
                                        <div className={styles.compactProductInfo}>
                                            <p className={styles.compactProductName}>{lineTitle}</p>
                                            <p className={styles.compactProductMeta}>
                                                {colorName && `${colorName} · `}
                                                {t('sizeLabel')}: {item.size} · ₼{listUnit.toFixed(2)} {t('each')} · x{item.quantity}
                                            </p>
                                        </div>
                                        <div className={styles.compactProductTotal}>₼{lineTotal.toFixed(2)}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className={`${styles.card} ${styles.rewardsCard}`}>
                        <h3 className={styles.cardTitle}>{t('rewardPoints')}</h3>
                        <p className={styles.rewardsLine}>
                            {t('rewardPointsEstimatePrefix')}{' '}
                            <strong className={styles.rewardsStrong}>{estimatedEarnPoints.toLocaleString()}</strong>{' '}
                            {t('orderPointsColumn')}
                        </p>
                        <p className={styles.rewardsMuted}>{t('rewardPointsBalanceHint')}</p>
                        <p className={styles.rewardsHint}>
                            {t('eligibleSubtotalLabel')}: ₼{eligibleSubtotal.toFixed(2)} • {formatEarnPercentLabel(earnRate)}%
                        </p>
                    </div>

                    <div className={`${styles.card} ${styles.pointsCard}`}>
                        {isAuthenticated ? (
                            canOptIntoPoints ? (
                                <>
                                    <div className={styles.pointsHeaderRow}>
                                        <h3 className={styles.pointsSectionTitle}>{t('useMyPoints')}</h3>
                                        <label className={styles.toggle}>
                                            <input
                                                type="checkbox"
                                                aria-label={t('useMyPoints')}
                                                checked={useRewardPoints}
                                                onChange={(e) => {
                                                    setError(null)
                                                    const on = e.target.checked
                                                    setUseRewardPoints(on)
                                                    if (on) void refreshUser()
                                                }}
                                                disabled={loading}
                                            />
                                            <span className={styles.toggleTrack} />
                                        </label>
                                    </div>
                                    <p className={styles.pointsBalanceLine}>
                                        {t('checkoutPointsBalanceLine')
                                            .replace('{{points}}', String(pointsBalance.toLocaleString()))
                                            .replace('{{azn}}', balanceAzn.toFixed(2))}
                                    </p>
                                    <p className={styles.pointsHelperLine}>
                                        {t('checkoutPointsUseUpTo').replace('{{amount}}', maxUseAzn.toFixed(2))}
                                    </p>

                                    {useRewardPoints && (
                                        <div className={styles.pointsMobLayout}>
                                            <div className={styles.pointsToApplyRow}>
                                                <span className={styles.pointsToApplyLabelLeft}>
                                                    {t('checkoutPointsToApply')}
                                                </span>
                                                <span className={styles.pointsToApplyValueRight}>{chosenPoints}</span>
                                            </div>
                                            <div className={styles.pointsStepperRow}>
                                                <div className={styles.pointsStepper}>
                                                    <button
                                                        type="button"
                                                        className={styles.stepperBtn}
                                                        onClick={() => setPointsToApply((v) => Math.max(0, v - 1))}
                                                        disabled={loading}
                                                    >
                                                        −1
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.stepperBtn}
                                                        onClick={() =>
                                                            setPointsToApply((v) => Math.min(maxPointsForCart, v + 1))
                                                        }
                                                        disabled={loading}
                                                    >
                                                        +1
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={styles.pointsApplyMaxBtn}
                                                    onClick={() => void applyRewardPointsPrimary()}
                                                    disabled={loading || pointsAtMaximum}
                                                >
                                                    {t('applyMaximum')}
                                                </button>
                                            </div>
                                            <p className={styles.pointsDiscountFromLine}>
                                                <span>{t('checkoutDiscountFromPoints')}</span>{' '}
                                                <strong>₼{discountAzn.toFixed(2)}</strong>
                                            </p>
                                            <button
                                                type="button"
                                                className={styles.pointsPayFullText}
                                                onClick={() => {
                                                    setError(null)
                                                    setUseRewardPoints(false)
                                                }}
                                                disabled={loading}
                                            >
                                                {t('useNoPointsPayFullPrice')}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h3 className={styles.pointsSectionTitle}>{t('useMyPoints')}</h3>
                                    <p className={styles.pointsMuted}>{t('checkoutNoPointsBalance')}</p>
                                </>
                            )
                        ) : (
                            <>
                                <h3 className={styles.pointsSectionTitle}>{t('useMyPoints')}</h3>
                                <div className={styles.pointsSignInRow}>
                                    <p className={styles.pointsMuted}>{t('signInToUsePoints')}</p>
                                    <Link href="/signin" className="btn btn-secondary">
                                        {t('signIn')}
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    {isAuthenticated && user && (
                        <div className={`${styles.card} ${styles.deliveryCard}`}>
                            {/* Keep delivery details UX as-is */}
                            <div className={styles.deliveryPanel}>
                                <div className={styles.deliveryHeader}>
                                    <h3 className={styles.deliveryTitle}>{t('checkDeliveryDetails')}</h3>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setDeliveryError(null)
                                            setDeliveryEditing((v) => !v)
                                        }}
                                    >
                                        {t('checkDeliveryUpdate')}
                                    </button>
                                </div>
                                {!deliveryEditing ? (
                                    <div className={styles.deliveryReadonly}>
                                        <p className={styles.deliveryLine}>
                                            <span className={styles.deliveryLabel}>{t('mobileLabel')}:</span>{' '}
                                            {deliveryMobile.trim() || t('notProvided')}
                                        </p>
                                        <p className={styles.deliveryLine}>
                                            <span className={styles.deliveryLabel}>{t('address')}:</span>{' '}
                                            {deliveryAddress.trim() || t('notProvided')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className={styles.deliveryEdit}>
                                        <label className={styles.guestLabel}>
                                            {t('mobileLabel')}
                                            <input
                                                type="text"
                                                className={styles.guestInput}
                                                value={deliveryMobile}
                                                onChange={(e) => setDeliveryMobile(e.target.value)}
                                                placeholder="+994..."
                                            />
                                        </label>
                                        <label className={styles.guestLabel}>
                                            {t('address')}
                                            <input
                                                type="text"
                                                className={styles.guestInput}
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder={t('optional')}
                                            />
                                        </label>
                                        {deliveryError && <p className={styles.error}>{deliveryError}</p>}
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            style={{ width: '100%', marginTop: 8 }}
                                            onClick={() => void saveCheckoutDelivery()}
                                            disabled={deliveryBusy}
                                        >
                                            {deliveryBusy ? t('loading') : t('saveDeliveryDetails')}
                                        </button>
                                    </div>
                                )}
                                <p className={styles.deliveryHint}>{t('checkDeliveryAccountHint')}</p>
                            </div>
                        </div>
                    )}

                    <div className={`${styles.card} ${styles.orderSummaryCard}`}>
                        <h2 className={styles.summaryTitle}>{t('orderSummary')}</h2>
                        <div className={styles.summaryRows}>
                            <div className={styles.summaryRow}>
                                <span>{t('merchandiseSubtotalBeforeMembership')}</span>
                                <span>₼{subtotalBeforeMembership.toFixed(2)}</span>
                            </div>
                            {displayMembershipDiscountAzn > 0 && (
                                <div className={`${styles.summaryRow} ${styles.summaryRowDiscount}`}>
                                    <span>
                                        {t('membershipDiscount')}
                                        {membershipRatePct > 0 ? ` (${membershipRatePct}%)` : ''}
                                    </span>
                                    <span>−₼{displayMembershipDiscountAzn.toFixed(2)}</span>
                                </div>
                            )}
                            {chosenPoints > 0 && (
                                <div className={`${styles.summaryRow} ${styles.summaryRowDiscount}`}>
                                    <span>{t('pointsDiscount')}</span>
                                    <span>−₼{displayPointsDiscountAzn.toFixed(2)}</span>
                                </div>
                            )}
                            <div className={styles.summaryRow}>
                                <span>
                                    {t('shipping')}
                                    <span className={styles.shippingZoneHint}>
                                        {' '}
                                        (
                                        {shippingZone === 'baku'
                                            ? t('shippingRateBakuHint')
                                            : t('shippingRateNationalHint')}
                                        )
                                    </span>
                                </span>
                                <span>₼{displayShippingAzn.toFixed(2)}</span>
                            </div>
                            <div className={`${styles.summaryRow} ${styles.summaryRowTotal}`}>
                                <span>{t('amountToPay')}</span>
                                <span className={styles.summaryTotalValue}>
                                    ₼{displayPayableTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {previewLoading && (
                            <p className={styles.deliveryHint} role="status">
                                {t('loading')}
                            </p>
                        )}
                        {previewError && (
                            <p className={styles.deliveryHint} role="status">
                                {previewError}
                            </p>
                        )}

                        {error && <p className={styles.error}>{error}</p>}
                    </div>

                    <div className={styles.actionsRow}>
                        <Link href="/shop" className="btn btn-secondary">
                            {t('continueShopping')}
                        </Link>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleProceedToPayment}
                            disabled={loading}
                        >
                            {loading ? t('loading') : t('proceedToPayment')}
                        </button>
                    </div>

                    {loading && <p className={styles.loadingHint}>{t('paymentLoadingHint')}</p>}

                    <Link href="/cart" className={styles.backLink}>
                        ← {t('cart')}
                    </Link>
                </div>
            </div>
            <WhatsAppButton pageTag="checkout" />
        </>
    )
}
