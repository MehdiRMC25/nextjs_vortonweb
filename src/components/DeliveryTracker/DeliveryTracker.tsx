'use client'

import type { OrderStatus } from '@/api/orders'
import { useLocale } from '@/context/LocaleContext'
import styles from './DeliveryTracker.module.css'

export type DeliveryStage = 'preparing' | 'dispatched' | 'delivered'

const STAGE_MAP: Record<OrderStatus, DeliveryStage> = {
  NEW: 'preparing',
  PROCESSING: 'preparing',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
}

const STAGE_LABEL_KEYS: Record<DeliveryStage, string> = {
  preparing: 'trackStagePreparing',
  dispatched: 'trackStageDispatched',
  delivered: 'trackStageDelivered',
}

const STAGES: Array<{ key: DeliveryStage; icon: string }> = [
  { key: 'preparing', icon: '📦' },
  { key: 'dispatched', icon: '🚚' },
  { key: 'delivered', icon: '✅' },
]

export interface DeliveryTrackerProps {
  status: OrderStatus
  /** Optional timestamps per stage from status_history */
  stageTimestamps?: Record<DeliveryStage, string | null>
  /** Optional estimated delivery date */
  estimatedDelivery?: string | null
  className?: string
}

export function DeliveryTracker({
  status,
  stageTimestamps,
  estimatedDelivery,
  className = '',
}: DeliveryTrackerProps) {
  const { t, locale } = useLocale()
  const currentStage = STAGE_MAP[status]
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage)
  const progressPercent = (currentIndex / (STAGES.length - 1)) * 100

  return (
    <div className={`${styles.tracker} ${className}`} role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={3}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className={styles.stages}>
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex
          const isActive = index === currentIndex
          const isUpcoming = index > currentIndex
          return (
            <div
              key={stage.key}
              className={`${styles.stage} ${isCompleted ? styles.stageCompleted : ''} ${isActive ? styles.stageActive : ''} ${isUpcoming ? styles.stageUpcoming : ''}`}
            >
              <div className={styles.stageIcon}>{stage.icon}</div>
              <div className={styles.stageLabel}>{t(STAGE_LABEL_KEYS[stage.key])}</div>
              {stageTimestamps?.[stage.key] && (
                <div className={styles.stageTime}>
                  {(() => {
                    const d = new Date(stageTimestamps[stage.key]!)
                    const day = d.getDate()
                    const month = d.toLocaleString(locale === 'az' ? 'az-AZ' : 'en-GB', { month: 'short' })
                    const year = d.getFullYear()
                    const time = d.toLocaleTimeString(locale === 'az' ? 'az-AZ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
                    return `${day} ${month} ${year} ${time}`
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {estimatedDelivery && currentStage !== 'delivered' && (
        <p className={styles.estimated}>
          {t('estimatedDelivery')}: {(() => {
            const d = new Date(estimatedDelivery)
            const weekday = d.toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-GB', { weekday: 'short' })
            const day = d.getDate()
            const month = d.toLocaleString(locale === 'az' ? 'az-AZ' : 'en-GB', { month: 'short' })
            const year = d.getFullYear()
            return `${weekday}, ${day} ${month} ${year}`
          })()}
        </p>
      )}
    </div>
  )
}
