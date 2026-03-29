import { alternateHreflangUrls, getRawRequestHost } from '@/lib/domainConfig'

/**
 * Fallback when no request is available (build, scripts). Prefer getRequestOrigin(headers) in Route Handlers / SSR.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://vorton.uk'
  return raw.replace(/\/$/, '')
}

export function getMetadataBase(): URL {
  const base = getSiteUrl()
  return new URL(base.endsWith('/') ? base : `${base}/`)
}

function getProto(headers: Headers): string {
  const raw = headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (raw === 'http' || raw === 'https') return raw
  return process.env.NODE_ENV === 'production' ? 'https' : 'http'
}

/**
 * Full origin for the current request (e.g. https://vorton.az or http://localhost:3000).
 */
export function getRequestOrigin(headers: Headers): string {
  const host = getRawRequestHost(headers)
  return `${getProto(headers)}://${host}`
}

/** Canonical path + alternates hreflang for the active URL (uses forwarded pathname/search from middleware). */
export function getCanonicalAndAlternates(
  headers: Headers,
  overrides?: { pathname?: string; search?: string }
): { origin: string; canonical: string; alternates: { az: string; en: string } } {
  const origin = getRequestOrigin(headers)
  const pathname = overrides?.pathname ?? headers.get('x-next-pathname') ?? '/'
  let search = overrides?.search ?? headers.get('x-next-search') ?? ''
  if (search && !search.startsWith('?')) search = `?${search}`
  const pathSeg = pathname.startsWith('/') ? pathname : `/${pathname}`
  const canonical = `${origin}${pathSeg}${search === '?' ? '' : search}`
  const { az, en } = alternateHreflangUrls(pathname, search)
  return { origin, canonical, alternates: { az, en } }
}
