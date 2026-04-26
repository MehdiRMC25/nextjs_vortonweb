'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
import { productDisplayName } from '@/lib/productDisplay'
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
    const { t, locale } = useLocale()
    const { items, removeItem, updateQuantity } = useCart()
    const [promoOpen, setPromoOpen] = useState(false)
    const [promoCode, setPromoCode] = useState('')

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

    const subtotal = items.reduce((sum, i) => {
        const price = getItemPrice(i)
        return sum + price * i.quantity
    }, 0)
    const promoTrimmed = promoCode.trim()
    const checkoutHref = promoTrimmed ? `/checkout?promo=${encodeURIComponent(promoTrimmed)}` : '/checkout'

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
                                    <p className={styles.promoHint}>{t('promoCodeCartHint')}</p>
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
