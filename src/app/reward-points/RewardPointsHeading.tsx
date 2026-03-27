'use client'

import { useLocale } from '@/context/LocaleContext'
import styles from './RewardPoints.module.css'

export default function RewardPointsHeading() {
  const { t } = useLocale()
  return <h1 className={styles.title}>{t('rewardPoints')}</h1>
}
