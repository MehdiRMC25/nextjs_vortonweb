"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { translations, type Locale } from '../locales/translations'
import {
  LOCALE_COOKIE_MAX_AGE_SEC,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
} from '@/lib/localeStorage'

const STORAGE_KEY = LOCALE_STORAGE_KEY

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  geoCountry: string | undefined
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  children,
  defaultLocale,
  geoCountry,
}: {
  children: ReactNode
  defaultLocale: Locale
  geoCountry?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === 'en' || stored === 'az') {
      setLocaleState(stored)
      document.cookie = `${LOCALE_COOKIE_NAME}=${stored}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SEC}; SameSite=Lax`
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-locale', locale)
  }, [locale])

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next)
      localStorage.setItem(STORAGE_KEY, next)
      document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SEC}; SameSite=Lax`
      if (pathname === '/reward-points') {
        router.refresh()
      }
    },
    [pathname, router]
  )

  const t = useCallback(
    (key: string) => translations[locale][key] ?? key,
    [locale]
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, geoCountry }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
