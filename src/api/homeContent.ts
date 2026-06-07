import { config } from '../config'
import type { HomeNewsItem } from '../types'

export function youtubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)
  if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}?rel=0`
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0`
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0`
  return null
}

function normalizeNewsItem(raw: Record<string, unknown>, index: number): HomeNewsItem | null {
  const id = String(raw.id ?? index).trim()
  const title = String(raw.title ?? '').trim()
  const titleAz = String(raw.titleAz ?? '').trim()
  const imageUrl = String(raw.imageUrl ?? raw.image ?? '').trim()
  const link = String(raw.link ?? raw.url ?? '').trim()
  if (!title && !titleAz) return null
  return {
    id,
    title,
    titleAz: titleAz || undefined,
    imageUrl,
    link,
  }
}

export async function fetchHomeVideos(): Promise<{ ok: boolean; videoUrls: string[] }> {
  try {
    const base = config.apiUrl.replace(/\/$/, '')
    const res = await fetch(`${base}/api/home-videos`)
    const data = await res.json().catch(() => ({}))
    const videoUrls = Array.isArray(data?.videoUrls)
        ? data.videoUrls.filter((u: unknown): u is string => typeof u === 'string' && !!u.trim())
        : []
    return { ok: res.ok, videoUrls }
  } catch {
    return { ok: false, videoUrls: [] }
  }
}

export async function fetchHomeNews(): Promise<{ ok: boolean; items: HomeNewsItem[] }> {
  try {
    const base = config.apiUrl.replace(/\/$/, '')
    const res = await fetch(`${base}/api/home-news`)
    const data = await res.json().catch(() => ({}))
    const rawItems = Array.isArray(data?.items) ? data.items : []
    const items = rawItems
        .map((x, i) =>
            x && typeof x === 'object' ? normalizeNewsItem(x as Record<string, unknown>, i) : null
        )
        .filter((x): x is HomeNewsItem => !!x)
    return { ok: res.ok, items }
  } catch {
    return { ok: false, items: [] }
  }
}