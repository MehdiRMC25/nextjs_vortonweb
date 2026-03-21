'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import type { UserRole } from '../api/auth'
import styles from './StaffLayout.module.css'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLocale()
  const { user, logout } = useAuth()
  const role: UserRole = (user?.role as UserRole) ?? 'employee'
  const isManager = role === 'manager'
  const accountLabel = isManager ? t('managerAccount') : t('staffAccount')

  function handleSignOut() {
    logout()
    router.replace('/staff/login')
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/staff/dashboard" className={styles.brand}>
            Vorton Staff
          </Link>
          <span className={styles.accountBadge}>{accountLabel}</span>
          <nav className={styles.nav}>
            <Link
              href="/staff/dashboard"
              className={pathname === '/staff/dashboard' ? styles.navActive : ''}
            >
              Dashboard
            </Link>
            <Link
              href="/staff/orders"
              className={pathname.startsWith('/staff/orders') ? styles.navActive : ''}
            >
              Orders
            </Link>
            <Link
              href="/staff/sales"
              className={pathname === '/staff/sales' ? styles.navActive : ''}
            >
              Sales
            </Link>
            <Link
              href="/staff/production"
              className={pathname === '/staff/production' ? styles.navActive : ''}
            >
              Production
            </Link>
            <button type="button" className={styles.signOutBtn} onClick={handleSignOut}>
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
    </div>
  )
}
