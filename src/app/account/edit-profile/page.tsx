'use client'

import { Suspense } from 'react'
import { EditProfileClient } from './EditProfileClient'

export default function EditProfilePage() {
    return (
        <Suspense
            fallback={
                <div className="container">
                    <p style={{ padding: '24px 0' }}>Loading…</p>
                </div>
            }
        >
            <EditProfileClient />
        </Suspense>
    )
}
