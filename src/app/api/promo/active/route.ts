import { NextResponse } from 'next/server'

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
    const active =
        json &&
        typeof json === 'object' &&
        (json as { active?: boolean }).active === true
    return NextResponse.json(active ? { active: true } : inactive)
  } catch {
    return NextResponse.json(inactive)
  }
}