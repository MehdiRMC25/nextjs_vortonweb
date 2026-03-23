"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { translations, type Locale } from '../locales/translations'

const STORAGE_KEY = 'vorton-locale'

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
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === 'en' || stored === 'az') setLocaleState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-locale', locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

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
