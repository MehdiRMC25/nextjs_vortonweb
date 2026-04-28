'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import { useAuth } from '@/context/AuthContext'
import { productDisplayName } from '@/lib/productDisplay'
import {
    postCheckoutPreview,
    postCheckoutPreviewGuest,
    type CheckoutPreviewResponse,
} from '@/api/checkoutPreview'
import { buildCheckoutOrderLineItems } from '@/lib/checkoutOrderLineItems'
import { checkoutShippingDisplayCurrency } from '@/lib/shippingAzn'
import WhatsAppButton from '@/components/WhatsAppButton'
import styles from './Cart.module.css'

function getItemImage(item: { product: { image: string; variants?: { image: string }[] }; variantIndex: number }) {
    const v = item.product.variants?.[item.variantIndex]
    return v?.image || item.product.image
}

function getItemPrice(item: { product: { price: number; salePrice?: number; variants?: { price: number; discountedPrice?: number }[] }; variantIndex: number }) {
    const v = item.product.variants?.[item.variantIndex]
    if (v) return v.discountedPrice ?? v.price
    return item.product.salePrice ?? item.product.price
}

export default function Cart() {
    const { t, locale, geoCountry } = useLocale()
    const { user, token, isAuthenticated } = useAuth()
    const { items, removeItem, updateQuantity } = useCart()
    const [promoOpen, setPromoOpen] = useState(false)
    const [promoCode, setPromoCode] = useState('')
    const [promoApplying, setPromoApplying] = useState(false)
    const [promoAppliedCode, setPromoAppliedCode] = useState('')
    const [promoDiscountAzn, setPromoDiscountAzn] = useState(0)
    const [promoInvalid, setPromoInvalid] = useState(false)
    const [promoStatus, setPromoStatus] = useState<'idle' | 'success' | 'invalid'>('idle')
    const [promoErrorCode, setPromoErrorCode] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const subtotal = items.reduce((sum, i) => {
        const price = getItemPrice(i)
        return sum + price * i.quantity
    }, 0)

    const checkoutCurrency = checkoutShippingDisplayCurrency(locale, geoCountry)
    const deliveryCountry = useMemo(() => {
        if (isAuthenticated) {
            const userCountry = typeof user?.country === 'string' ? user.country.trim() : ''
            return userCountry || (geoCountry || 'AZ')
        }
        return geoCountry || 'AZ'
    }, [isAuthenticated, user, geoCountry])

    const deliveryCity = useMemo(() => {
        if (!isAuthenticated) return undefined
        const city = typeof user?.city === 'string' ? user.city.trim() : ''
        return city || undefined
    }, [isAuthenticated, user])

    async function handleApplyPromoFromCart() {
        const normalized = promoCode.trim().toUpperCase()
        setPromoCode(normalized)
        setPromoInvalid(false)
        setPromoDiscountAzn(0)
        setPromoAppliedCode('')
        setPromoErrorCode('')
        setPromoStatus('idle')
        if (!normalized) return

        setPromoApplying(true)
        try {
            const payload = {
                delivery_country: deliveryCountry,
                ...(deliveryCity ? { delivery_city: deliveryCity } : {}),
                checkout_currency: checkoutCurrency,
                items: buildCheckoutOrderLineItems(items, null),
                promo_code: normalized,
            }
            let res: CheckoutPreviewResponse
            if (isAuthenticated && token) {
                res = await postCheckoutPreview(token, payload)
            } else {
                res = await postCheckoutPreviewGuest(payload)
            }
            const discount = Number(
                res.breakdown.promoDiscountAzn ??
                res.breakdown['promo_discount_azn'] ??
                0
            )
            const promoErrorCode =
                typeof res.breakdown['promo_error_code'] === 'string'
                    ? String(res.breakdown['promo_error_code'])
                    : ''
            const approvedCode =
                typeof res.breakdown['promo_code'] === 'string'
                    ? String(res.breakdown['promo_code']).toUpperCase()
                    : ''

            const invalid = promoErrorCode === 'INVALID_PROMO_CODE'
            const expired = promoErrorCode === 'PROMO_EXPIRED'
            const appliedDiscount = Number.isFinite(discount) ? Math.max(0, discount) : 0
            const success = appliedDiscount > 0 && !invalid && !expired

            if (success) {
                setPromoDiscountAzn(appliedDiscount)
                setPromoAppliedCode(normalized)
                setPromoInvalid(false)
                setPromoErrorCode('')
                setPromoStatus('success')
            } else {
                setPromoDiscountAzn(0)
                setPromoAppliedCode('')
                setPromoInvalid(invalid || expired)
                setPromoErrorCode(promoErrorCode)
                setPromoStatus(invalid || expired ? 'invalid' : 'idle')
            }
        } catch {
            setPromoDiscountAzn(0)
            setPromoAppliedCode('')
            setPromoInvalid(true)
            setPromoStatus('invalid')
        } finally {
            setPromoApplying(false)
        }
    }

    const checkoutHref =
        promoStatus === 'success' && promoAppliedCode
            ? `/checkout?promo=${encodeURIComponent(promoAppliedCode)}`
            : '/checkout'

    if (!mounted) {
        return (
            <div className="container">
                <h1 className={styles.title}>{t('cart')}</h1>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <>
                <div className="container">
                    <h1 className={styles.title}>{t('cart')}</h1>
                    <div className={styles.empty}>
                        <p>{t('yourCartEmpty')}</p>
                        <Link href="/shop" className="btn btn-primary">
                            {t('continueShopping')}
                        </Link>
                    </div>
                </div>
                <WhatsAppButton pageTag="cart" />
            </>
        )
    }

    return (
        <>
            <div className="container">
                <h1 className={styles.title}>{t('cart')}</h1>
                <div className={styles.wrap}>
                    <div className={styles.list}>
                        {items.map((item) => {
                            const price = getItemPrice(item)
                            const lineTotal = price * item.quantity
                            const colorName = item.product.variants?.[item.variantIndex]?.color
                            const lineTitle = productDisplayName(item.product, locale)
                            return (
                                <div
                                    key={`${item.product.id}-${item.variantIndex}-${item.size}`}
                                    className={styles.item}
                                >
                                    <div className={styles.itemImage}>
                                        <img
                                            src={getItemImage(item)}
                                            alt={lineTitle}
                                            className={styles.itemImageFill}
                                            loading="eager"
                                            decoding="async"
                                        />
                                    </div>
                                    <div className={styles.itemInfo}>
                                        <h3 className={styles.itemName}>{lineTitle}</h3>
                                        <p className={styles.itemMeta}>
                                            {colorName && `${colorName} · `}
                                            {t('sizeLabel')}: {item.size} · ₼{price.toFixed(2)} {t('each')}
                                        </p>
                                        <div className={styles.itemActions}>
                                            <div className={styles.qty}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(item.product.id, item.variantIndex, item.size, item.quantity - 1)
                                                    }
                                                >
                                                    −
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(item.product.id, item.variantIndex, item.size, item.quantity + 1)
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                className={styles.remove}
                                                onClick={() => removeItem(item.product.id, item.variantIndex, item.size)}
                                            >
                                                {t('remove')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.itemTotal}>₼{lineTotal.toFixed(2)}</div>
                                </div>
                            )
                        })}
                    </div>
                    <div className={styles.sidebar}>
                        <div className={styles.summary}>
                            <p className={styles.summaryRow}>
                                <span>{t('subtotal')}</span>
                                <span>₼{subtotal.toFixed(2)}</span>
                            </p>

                            <button
                                type="button"
                                className={styles.promoToggle}
                                onClick={() => setPromoOpen((v) => !v)}
                            >
                                {t('havePromoCode')}
                            </button>

                            {promoOpen && (
                                <div className={styles.promoPanel}>
                                    <input
                                        type="text"
                                        className={styles.promoInput}
                                        placeholder={t('promoCodePlaceholder')}
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => void handleApplyPromoFromCart()}
                                        disabled={promoApplying || !promoCode.trim()}
                                    >
                                        {promoApplying ? t('loading') : t('applyPromoCode')}
                                    </button>
                                    {promoStatus === 'success' && (
                                        <>
                                            <p className={styles.promoSuccess}>{t('promoAppliedSuccess')}</p>
                                            {promoDiscountAzn > 0 && (
                                                <p className={styles.promoSuccess}>
                                                    {t('promoCode')}: −₼{promoDiscountAzn.toFixed(2)}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    {promoStatus === 'invalid' && (
                                        <p className={styles.promoError}>
                                            {promoErrorCode === 'PROMO_EXPIRED'
                                                ? t('promoExpiredCode')
                                                : t('promoInvalidCode')}
                                        </p>
                                    )}
                                </div>
                            )}
                            <p className={styles.note}>{t('shippingNote')}</p>
                            <Link href={checkoutHref} className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
                                {t('checkout')}
                            </Link>
                            <Link href="/shop" className={styles.continue}>
                                {t('continueShopping')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <WhatsAppButton pageTag="cart" />
        </>
    )
}
