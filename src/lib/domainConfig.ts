/**
 * Production hostnames — locale is derived strictly from host (not cookie / geo).
 */
export const VORTON_HOST_AZ = 'vorton.az'
export const VORTON_HOST_UK = 'vorton.uk'

const HTTPS_ORIGIN_AZ = `https://${VORTON_HOST_AZ}`
const HTTPS_ORIGIN_UK = `https://${VORTON_HOST_UK}`

/** Strip port for comparing against registrable hosts (vorton.az / vorton.uk). */
export function stripPort(host: string): string {
  return host.replace(/:\d+$/, '')
}

/** Lowercase host without leading www., port stripped for identity checks. */
export function normalizeRegistrableHost(host: string | null | undefined): string {
  if (!host) return ''
  const first = stripPort(host.split(',')[0].trim().toLowerCase())
  return first.startsWith('www.') ? first.slice(4) : first
}

/**
 * Request host for URLs (preserves port), e.g. localhost:3000 for dev.
 */
export function getRawRequestHost(headers: Headers): string {
  const xf = headers.get('x-forwarded-host')
  const raw = (xf?.split(',')[0] ?? headers.get('host') ?? '').trim()
  return raw || 'localhost'
}

/**
 * Locale from host: .az → Azerbaijani, .uk → English.
 * Other hosts: VORTON_PREVIEW_LOCALE (az|en) on *.vercel.app, else English (dev / unknown).
 */
export function localeFromHost(hostHeader: string | null | undefined): 'az' | 'en' {
  const h = normalizeRegistrableHost(hostHeader)
  if (h === VORTON_HOST_AZ) return 'az'
  if (h === VORTON_HOST_UK) return 'en'
  const preview = process.env.VORTON_PREVIEW_LOCALE
  if (h.endsWith('.vercel.app') && (preview === 'az' || preview === 'en')) {
    return preview
  }
  return 'en'
}

/** Persisted signup attribution — only production hosts. */
export function signupHostFromRequestHost(hostHeader: string | null | undefined): 'vorton.az' | 'vorton.uk' | undefined {
  const h = normalizeRegistrableHost(hostHeader)
  if (h === VORTON_HOST_AZ) return 'vorton.az'
  if (h === VORTON_HOST_UK) return 'vorton.uk'
  return undefined
}

/** Call from the browser when submitting signup (current window host). */
export function signupHostFromBrowser(): 'vorton.az' | 'vorton.uk' | undefined {
  if (typeof window === 'undefined') return undefined
  return signupHostFromRequestHost(window.location.host)
}

export function buildLocaleSwitchUrl(targetLocale: 'az' | 'en', pathname: string, search: string): string {
  const origin = targetLocale === 'az' ? HTTPS_ORIGIN_AZ : HTTPS_ORIGIN_UK
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  const q = search.startsWith('?') ? search : search ? `?${search}` : ''
  return `${origin}${path}${q}`
}

export function alternateHreflangUrls(pathname: string, search: string): { az: string; en: string } {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  const q = search.startsWith('?') ? search : search ? `?${search}` : ''
  return {
    az: `${HTTPS_ORIGIN_AZ}${path}${q}`,
    en: `${HTTPS_ORIGIN_UK}${path}${q}`,
  }
}
