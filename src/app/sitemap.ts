import type { MetadataRoute } from 'next'
import { fetchProducts } from '@/api/products'
import { getSiteUrl } from '@/lib/siteUrl'

/** Static routes that should always appear in the sitemap (same paths as main nav). */
const STATIC_PATHS = [
  '/',
  '/shop',
  '/about',
  '/contact',
  '/signin',
  '/signup',
  '/reward-points',
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === '/' ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'weekly',
    priority: path === '/' ? 1 : 0.8,
  }))

  let productEntries: MetadataRoute.Sitemap = []
  try {
    const products = await fetchProducts()
    productEntries = products.map((p) => ({
      url: `${base}/shop/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    /* API unavailable at build time — static routes still valid */
  }

  return [...staticEntries, ...productEntries]
}
