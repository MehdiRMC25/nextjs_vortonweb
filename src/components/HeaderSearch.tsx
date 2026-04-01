'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import styles from './Layout.module.css'

export default function HeaderSearch() {
  const { t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams, pathname])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = value.trim()
    const isShopListing = pathname === '/shop'

    if (isShopListing) {
      const next = new URLSearchParams(searchParams.toString())
      if (q) next.set('q', q)
      else next.delete('q')
      const qs = next.toString()
      router.push(qs ? `/shop?${qs}` : '/shop')
      return
    }

    if (q) router.push(`/shop?q=${encodeURIComponent(q)}`)
    else router.push('/shop')
  }

  return (
    <form className={styles.headerSearch} onSubmit={handleSubmit} role="search">
      <label htmlFor="header-search" className={styles.headerSearchLabel}>
        {t('searchProducts')}
      </label>
      <input
        id="header-search"
        name="q"
        type="search"
        className={styles.headerSearchInput}
        placeholder={t('searchProductsPlaceholder')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
    </form>
  )
}
