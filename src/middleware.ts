import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LOCALE_COOKIE_NAME } from '@/lib/localeStorage'

const LOCALE_COOKIE = LOCALE_COOKIE_NAME
const GEO_COUNTRY_COOKIE = 'vorton-geo-country'

function getGeoCountry(request: NextRequest): string | null {
  return (
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    null
  )
}

function getLocaleFromGeo(request: NextRequest): 'az' | 'en' {
  const country = getGeoCountry(request)
  return country === 'AZ' ? 'az' : 'en'
}

function getLocale(request: NextRequest): 'az' | 'en' {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (fromCookie === 'az' || fromCookie === 'en') return fromCookie
  return getLocaleFromGeo(request)
}

export function middleware(request: NextRequest) {
  const country = getGeoCountry(request)
  const geoCountry = country ? country.toUpperCase().slice(0, 2) : null
  const locale = getLocale(request)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-next-locale', locale)
  if (geoCountry) requestHeaders.set('x-next-geo-country', geoCountry)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 })
  if (geoCountry) {
    response.cookies.set(GEO_COUNTRY_COOKIE, geoCountry, { path: '/', maxAge: 60 * 60 * 24 })
  }
  return response
}
