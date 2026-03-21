'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useLocale } from '@/context/LocaleContext'
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
    const { t } = useLocale()
    const { items, removeItem, updateQuantity } = useCart()

    if (items.length === 0) {
        return (
            <div className="container">
                <h1 className={styles.title}>{t('cart')}</h1>
                <div className={styles.empty}>
                    <p>{t('yourCartEmpty')}</p>
                    <Link href="/shop" className="btn btn-primary">
                        {t('continueShopping')}
                    </Link>
                </div>
            </div>
        )
    }

    const subtotal = items.reduce((sum, i) => {
        const price = getItemPrice(i)
        return sum + price * i.quantity
    }, 0)

    return (
        <div className="container">
            <h1 className={styles.title}>{t('cart')}</h1>
            <div className={styles.wrap}>
                <div className={styles.list}>
                    {items.map((item) => {
                        const price = getItemPrice(item)
                        const lineTotal = price * item.quantity
                        const colorName = item.product.variants?.[item.variantIndex]?.color
                        return (
                            <div
                                key={`${item.product.id}-${item.variantIndex}-${item.size}`}
                                className={styles.item}
                            >
                                <div className={styles.itemImage}>
                                    <img src={getItemImage(item)} alt={item.product.name} />
                                </div>
                                <div className={styles.itemInfo}>
                                    <h3 className={styles.itemName}>{item.product.name}</h3>
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
                        <p className={styles.note}>{t('shippingNote')}</p>
                        <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
                            {t('checkout')}
                        </Link>
                        <Link href="/shop" className={styles.continue}>
                            {t('continueShopping')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
