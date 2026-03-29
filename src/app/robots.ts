import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { getRequestOrigin } from '@/lib/siteUrl'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const base = getRequestOrigin(h).replace(/\/$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/staff/', '/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
