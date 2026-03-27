'use client'

import { useLocale } from '@/context/LocaleContext'
import styles from './RewardPoints.module.css'

export default function RewardPointsPolicyPage() {
  const { t } = useLocale()

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>{t('rewardPoints')}</h1>
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>{t('rewardPolicySectionEarning')}</h2>
          <p>{t('rewardPolicyEarningIntro')}</p>
          <ul className={styles.tierList}>
            <li>{t('rewardPolicyTierA')}</li>
            <li>{t('rewardPolicyTierB')}</li>
            <li>{t('rewardPolicyTierC')}</li>
          </ul>

          <h2 className={styles.sectionTitle}>{t('rewardPolicySectionCalc')}</h2>
          <p>{t('rewardPolicyCalcIntro')}</p>
          <p>{t('rewardPolicyCalcRate')}</p>
          <p>{t('rewardPolicyExample')}</p>

          <h2 className={styles.sectionTitle}>{t('rewardPolicySectionRedeem')}</h2>
          <ul className={styles.policyList}>
            <li>{t('rewardPolicyRedeem1')}</li>
            <li>{t('rewardPolicyRedeem2')}</li>
            <li>{t('rewardPolicyRedeem3')}</li>
            <li>{t('rewardPolicyRedeem4')}</li>
          </ul>

          <h2 className={styles.sectionTitle}>{t('rewardPolicySectionExclude')}</h2>
          <ul className={styles.policyList}>
            <li>{t('rewardPolicyExclude1')}</li>
            <li>{t('rewardPolicyExclude2')}</li>
          </ul>

          <h2 className={styles.sectionTitle}>{t('rewardPolicySectionAfter')}</h2>
          <p>{t('rewardPolicyAfter1')}</p>
          <p>{t('rewardPolicyAfter2')}</p>
        </div>
      </div>
    </div>
  )
}
