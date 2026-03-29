'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { buildLocaleSwitchUrl } from '@/lib/domainConfig'
import styles from './Layout.module.css'

/** Azerbaijan site: link to English site. UK site: no header language toggle. */
export default function HeaderDomainLocale() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { locale, t } = useLocale()
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : ''

  if (locale === 'en') return null

  const enUrl = buildLocaleSwitchUrl('en', pathname, search)

  return (
    <a
      href={enUrl}
      className={`${styles.langBtn} ${styles.langBtnActive}`}
      rel="noopener noreferrer"
    >
      {t('english')}
    </a>
  )
}
