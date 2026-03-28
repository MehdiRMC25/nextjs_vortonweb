'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '../context/CartContext'
import { useLocale } from '../context/LocaleContext'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../api/auth'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { totalItems } = useCart()
  const { locale, setLocale, t } = useLocale()
  const { isAuthenticated, user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isHome = pathname === '/'
  const currentYear = new Date().getFullYear()
  const role: UserRole = (user?.role as UserRole) ?? 'customer'
  const isStaff = role === 'employee' || role === 'manager'

  function handleSignOut() {
    logout()
    router.push('/')
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <img
              src="/Vorton_Logo.png"
              alt="Vorton"
              className={styles.logoIcon}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </Link>
          <div className={styles.navWrap}>
          <nav className={styles.nav}>
            <Link href="/" className={pathname === '/' ? styles.navActive : ''}>
              {t('home')}
            </Link>
            <Link href="/about" className={pathname === '/about' ? styles.navActive : ''}>
              {t('aboutUs')}
            </Link>
            <Link href="/shop" className={pathname.startsWith('/shop') ? styles.navActive : ''}>
              {t('shop')}
            </Link>
            <Link href="/cart" className={styles.cartLink + (pathname === '/cart' ? ' ' + styles.navActive : '')}>
              {t('cart')}
              {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
            </Link>
            {!mounted ? (
              <Link href="/signin" className={pathname === '/signin' ? styles.navActive : ''}>
                {t('signIn')}
              </Link>
            ) : isAuthenticated ? (
              <>
                {isStaff ? (
                  <Link href="/staff/dashboard" className={pathname.startsWith('/staff') ? styles.navActive : ''}>
                    Staff
                  </Link>
                ) : (
                  <Link href="/orders" className={pathname.startsWith('/orders') ? styles.navActive : ''}>
                    {t('myOrders')}
                  </Link>
                )}
                <Link href="/account" className={pathname === '/account' ? styles.navActive : ''}>
                  {t('myAccount')}
                </Link>
                <button type="button" className={styles.signOutBtn} onClick={handleSignOut}>
                  {t('signOut')}
                </button>
              </>
            ) : (
              <Link href="/signin" className={pathname === '/signin' ? styles.navActive : ''}>
                {t('signIn')}
              </Link>
            )}
            <Link href="/contact" className={pathname === '/contact' ? styles.navActive : ''}>
              {t('contact')}
            </Link>
            <button
              type="button"
              className={locale === 'en' ? `${styles.langBtn} ${styles.langBtnActive}` : styles.langBtn}
              onClick={() => setLocale(locale === 'az' ? 'en' : 'az')}
              title={t('changeLanguage')}
            >
              {locale === 'az' ? t('english') : t('azerbaijani')}
            </button>
          </nav>
          </div>
        </div>
      </header>
      <main className={`${styles.main} ${isHome ? '' : styles.mainPadded}`.trim()}>{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerBottom}>
          <span>© {currentYear} Vorton. All rights reserved.</span>
          <span className={styles.footerLinks}>
            <Link href="/reward-points" className={styles.footerPolicyLink}>
              {t('footerMembershipPolicyLink')}
            </Link>
            <span className={styles.footerLinksSep} aria-hidden="true">
              ·
            </span>
            <span className={styles.footerTagline}>{t('footerTagline')}</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
