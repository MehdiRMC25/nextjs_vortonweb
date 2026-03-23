'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { getOrderById, type Order, type OrderStatus } from '@/api/orders'
import { useOrdersSocket } from '@/hooks/useOrdersSocket'
import { DeliveryTracker, type DeliveryStage } from '@/components/DeliveryTracker'
import { OrderReceipt } from '@/components/OrderReceipt'
import styles from './TrackOrder.module.css'

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

export default function TrackOrderPage() {
  const { t, locale } = useLocale()
  const { token } = useAuth()
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const printTriggered = useRef(false)

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

  useEffect(() => {
    if (order && searchParams.get('print') === '1' && !printTriggered.current) {
      printTriggered.current = true
      window.print()
    }
  }, [order, searchParams])

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
          <Link href="/account" className={styles.backLink}>← {t('myAccount')}</Link>
          <Link href="/orders" className={styles.backLink}>← {t('myOrders')}</Link>
          <p className={styles.error}>{error}</p>
          <p className={styles.notFound}>{t('orderNotFound')}</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container">
        <div className={styles.wrap}>
          <Link href="/orders" className={styles.backLink}>← {t('myOrders')}</Link>
          <p className={styles.notFound}>{t('orderNotFound')}</p>
        </div>
      </div>
    )
  }

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
  const stageTimestamps = buildStageTimestamps(order)

  return (
    <div className="container">
      <div className={styles.wrap}>
        <Link href="/orders" className={styles.backLink}>
          ← {t('myOrders')}
        </Link>
        <Link href="/account" className={styles.backLink}>
          ← {t('myAccount')}
        </Link>

        <h1 className={styles.title}>{t('deliveryTracking')}</h1>
        <p className={styles.subtitle}>{t('orderNumber')}: <strong>{order.order_number}</strong></p>

        <section className={styles.trackerSection}>
          <DeliveryTracker
            status={order.status}
            stageTimestamps={stageTimestamps}
            estimatedDelivery={order.delivery_due_date}
          />
        </section>

        <section className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>{t('orderDetails')}</h2>
          <div className={styles.detailsGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>{t('orderNumber')}</span>
              <span className={styles.value}>{order.order_number}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>{t('orderDate')}</span>
              <span className={styles.value}>{formatDate(order.order_date)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>{t('address')}</span>
              <span className={styles.value}>{order.address || t('notProvided')}</span>
            </div>
          </div>

          <h3 className={styles.itemsTitle}>{t('items')}</h3>
          <ul className={styles.itemsList}>
            {order.items.map((item, i) => (
              <li key={i} className={styles.itemRow}>
                <span>{item.name}{item.size ? ` (${item.size})` : ''}</span>
                <span>× {item.quantity}</span>
              </li>
            ))}
          </ul>

          <p className={styles.totalRow}>
            <span className={styles.label}>{t('orderTotal')}</span>
            <span className={styles.total}>₼{order.total_price.toFixed(2)}</span>
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

        <div className={styles.actions}>
          <Link href={`/orders/${order.id}`} className="btn btn-secondary">
            {t('orderDetails')}
          </Link>
          <Link href="/shop" className="btn btn-primary">
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  )
}
