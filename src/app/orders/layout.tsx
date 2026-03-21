'use client'

import { Suspense } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function OrdersLayout({
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
