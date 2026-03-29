"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { translations, type Locale } from '../locales/translations'

type LocaleContextValue = {
  locale: Locale
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
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    setLocaleState(defaultLocale)
  }, [defaultLocale])

  useEffect(() => {
    document.documentElement.setAttribute('data-locale', locale)
  }, [locale])

  const t = useCallback(
    (key: string) => translations[locale][key] ?? key,
    [locale]
  )

  return (
    <LocaleContext.Provider value={{ locale, t, geoCountry }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
