'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const returnTo = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '')
      router.replace(returnTo ? `/signin?returnTo=${encodeURIComponent(returnTo)}` : '/signin')
    }
  }, [loading, isAuthenticated, pathname, searchParams, router])

  if (loading) return null
  if (!isAuthenticated) return null
  return <>{children}</>
}
