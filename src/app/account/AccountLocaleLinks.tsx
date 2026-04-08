'use client'

import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { buildLocaleSwitchUrl, normalizeRegistrableHost, VORTON_HOST_AZ, VORTON_HOST_UK } from '@/lib/domainConfig'
import styles from './Account.module.css'

function AccountLocaleLinksInner() {
  const { locale, t } = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : ''
  const azUrl = buildLocaleSwitchUrl('az', pathname, search)
  const enUrl = buildLocaleSwitchUrl('en', pathname, search)
  const host =
    typeof window !== 'undefined' ? normalizeRegistrableHost(window.location.host) : ''

  // Domain-specific behavior:
  // - vorton.uk: show Language = English only (no cross-site link)
  // - vorton.az: show Azerbaijani + hint for English on vorton.com
  if (host === VORTON_HOST_UK) {
    return (
      <div className={`${styles.langOptions} ${styles.langOptionsSingle}`}>
        <span className={`${styles.langOption} ${styles.langOptionActive}`}>{t('english')}</span>
      </div>
    )
  }

  if (host === VORTON_HOST_AZ || locale === 'az') {
    return (
      <div className={styles.langOptions}>
        <span className={`${styles.langOption} ${styles.langOptionActive}`}>{t('azerbaijani')}</span>
        <a
          href="https://vorton.com"
          className={styles.langOption}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('accountLanguageEnglishOnDotCom')}
        </a>
      </div>
    )
  }

  return (
    <div className={`${styles.langOptions} ${styles.langOptionsSingle}`}>
      <span className={`${styles.langOption} ${styles.langOptionActive}`}>{t('english')}</span>
    </div>
  )
}

export default function AccountLocaleLinks() {
  return (
    <Suspense fallback={<div className={styles.langOptions} />}>
      <AccountLocaleLinksInner />
    </Suspense>
  )
}
