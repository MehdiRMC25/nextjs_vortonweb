'use client'

import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { buildLocaleSwitchUrl } from '@/lib/domainConfig'
import styles from './Account.module.css'

function AccountLocaleLinksInner() {
  const { locale, t } = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : ''
  const azUrl = buildLocaleSwitchUrl('az', pathname, search)
  const enUrl = buildLocaleSwitchUrl('en', pathname, search)

  if (locale === 'az') {
    return (
      <div className={styles.langOptions}>
        <span className={`${styles.langOption} ${styles.langOptionActive}`}>{t('azerbaijani')}</span>
        <a href={enUrl} className={styles.langOption}>
          {t('accountLanguageOnEnglishSite')}
        </a>
      </div>
    )
  }

  return (
    <div className={styles.langOptions}>
      <a href={azUrl} className={styles.langOption}>
        {t('accountLanguageOnAzSite')}
      </a>
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
