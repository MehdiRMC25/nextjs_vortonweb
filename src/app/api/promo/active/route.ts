import { NextResponse } from 'next/server'
import { promoActiveApiSchema } from '@/lib/promoCampaign'

const inactive = { active: false as const }

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
    const parsed = promoActiveApiSchema.safeParse(json)
    if (!parsed.success || !parsed.data.active) return NextResponse.json(inactive)
    return NextResponse.json(parsed.data)
  } catch {
    return NextResponse.json(inactive)
  }
}