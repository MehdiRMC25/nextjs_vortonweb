'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { getOrdersStats } from '@/api/orders'
import { DEMO_STATS } from '@/data/demoOrders'
import { useState, useEffect } from 'react'
import type { OrderStatsItem, OrderStatus } from '@/api/orders'
import type { UserRole } from '@/api/auth'
import styles from '@/app/orders/Orders.module.css'

const STATUS_KEYS: Record<OrderStatus, string> = {
    NEW: 'statusNew',
    PROCESSING: 'statusProcessing',
    DISPATCHED: 'statusDispatched',
    DELIVERED: 'statusDelivered',
}

export default function StaffDashboard() {
    const { t } = useLocale()
    const { user, token } = useAuth()
    const [stats, setStats] = useState<OrderStatsItem[]>([])
    const [showingDemoStats, setShowingDemoStats] = useState(false)
    const role: UserRole = (user?.role as UserRole) ?? 'customer'
    const isManager = role === 'manager'

    useEffect(() => {
        if (!token || !isManager) return
        getOrdersStats(token)
            .then((data) => {
                if (data.length > 0) {
                    setStats(data)
                    setShowingDemoStats(false)
                } else {
                    setStats(DEMO_STATS)
                    setShowingDemoStats(true)
                }
            })
            .catch(() => {
                setStats(DEMO_STATS)
                setShowingDemoStats(true)
            })
    }, [token, isManager])

    return (
        <>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>
                Internal operations. Use the nav to open Orders or Production.
            </p>

            {isManager && stats.length > 0 && (
                <>
                    <div className={styles.statsRow} style={{ marginBottom: 8 }}>
                        {stats.map((s) => (
                            <div key={s.status} className={styles.statCard}>
                                <div className={styles.statLabel}>{t(STATUS_KEYS[s.status])}</div>
                                <div className={styles.statValue}>{s.count}</div>
                            </div>
                        ))}
                    </div>
                    {showingDemoStats && (
                        <p style={{ marginBottom: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Demo stats. Remove when backend has real data.
                        </p>
                    )}
                </>
            )}

            <p>
                <Link href="/staff/orders" className={styles.link}>
                    → Open Orders
                </Link>
                {' · '}
                <Link href="/staff/production" className={styles.link}>
                    → Production
                </Link>
            </p>
        </>
    )
}
