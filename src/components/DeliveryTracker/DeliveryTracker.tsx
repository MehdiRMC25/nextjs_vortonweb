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
                  {new Date(stageTimestamps[stage.key]!).toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {estimatedDelivery && currentStage !== 'delivered' && (
        <p className={styles.estimated}>
          {t('estimatedDelivery')}: {new Date(estimatedDelivery).toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}
