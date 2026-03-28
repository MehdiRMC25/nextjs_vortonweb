/**
 * Canonical site origin for metadata, sitemap, robots, and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://vorton.uk).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://vorton.uk'
  return raw.replace(/\/$/, '')
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl().endsWith('/') ? getSiteUrl() : `${getSiteUrl()}/`)
}
