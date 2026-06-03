import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.vorton.app'
const APP_STORE = 'https://apps.apple.com/app/id123456789'
const WEB_FALLBACK = 'https://vorton.az'

export default async function AppRedirectPage() {
  const userAgent = (await headers()).get('user-agent') ?? ''

  if (/android/i.test(userAgent)) {
    redirect(PLAY_STORE)
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    redirect(APP_STORE)
  }

  redirect(WEB_FALLBACK)
}
