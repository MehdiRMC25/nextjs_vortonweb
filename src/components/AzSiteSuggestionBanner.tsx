'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/context/LocaleContext'
import { buildLocaleSwitchUrl } from '@/lib/domainConfig'
import { translations } from '@/locales/translations'
import styles from './AzSiteSuggestionBanner.module.css'

const STORAGE_KEY = 'vorton-hide-az-suggest'

/** UK site only: suggest vorton.az to visitors geolocated in Azerbaijan. Renders after mount to avoid hydration mismatch. */
export default function AzSiteSuggestionBanner() {
  const { locale, geoCountry, t } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setMounted(true)
      try {
        setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
      } catch {
        setDismissed(false)
      }
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  if (!mounted || locale !== 'en' || geoCountry !== 'AZ' || dismissed) return null

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const azUrl = buildLocaleSwitchUrl('az', pathname, search)

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div className={styles.banner} role="region" aria-label={translations.az.geoBannerAzAria}>
      <p className={styles.text}>{translations.az.geoBannerAzBody}</p>
      <div className={styles.actions}>
        <a href={azUrl} className={styles.cta}>
          {translations.az.geoBannerAzCta}
        </a>
        <button type="button" className={styles.dismiss} onClick={dismiss}>
          {translations.az.geoBannerAzDismiss}
        </button>
      </div>
    </div>
  )
}
