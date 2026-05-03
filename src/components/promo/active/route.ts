import { NextResponse } from 'next/server'

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
      next: { revalidate: 60 },
    })
    if (!res.ok) return NextResponse.json(inactive)
    const json: unknown = await res.json()
    return NextResponse.json(json)
  } catch {
    return NextResponse.json(inactive)
  }
}