'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { getOrderById, type Order, type OrderStatus } from '@/api/orders'
import { useOrdersSocket } from '@/hooks/useOrdersSocket'
import { DeliveryTracker, type DeliveryStage } from '@/components/DeliveryTracker'
import { OrderReceipt } from '@/components/OrderReceipt'
import styles from './OrderDetail.module.css'

function statusToStage(s: OrderStatus): DeliveryStage {
  if (s === 'NEW' || s === 'PROCESSING') return 'preparing'
  if (s === 'DISPATCHED') return 'dispatched'
  return 'delivered'
}

function buildStageTimestamps(order: Order): Record<DeliveryStage, string | null> {
  const result: Record<DeliveryStage, string | null> = {
    preparing: order.order_date ?? order.created_at ?? null,
    dispatched: null,
    delivered: null,
  }
  for (const entry of order.status_history ?? []) {
    const stage = statusToStage(entry.status)
    if (entry.created_at) result[stage] = entry.created_at
  }
  return result
}

const STATUS_KEYS: Record<OrderStatus, string> = {
    NEW: 'statusNew',
    PROCESSING: 'statusProcessing',
    DISPATCHED: 'statusDispatched',
    DELIVERED: 'statusDelivered',
}

function statusClass(s: OrderStatus): string {
    return styles[`status${s.charAt(0) + s.slice(1).toLowerCase()}`] ?? ''
}

export default function OrderDetail() {
    const { t, locale } = useLocale()
    const { token } = useAuth()
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const fetchOrder = useCallback(async () => {
        if (!id || !token) return
        setError(null)
        try {
            const data = await getOrderById(id, token)
            setOrder(data)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load order')
            setOrder(null)
        } finally {
            setLoading(false)
        }
    }, [id, token])

    useEffect(() => {
        setLoading(true)
        fetchOrder()
    }, [fetchOrder])

    useOrdersSocket(fetchOrder)

    if (!token) {
        router.replace('/signin')
        return null
    }

    if (loading) {
        return (
            <div className="container">
                <div className={styles.wrap}>
                    <p className={styles.loading}>Loading…</p>
                </div>
            </div>
        )
    }

    if (error && !order) {
        return (
            <div className="container">
                <div className={styles.wrap}>
                    <Link href="/orders" className={styles.backLink}>
                        ← {t('myOrders')}
                    </Link>
                    <p className={styles.error}>{error}</p>
                    <p className={styles.notFound}>Order not found or you don’t have access.</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="container">
                <div className={styles.wrap}>
                    <Link href="/orders" className={styles.backLink}>
                        ← {t('myOrders')}
                    </Link>
                    <p className={styles.notFound}>Order not found.</p>
                </div>
            </div>
        )
    }

    const dateFormat = locale === 'az' ? 'az-AZ' : 'en-GB'
    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString(dateFormat, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })
        } catch {
            return d
        }
    }

    const formatDateTime = (d: string) => {
        try {
            return new Date(d).toLocaleString(dateFormat, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        } catch {
            return d
        }
    }

    return (
        <div className="container">
            <div className={styles.wrap}>
                <Link href="/orders" className={styles.backLink}>
                    ← {t('myOrders')}
                </Link>

                <h1 className={styles.title}>
                    {t('orderDetails')} — {order.order_number}
                </h1>

                {error && <p className={styles.error}>{error}</p>}

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('deliveryTracking')}</h2>
                    <DeliveryTracker
                        status={order.status}
                        stageTimestamps={buildStageTimestamps(order)}
                        estimatedDelivery={order.delivery_due_date}
                    />
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('orderStatus')}</h2>
                    <p>
            <span className={`${styles.statusBadge} ${statusClass(order.status)}`}>
              {t(STATUS_KEYS[order.status])}
            </span>
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Customer & delivery</h2>
                    <div className={styles.row}>
                        <span className={styles.label}>Customer</span>
                        <span className={styles.value}>{order.customer_name}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Mobile</span>
                        <span className={styles.value}>{order.mobile}</span>
                    </div>
                    {order.address && (
                        <div className={styles.row}>
                            <span className={styles.label}>Address</span>
                            <span className={styles.value}>{order.address}</span>
                        </div>
                    )}
                    <div className={styles.row}>
                        <span className={styles.label}>{t('orderDate')}</span>
                        <span className={styles.value}>{formatDate(order.order_date)}</span>
                    </div>
                    {order.delivery_due_date && (
                        <div className={styles.row}>
                            <span className={styles.label}>Delivery due</span>
                            <span className={styles.value}>{formatDate(order.delivery_due_date)}</span>
                        </div>
                    )}
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Items</h2>
                    <table className={styles.itemsTable}>
                        <thead>
                        <tr>
                            <th>SKU-Color</th>
                            <th>Item</th>
                            <th>Size</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                        </tr>
                        </thead>
                        <tbody>
                        {order.items.map((item, i) => (
                            <tr key={i}>
                                <td className={styles.skuCode}>{item.sku_color ?? '—'}</td>
                                <td>{item.name}</td>
                                <td>{item.size ?? '—'}</td>
                                <td>{item.quantity}</td>
                                <td>{Number(item.price).toFixed(2)}</td>
                                <td>{(item.quantity * Number(item.price)).toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <p className={styles.row} style={{ marginTop: 12 }}>
                        <span className={styles.label}>{t('orderTotal')}</span>
                        <span className={styles.value}>{order.total_price.toFixed(2)}</span>
                    </p>

                    <OrderReceipt
                        order={{
                            id: order.id,
                            order_number: order.order_number,
                            order_date: order.order_date,
                            customer_name: order.customer_name,
                            mobile: order.mobile,
                            address: order.address ?? undefined,
                            total_price: order.total_price,
                            items: order.items.map((item) => ({
                                name: item.name,
                                quantity: item.quantity,
                                price: Number(item.price),
                                size: item.size ?? undefined,
                                sku_color: item.sku_color ?? undefined,
                            })),
                        }}
                    />
                </section>

                {order.status_history && order.status_history.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Status history</h2>
                        <ul className={styles.historyList}>
                            {order.status_history.map((entry, i) => (
                                <li key={i} className={styles.historyItem}>
                  <span className={`${styles.statusBadge} ${statusClass(entry.status)}`}>
                    {t(STATUS_KEYS[entry.status])}
                  </span>
                                    <span>{formatDateTime(entry.created_at)}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    )
}
