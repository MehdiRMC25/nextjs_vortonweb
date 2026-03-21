'use client'

import { Suspense } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={null}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </Suspense>
  )
}
