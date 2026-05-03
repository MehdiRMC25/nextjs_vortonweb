'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  parsePromoCampaignPayload,
  isCampaignDismissed,
  setCampaignDismissed,
  parseEndsAt,
  type PromoCampaignPayload,
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<PromoCampaignPayload | null>(null)
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const reducedMotion = usePrefersReducedMotion()

  const endsAtDate = useMemo(() => parseEndsAt(campaign?.endsAt), [campaign?.endsAt])
  const expired = endsAtDate !== null && now > endsAtDate.getTime()

  useEffect(() => {
    if (!endsAtDate || expired) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [endsAtDate, expired])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/promo/active', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const json: unknown = await res.json()
        const parsed = parsePromoCampaignPayload(json)
        if (cancelled) return
        if (!parsed || !parsed.active) {
          setCampaign(null)
          return
        }
        if (isCampaignDismissed(parsed.campaignId)) {
          setCampaign(null)
          return
        }
        const end = parseEndsAt(parsed.endsAt)
        if (end && Date.now() > end.getTime()) {
          setCampaign(null)
          return
        }
        setCampaign(parsed)
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
    if (campaign) setCampaignDismissed(campaign.campaignId)
    setOpen(false)
    setCampaign(null)
  }, [campaign])

  if (loading || error || !campaign || !open || expired) return null

  const msLeft = endsAtDate ? Math.max(0, endsAtDate.getTime() - now) : null
  const secLeft = msLeft === null ? null : Math.floor(msLeft / 1000)
  const mm = secLeft === null ? null : Math.floor(secLeft / 60)
  const ss = secLeft === null ? null : secLeft % 60

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
              {campaign.title}
            </Dialog.Title>
            <Dialog.Description
                id="promo-dialog-desc"
                className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]"
            >
              {campaign.message}
            </Dialog.Description>
            {campaign.promoCode ? (
                <p className="mt-4 rounded-lg border border-dashed border-[var(--accent)]/50 bg-white/80 px-3 py-2 text-center font-mono text-sm font-semibold tracking-wide text-[var(--text-primary)]">
                  {campaign.promoCode}
                </p>
            ) : null}
            {secLeft !== null ? (
                <p className="mt-3 text-center text-sm text-[var(--text-muted)]" aria-live="polite">
                  {mm !== null && ss !== null ? `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} left` : ''}
                </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {campaign.ctaLabel && campaign.ctaHref ? (
                  <a
                      href={campaign.ctaHref}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] sm:flex-none"
                  >
                    {campaign.ctaLabel}
                  </a>
              ) : null}
              <Dialog.Close asChild>
                <button
                    type="button"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-black/[0.03] sm:flex-none"
                    onClick={handleDismiss}
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
  )
}