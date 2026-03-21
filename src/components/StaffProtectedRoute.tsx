'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../api/auth'

/**
 * Protects /staff/* routes (except /staff/login). Only allows employee or manager.
 * Redirects to /staff/login with returnTo if not authenticated or not staff role.
 */
export default function StaffProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const role = (user?.role as UserRole) ?? 'customer'
  const isStaff = role === 'employee' || role === 'manager'

  useEffect(() => {
    if (!loading && (!token || !isStaff)) {
      const returnTo = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '')
      router.replace(returnTo ? `/staff/login?returnTo=${encodeURIComponent(returnTo)}` : '/staff/login')
    }
  }, [loading, token, isStaff, pathname, searchParams, router])

  if (loading) return null
  if (!token || !isStaff) return null
  return <>{children}</>
}
