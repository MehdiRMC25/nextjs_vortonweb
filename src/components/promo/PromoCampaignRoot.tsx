'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { useLocale } from '@/context/LocaleContext'
import {
  parsePromoActiveResponse,
  isCampaignDismissed,
  setCampaignDismissed,
  HOME_PROMO_DISMISS_ID,
} from '@/lib/promoCampaign'

function usePrefersReducedMotion(): boolean {
  const [v, setV] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setV(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return v
}

export default function PromoCampaignRoot() {
  const { t } = useLocale()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [show, setShow] = useState(false)
  const [open, setOpen] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/promo/active', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const json: unknown = await res.json()
        const parsed = parsePromoActiveResponse(json)
        if (cancelled) return
        if (!parsed?.active) return
        if (isCampaignDismissed(HOME_PROMO_DISMISS_ID)) return
        setShow(true)
        setOpen(true)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'fetch')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleDismiss = useCallback(() => {
    setCampaignDismissed(HOME_PROMO_DISMISS_ID)
    setOpen(false)
    setShow(false)
  }, [])

  if (loading || error || !show || !open) return null

  const motionClass = reducedMotion
      ? ''
      : 'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200'

  return (
      <Dialog.Root
          open={open}
          onOpenChange={(next) => {
            if (!next) handleDismiss()
          }}
      >
        <Dialog.Portal>
          <Dialog.Overlay
              className={`fixed inset-0 z-[200] bg-black/45 backdrop-blur-[2px] ${motionClass}`}
          />
          <Dialog.Content
              className={`fixed left-1/2 top-1/2 z-[201] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/10 bg-[var(--bg-primary)] p-6 shadow-2xl outline-none ${motionClass}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="promo-dialog-title"
              aria-describedby="promo-dialog-desc"
              onPointerDownOutside={handleDismiss}
          >
            <Dialog.Title
                id="promo-dialog-title"
                className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
            >
              {t('homePromoTitle')}
            </Dialog.Title>
            <Dialog.Description
                id="promo-dialog-desc"
                className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]"
            >
              {t('homePromoMessage')}
            </Dialog.Description>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                  href="/shop"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] sm:flex-none"
                  onClick={handleDismiss}
              >
                {t('homePromoCtaShop')}
              </Link>
              <Dialog.Close asChild>
                <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-black/[0.03] sm:flex-none"
                    onClick={handleDismiss}
                >
                  {t('homePromoClose')}
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
  )
}