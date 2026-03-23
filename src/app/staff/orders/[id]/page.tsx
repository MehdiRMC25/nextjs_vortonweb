'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { getOrderById, updateOrderStatus, type Order, type OrderStatus } from '@/api/orders'
import { getDemoOrderById } from '@/data/demoOrders'
import { useOrdersSocket } from '@/hooks/useOrdersSocket'
import type { UserRole } from '@/api/auth'
import styles from '@/app/orders/[id]/OrderDetail.module.css'

const STATUS_OPTIONS: OrderStatus[] = ['PROCESSING', 'DISPATCHED', 'DELIVERED']

const STATUS_KEYS: Record<OrderStatus, string> = {
    NEW: 'statusNew',
    PROCESSING: 'statusProcessing',
    DISPATCHED: 'statusDispatched',
    DELIVERED: 'statusDelivered',
}

function statusClass(s: OrderStatus): string {
    return styles[`status${s.charAt(0) + s.slice(1).toLowerCase()}`] ?? ''
}

export default function StaffOrderDetail() {
    const { t, locale } = useLocale()
    const { user, token } = useAuth()
    const role: UserRole = (user?.role as UserRole) ?? 'customer'
    const isManager = role === 'manager'
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
    const [updating, setUpdating] = useState(false)

    const fetchOrder = useCallback(async () => {
        if (!id) return
        setError(null)
        if (id.startsWith('demo-')) {
            const demoOrder = getDemoOrderById(id)
            if (demoOrder) {
                setOrder(demoOrder)
                setSelectedStatus(demoOrder.status === 'NEW' ? 'PROCESSING' : demoOrder.status)
            } else {
                setOrder(null)
            }
            setLoading(false)
            return
        }
        if (!token) return
        try {
            const data = await getOrderById(id, token)
            setOrder(data)
            setSelectedStatus(data.status === 'NEW' ? 'PROCESSING' : data.status)
        } catch (e) {
            setOrder(null)
            setError(e instanceof Error ? e.message : 'Failed to load order')
        } finally {
            setLoading(false)
        }
    }, [id, token])

    useEffect(() => {
        setLoading(true)
        fetchOrder()
    }, [fetchOrder])

    useOrdersSocket(fetchOrder)

    useEffect(() => {
        if (order) setSelectedStatus(order.status === 'NEW' ? 'PROCESSING' : order.status)
    }, [order?.id, order?.status])

    async function handleUpdateStatus(e: React.FormEvent) {
        e.preventDefault()
        if (!id || !selectedStatus || selectedStatus === order?.status) return
        if (id.startsWith('demo-')) {
            if (order) {
                setOrder({
                    ...order,
                    status: selectedStatus as OrderStatus,
                    status_history: [
                        ...(order.status_history || []),
                        { status: selectedStatus as OrderStatus, created_at: new Date().toISOString() },
                    ],
                })
            }
            return
        }
        if (!token) return
        setUpdating(true)
        try {
            const updated = await updateOrderStatus(id, selectedStatus as OrderStatus, token)
            setOrder(updated)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update status')
        } finally {
            setUpdating(false)
        }
    }

    if (!token) {
        router.replace('/staff/login')
        return null
    }

    if (loading) {
        return <p className={styles.loading}>Loading…</p>
    }

    if (error && !order) {
        return (
            <>
                <Link href="/staff/orders" className={styles.backLink}>
                    ← {t('allOrders')}
                </Link>
                <p className={styles.error}>{error}</p>
                <p className={styles.notFound}>Order not found or you don’t have access.</p>
            </>
        )
    }

    if (!order) {
        return (
            <>
                <Link href="/staff/orders" className={styles.backLink}>
                    ← {t('allOrders')}
                </Link>
                <p className={styles.notFound}>Order not found.</p>
            </>
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
        <div className={styles.wrap}>
            <Link href="/staff/orders" className={styles.backLink}>
                ← {t('allOrders')}
            </Link>

            <h1 className={styles.title}>
                {t('orderDetails')} — {order.order_number}
            </h1>

            {id?.startsWith('demo-') && (
                <p style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Demo order. Status change updates the preview only.
                </p>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>{t('orderStatus')}</h2>
                <p>
          <span className={`${styles.statusBadge} ${statusClass(order.status)}`}>
            {t(STATUS_KEYS[order.status])}
          </span>
                </p>
                {order.status !== 'DELIVERED' && (
                    <form onSubmit={handleUpdateStatus} className={styles.statusSection}>
                        <select
                            className={styles.statusSelect}
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                        >
                            {STATUS_OPTIONS.filter((s) => s !== order.status).map((s) => (
                                <option key={s} value={s}>
                                    {t(STATUS_KEYS[s])}
                                </option>
                            ))}
                            {order.status !== 'NEW' && (
                                <option value={order.status}>{t(STATUS_KEYS[order.status])}</option>
                            )}
                        </select>
                        <button
                            type="submit"
                            className={styles.updateBtn}
                            disabled={updating || selectedStatus === order.status}
                        >
                            {t('changeStatus')}
                        </button>
                    </form>
                )}
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    {isManager ? 'Customer & delivery' : t('orderDate')}
                </h2>
                {isManager && (
                    <>
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
                    </>
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
    )
}
