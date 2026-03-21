'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { getOrdersByCustomer, type Order, type OrderStatus } from '@/api/orders'
import { useOrdersSocket } from '@/hooks/useOrdersSocket'
import styles from './Orders.module.css'

const STATUS_KEYS: Record<OrderStatus, string> = {
    NEW: 'statusNew',
    PROCESSING: 'statusProcessing',
    DISPATCHED: 'statusDispatched',
    DELIVERED: 'statusDelivered',
}

function statusClass(s: OrderStatus): string {
    return styles[`status${s.charAt(0) + s.slice(1).toLowerCase()}`] ?? ''
}

/**
 * Public customer orders: My orders + track by number only. Staff use /staff/orders.
 */
export default function Orders() {
    const { t, locale } = useLocale()
    const { user, token } = useAuth()
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [trackNumber, setTrackNumber] = useState('')
    const [trackError, setTrackError] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        if (!token || user?.id == null) return
        setError(null)
        try {
            const list = await getOrdersByCustomer(String(user.id), token)
            setOrders(list)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load orders')
            setOrders([])
        } finally {
            setLoading(false)
        }
    }, [token, user?.id])

    useEffect(() => {
        setLoading(true)
        fetchOrders()
    }, [fetchOrders])

    useOrdersSocket(fetchOrders)

    if (!token) {
        return (
            <div className="container">
                <div className={styles.wrap}>
                    <p className={styles.error}>{t('signIn')} to view orders.</p>
                    <Link href="/signin" className={styles.backLink}>
                        {t('signIn')}
                    </Link>
                </div>
            </div>
        )
    }

    function handleTrack(e: React.FormEvent) {
        e.preventDefault()
        setTrackError(null)
        const num = trackNumber.trim()
        if (!num) return
        const found = orders.find((o) => o.order_number.toLowerCase() === num.toLowerCase())
        if (found) {
            router.push(`/orders/${found.id}`)
        } else {
            setTrackError('Order not found')
        }
    }

    const dateFormat = locale === 'az' ? 'az-AZ' : 'en-GB'
    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString(dateFormat, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            })
        } catch {
            return d
        }
    }

    return (
        <div className="container">
            <div className={styles.wrap}>
                <h1 className={styles.title}>{t('myOrders')}</h1>
                <p className={styles.subtitle}>{t('orderHistory')}</p>

                <section className={styles.trackSection}>
                    <form onSubmit={handleTrack} className={styles.trackRow}>
                        <input
                            type="text"
                            className={styles.trackInput}
                            placeholder={t('orderNumber')}
                            value={trackNumber}
                            onChange={(e) => {
                                setTrackNumber(e.target.value)
                                setTrackError(null)
                            }}
                        />
                        <button type="submit" className="btn">
                            {t('trackOrder')}
                        </button>
                    </form>
                    {trackError && <p className={styles.error}>{trackError}</p>}
                </section>

                {error && <p className={styles.error}>{error}</p>}
                {loading && <p className={styles.loading}>Loading…</p>}

                {!loading && !error && orders.length === 0 && (
                    <p className={styles.loading}>No orders found.</p>
                )}

                {!loading && orders.length > 0 && (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>{t('orderNumber')}</th>
                                <th>{t('orderStatus')}</th>
                                <th>{t('orderDate')}</th>
                                <th>{t('orderTotal')}</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <strong>{order.order_number}</strong>
                                    </td>
                                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(order.status)}`}>
                        {t(STATUS_KEYS[order.status])}
                      </span>
                                    </td>
                                    <td>{formatDate(order.order_date)}</td>
                                    <td>{order.total_price.toFixed(2)}</td>
                                    <td>
                                        <Link href={`/orders/${order.id}`} className={styles.link}>
                                            {t('orderDetails')}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
