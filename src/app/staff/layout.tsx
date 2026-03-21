'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import StaffLayout from '@/components/StaffLayout'
import StaffProtectedRoute from '@/components/StaffProtectedRoute'

function StaffContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/staff/login'

  if (isLoginPage) {
    return <>{children}</>
  }
  return (
    <StaffProtectedRoute>
      <StaffLayout>{children}</StaffLayout>
    </StaffProtectedRoute>
  )
}

export default function StaffLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={null}>
      <StaffContent>{children}</StaffContent>
    </Suspense>
  )
}
