import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALE_COOKIE = 'NEXT_LOCALE'

function getLocaleFromGeo(request: NextRequest): 'az' | 'en' {
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    null
  return country === 'AZ' ? 'az' : 'en'
}

export function middleware(request: NextRequest) {
  const locale = getLocaleFromGeo(request)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-next-locale', locale)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 })
  return response
}
