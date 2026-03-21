import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../api/auth'

/**
 * Protects /staff/* routes (except /staff/login). Only allows employee or manager.
 * Redirects to /staff/login with returnTo if not authenticated or not staff role.
 */
export default function StaffProtectedRoute() {
  const { user, token, loading } = useAuth()
  const location = useLocation()
  const role = (user?.role as UserRole) ?? 'customer'
  const isStaff = role === 'employee' || role === 'manager'

  if (loading) return null
  if (!token || !isStaff) {
    const returnTo = location.pathname + location.search
    return (
      <Navigate
        to={returnTo ? `/staff/login?returnTo=${encodeURIComponent(returnTo)}` : '/staff/login'}
        replace
      />
    )
  }
  return <Outlet />
}
