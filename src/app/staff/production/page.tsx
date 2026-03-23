'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useCallback, useState } from 'react'
import { getOrders, type Order } from '@/api/orders'
import { useLocale } from '@/context/LocaleContext'
import styles from '@/app/orders/Orders.module.css'

/** Delivery / Production page: shows orders for fulfilment (same source as Orders, linked for quick access). */
export default function StaffProduction() {
    const { token } = useAuth()
    const { t, locale } = useLocale()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = useCallback(async () => {
        if (!token) return
        try {
            const list = await getOrders(token)
            setOrders(list)
        } catch {
            setOrders([])
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        setLoading(true)
        fetchOrders()
    }, [fetchOrders])

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })
        } catch {
            return d
        }
    }

    const itemsSummary = (items: Order['items']) => {
        if (!Array.isArray(items) || items.length === 0) return '—'
        return items.map((i) => `${i.name || 'Item'} ×${Number(i.quantity) || 0}`).join(', ')
    }

    return (
        <>
            <h1 className={styles.title}>Production</h1>
            <p className={styles.subtitle}>
                Orders for fulfilment and delivery. Use <Link href="/staff/orders">Orders</Link> for full list and status updates.
            </p>
            <div className={styles.filterRow}>
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

            {loading && <p className={styles.loading}>Loading…</p>}
            {!loading && orders.length === 0 && <p className={styles.loading}>No orders.</p>}
            {!loading && orders.length > 0 && (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>{t('orderNumber')}</th>
                            <th>{t('customer')}</th>
                            <th>{t('orderStatus')}</th>
                            <th>{t('items')}</th>
                            <th>{t('orderColumn')}</th>
                            <th>{t('orderTotal')}</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td><strong>{order.order_number}</strong></td>
                                <td>
                                    <span className={styles.customerName}>{order.customer_name || '—'}</span>
                                    {order.mobile && <span className={styles.customerMobile}> {order.mobile}</span>}
                                </td>
                                <td>
                    <span className={`${styles.statusBadge} ${styles[`status${order.status.charAt(0) + order.status.slice(1).toLowerCase()}`] || ''}`}>
                      {order.status}
                    </span>
                                </td>
                                <td className={styles.itemsCell}>{itemsSummary(order.items)}</td>
                                <td>{formatDate(order.order_date)}</td>
                                <td>{order.total_price.toFixed(2)}</td>
                                <td>
                                    <Link href={`/staff/orders/${order.id}`} className={styles.link}>{t('orderDetails')}</Link>
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
