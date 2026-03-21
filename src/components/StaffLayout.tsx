import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import type { UserRole } from '../api/auth'
import styles from './StaffLayout.module.css'

export default function StaffLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLocale()
  const { user, logout } = useAuth()
  const role: UserRole = (user?.role as UserRole) ?? 'employee'
  const isManager = role === 'manager'
  const accountLabel = isManager ? t('managerAccount') : t('staffAccount')

  function handleSignOut() {
    logout()
    navigate('/staff/login', { replace: true })
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/staff/dashboard" className={styles.brand}>
            Vorton Staff
          </Link>
          <span className={styles.accountBadge}>{accountLabel}</span>
          <nav className={styles.nav}>
            <Link
              to="/staff/dashboard"
              className={location.pathname === '/staff/dashboard' ? styles.navActive : ''}
            >
              Dashboard
            </Link>
            <Link
              to="/staff/orders"
              className={location.pathname.startsWith('/staff/orders') ? styles.navActive : ''}
            >
              Orders
            </Link>
            <Link
              to="/staff/sales"
              className={location.pathname === '/staff/sales' ? styles.navActive : ''}
            >
              Sales
            </Link>
            <Link
              to="/staff/production"
              className={location.pathname === '/staff/production' ? styles.navActive : ''}
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
          <Outlet />
        </div>
      </main>
    </div>
  )
}
