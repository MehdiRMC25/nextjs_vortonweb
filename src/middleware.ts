import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LOCALE_COOKIE_NAME, LOCALE_COOKIE_MAX_AGE_SEC } from '@/lib/localeStorage'
import { localeFromHost } from '@/lib/domainConfig'

const LOCALE_COOKIE = LOCALE_COOKIE_NAME
const GEO_COUNTRY_COOKIE = 'vorton-geo-country'

function getGeoCountry(request: NextRequest): string | null {
  return (
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    null
  )
}

function hostHeader(request: NextRequest): string {
  return request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || request.headers.get('host') || ''
}

export function middleware(request: NextRequest) {
  const country = getGeoCountry(request)
  const geoCountry = country ? country.toUpperCase().slice(0, 2) : null
  const locale = localeFromHost(hostHeader(request))

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-next-locale', locale)
  requestHeaders.set('x-next-pathname', request.nextUrl.pathname)
  requestHeaders.set('x-next-search', request.nextUrl.search)
  if (geoCountry) requestHeaders.set('x-next-geo-country', geoCountry)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE_SEC,
    sameSite: 'lax',
  })
  if (geoCountry) {
    response.cookies.set(GEO_COUNTRY_COOKIE, geoCountry, { path: '/', maxAge: 60 * 60 * 24 })
  }
  return response
}
