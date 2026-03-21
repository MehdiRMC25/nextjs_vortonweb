import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { translations, type Locale } from '../locales/translations'

const STORAGE_KEY = 'vorton-locale'

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'az'
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  if (stored === 'en' || stored === 'az') return stored
  return 'az'
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

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
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
