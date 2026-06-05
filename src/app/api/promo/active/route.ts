import { NextResponse } from 'next/server'
import { isPromoValidViaCheckoutPreview, promoCodeFromCampaignPayload } from '@/lib/promoValidate'

const inactive = {
  active: false,
  campaignId: 'none',
  title: '',
  message: '',
}

export async function GET() {
  const base = process.env.PROMO_CAMPAIGN_API_URL?.replace(/\/$/, '')
  if (!base) {
    return NextResponse.json(inactive)
  }
  try {
    const res = await fetch(`${base}/active`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json(inactive)
    const json: unknown = await res.json()

    if (json && typeof json === 'object' && (json as { active?: boolean }).active === true) {
      const code = promoCodeFromCampaignPayload(json)
      if (code) {
        const valid = await isPromoValidViaCheckoutPreview(code)
        if (!valid) return NextResponse.json(inactive)
      }
    }

    return NextResponse.json(json)
  } catch {
    return NextResponse.json(inactive)
  }
}