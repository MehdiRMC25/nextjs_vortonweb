'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import {
    getOrders,
    getOrdersStats,
    OrdersApiError,
    type Order,
    type OrderStatsItem,
    type OrderStatus,
} from '@/api/orders'
import { DEMO_ORDERS, DEMO_STATS } from '@/data/demoOrders'
import { useOrdersSocket } from '@/hooks/useOrdersSocket'
import type { UserRole } from '@/api/auth'
import styles from '@/app/orders/Orders.module.css'

const STATUS_OPTIONS: OrderStatus[] = ['NEW', 'PROCESSING', 'DISPATCHED', 'DELIVERED']

const STATUS_KEYS: Record<OrderStatus, string> = {
    NEW: 'statusNew',
    PROCESSING: 'statusProcessing',
    DISPATCHED: 'statusDispatched',
    DELIVERED: 'statusDelivered',
}

function statusClass(s: OrderStatus): string {
    return styles[`status${s.charAt(0) + s.slice(1).toLowerCase()}`] ?? ''
}

export default function StaffOrders() {
    const { t, locale } = useLocale()
    const { user, token, logout } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [stats, setStats] = useState<OrderStatsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')

    const role: UserRole = (user?.role as UserRole) ?? 'customer'
    const isManager = role === 'manager'

    const fetchOrders = useCallback(async () => {
        if (!token) return
        setError(null)
        try {
            const list = await getOrders(token)
            setOrders((prev) => {
                if (list.length === 0) return prev.length > 0 ? prev : DEMO_ORDERS
                const byId = new Map(prev.map((o) => [o.id, o]))
                for (const o of list) byId.set(o.id, o)
                return [...byId.values()].sort(
                    (a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
                )
            })
        } catch (e) {
            if (e instanceof OrdersApiError && e.status === 401) {
                logout()
                return
            }
            setError(e instanceof Error ? e.message : 'Failed to load orders')
            setOrders(DEMO_ORDERS)
        } finally {
            setLoading(false)
        }
    }, [token, logout])

    const fetchStats = useCallback(async () => {
        if (!token || !isManager) return
        try {
            const data = await getOrdersStats(token)
            setStats(data.length > 0 ? data : DEMO_STATS)
        } catch {
            setStats(DEMO_STATS)
        }
    }, [token, isManager])

    useEffect(() => {
        setLoading(true)
        fetchOrders()
    }, [fetchOrders])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    // Refetch when user returns to tab (e.g. after completing payment elsewhere)
    useEffect(() => {
        const onFocus = () => token && fetchOrders()
        window.addEventListener('focus', onFocus)
        const onVisibility = () => document.visibilityState === 'visible' && token && fetchOrders()
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [token, fetchOrders])

    useOrdersSocket(fetchOrders)

    const filteredOrders =
        statusFilter === 'ALL'
            ? orders
            : orders.filter((o) => o.status === statusFilter)

    const dateFormat = locale === 'az' ? 'az-AZ' : 'en-GB'
    const formatDate = (d: string) => {
        try {
            const date = new Date(d)
            const day = date.getDate()
            const month = date.toLocaleString(dateFormat, { month: 'short' })
            const year = date.getFullYear()
            return `${day} ${month} ${year}`
        } catch {
            return d
        }
    }

    /** Short summary of order items for list view: "Name ×qty, Name ×qty" */
    function itemsSummary(items: Order['items']): string {
        if (!Array.isArray(items) || items.length === 0) return '—'
        return items
            .map((i) => `${i.name || 'Item'} ×${Number(i.quantity) || 0}`)
            .join(', ')
    }

    return (
        <>
            <h1 className={styles.title}>{t('allOrders')}</h1>
            <p className={styles.subtitle}>
                View and manage orders. Status updates appear in real time.
                {orders.length > 0 && String(orders[0].id ?? '').startsWith('demo-') && (
                    <span style={{ display: 'block', marginTop: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Showing demo data. Remove when backend has real orders.
          </span>
                )}
            </p>

            {isManager && stats.length > 0 && (
                <div className={styles.statsRow}>
                    {stats.map((s) => (
                        <div key={s.status} className={styles.statCard}>
                            <div className={styles.statLabel}>{t(STATUS_KEYS[s.status])}</div>
                            <div className={styles.statValue}>{s.count}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.filterRow}>
                <span className={styles.filterLabel}>{t('orderStatus')}:</span>
                <select
                    className={styles.filterSelect}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                >
                    <option value="ALL">All</option>
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {t(STATUS_KEYS[s])}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    className={styles.refreshBtn}
                    onClick={() => {
                        setLoading(true)
                        fetchOrders()
                    }}
                    disabled={!token || loading}
                >
                    Refresh
                </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {loading && <p className={styles.loading}>Loading…</p>}

            {!loading && !error && filteredOrders.length === 0 && (
                <p className={styles.loading}>No orders found.</p>
            )}

            {!loading && filteredOrders.length > 0 && (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>{t('orderNumber')}</th>
                            <th>{t('customer')}</th>
                            <th>{t('orderStatus')}</th>
                            <th>{t('items')}</th>
                            <th>{t('orderColumn')}</th>
                            <th>{t('deliveryColumn')}</th>
                            <th>{t('deliveredColumn')}</th>
                            <th>{t('orderTotal')}</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.id}>
                                <td>
                                    <strong>{order.order_number}</strong>
                                </td>
                                <td className={styles.customerCell}>
                                    {isManager ? (
                                        <>
                                            <span className={styles.customerName}>{order.customer_name || '—'}</span>
                                            {order.mobile && (
                                                <span className={styles.customerMobile}>{order.mobile}</span>
                                            )}
                                            {order.address && (
                                                <span className={styles.customerAddress} title={order.address}>
                            {order.address.length > 30 ? order.address.slice(0, 30) + '…' : order.address}
                          </span>
                                            )}
                                        </>
                                    ) : (
                                        '—'
                                    )}
                                </td>
                                <td>
                    <span className={`${styles.statusBadge} ${statusClass(order.status)}`}>
                      {t(STATUS_KEYS[order.status])}
                    </span>
                                </td>
                                <td className={styles.itemsCell}>{itemsSummary(order.items)}</td>
                                <td>{formatDate(order.order_date)}</td>
                                <td>
                                    {order.status === 'DELIVERED' && order.delivery_due_date
                                        ? formatDate(order.delivery_due_date)
                                        : '—'}
                                </td>
                                <td>
                                    {order.delivered_at ? formatDate(order.delivered_at) : '—'}
                                </td>
                                <td>{order.total_price.toFixed(2)}</td>
                                <td>
                                    {order.id != null && order.id !== '' && (
                                        <Link href={`/staff/orders/${String(order.id)}`} className={styles.link}>
                                            {t('orderDetails')}
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    )
}
