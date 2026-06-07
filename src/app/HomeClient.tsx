"use client";

import type { ReactNode } from 'react'
import { useState, useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useProducts } from '@/context/ProductsContext'
import type { HomeNewsItem, Product } from '@/types'
import { useLocale } from '@/context/LocaleContext'
import { fetchHomeNews, fetchHomeVideos, youtubeEmbedUrl } from '@/api/homeContent'
import ProductCard from '@/components/ProductCard'
import { CircularProgress } from '@/components/CircularProgress'
import WhatsAppButton from '@/components/WhatsAppButton'
import styles from './Home.module.css'

import dynamic from 'next/dynamic'

const PromoCampaignRoot = dynamic(() => import('@/components/promo/PromoCampaignRoot'), { ssr: false })


/* Add or remove image URLs – slider adapts automatically */
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=800&fit=crop',
]

function pickHomeShopPreview(products: Product[], failedImageIds: Set<string>): Product[] {
  const pool = products.filter((p) => !failedImageIds.has(p.id))
  const men = pool.filter((p) => p.category === 'men')
  const women = pool.filter((p) => p.category === 'women')
  const picked: Product[] = []
  let mi = 0
  let wi = 0
  for (let i = 0; i < 8; i++) {
    const wantMen = i % 2 === 0
    if (wantMen && mi < men.length) picked.push(men[mi++])
    else if (!wantMen && wi < women.length) picked.push(women[wi++])
    else if (mi < men.length) picked.push(men[mi++])
    else if (wi < women.length) picked.push(women[wi++])
  }
  return picked
}

export default function HomeClient({ intro }: { intro: ReactNode }) {
  const { t, locale } = useLocale()
  const { products, loading, error, retry } = useProducts()
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set())
  const [heroIndex, setHeroIndex] = useState(0)
  const [homeVideoUrls, setHomeVideoUrls] = useState<string[]>([])
  const [homeNewsItems, setHomeNewsItems] = useState<HomeNewsItem[]>([])

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchHomeVideos(), fetchHomeNews()]).then(([videosRes, newsRes]) => {
      if (cancelled) return
      if (videosRes.videoUrls.length > 0) setHomeVideoUrls(videosRes.videoUrls)
      if (newsRes.items.length > 0) setHomeNewsItems(newsRes.items)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const onImageError = useCallback((productId: string) => {
    setFailedImageIds((prev) => new Set(prev).add(productId))
  }, [])

  const newCollectionProducts = products.filter((p) => p.isNew && !failedImageIds.has(p.id))
  const onSaleProducts = products.filter((p) => p.onSale && !failedImageIds.has(p.id))

  const shopPreviewProducts = useMemo(
      () => pickHomeShopPreview(products, failedImageIds),
      [products, failedImageIds]
  )

  return (
      <>
        <section className={styles.hero} aria-label="Hero gallery">
          <div className={styles.heroSlides}>
            {HERO_IMAGES.map((src, i) => (
              <div
                key={src}
                className={`${styles.heroSlide} ${i === heroIndex ? styles.heroSlideActive : ''}`}
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
          <div className={styles.heroOverlay} />
        </section>

        {intro}

        {error && (
            <div className={`container ${styles.errorBlock}`}>
              <p className={styles.errorMessage}>{error}</p>
              <button type="button" className={styles.retryBtn} onClick={retry}>
                {t('retryOrReload')}
              </button>
            </div>
        )}

        {loading ? (
          <section className={styles.section}>
            <div className="container">
              <CircularProgress loading={true} />
            </div>
          </section>
        ) : (
          <>
            <section className={`${styles.section} ${styles.productSection}`}>
              <div className="container">
                <h2 className="section-title">{t('newCollection')}</h2>
                {newCollectionProducts.length > 0 ? (
                    <div className={styles.productGrid}>
                      {newCollectionProducts.map((p, index) => (
                          <ProductCard
                              key={p.id}
                              product={p}
                              onImageError={onImageError}
                              imageLoading={index < 4 ? 'eager' : 'lazy'}
                              imageFetchPriority={index < 4 ? (index === 0 ? 'high' : 'auto') : undefined}
                          />
                      ))}
                    </div>
                ) : (
                    <p className={styles.empty}>{t('noProductsYet')}</p>
                )}
              </div>
            </section>

            <section className={`${styles.section} ${styles.productSection}`}>
              <div className="container">
                <h2 className="section-title">{t('onSale')}</h2>
                {onSaleProducts.length > 0 ? (
                    <div className={styles.productGrid}>
                      {onSaleProducts.map((p, index) => (
                          <ProductCard
                              key={p.id}
                              product={p}
                              onImageError={onImageError}
                              imageLoading={index < 4 ? 'eager' : 'lazy'}
                              imageFetchPriority={index < 4 ? (index === 0 ? 'high' : 'auto') : undefined}
                          />
                      ))}
                    </div>
                ) : (
                    <p className={styles.empty}>{t('noItemsOnSale')}</p>
                )}
              </div>
            </section>
          </>
        )}

        <section className={styles.vortonLine} aria-hidden data-nosnippet>
          <div className={styles.vortonLineTrack}>
            <div className={styles.vortonLineInner}>
              <span>Vorton</span>
              <span className={styles.sep}>—</span>
              <span>Vorton</span>
              <span className={styles.sep}>—</span>
              <span>Vorton</span>
              <span className={styles.sep}>—</span>
              <span>Vorton</span>
              <span className={styles.sep}>—</span>
              <span>Vorton</span>
            </div>
            <div className={styles.vortonLineInner} aria-hidden>
              <span>Vorton</span>
              <span className={styles.sep}>—</span>
              <span>Vorton</span>
              <span className={styles.sep}>—</span>
              <span>Vorton</span>
              <span className={styles.sep}>—</span>
              <span>Vorton</span>
              <span className={styles.sep}>—</span>
              <span>Vorton</span>
            </div>
          </div>
        </section>

        {!loading && shopPreviewProducts.length > 0 && (
            <section className={`${styles.section} ${styles.productSection}`}>
              <div className="container">
                <h2 className="section-title">{t('shopPreviewTitle')}</h2>
                <div className={styles.productGrid}>
                  {shopPreviewProducts.map((p, index) => (
                      <ProductCard
                          key={p.id}
                          product={p}
                          onImageError={onImageError}
                          imageLoading={index < 4 ? 'eager' : 'lazy'}
                      />
                  ))}
                </div>
                <div className={styles.shopPreviewCta}>
                  <Link href="/shop" className={`btn btn-primary ${styles.visitShopBtn}`}>
                    {t('visitShop')}
                  </Link>
                </div>
              </div>
            </section>
        )}

        <section className={styles.section}>
          <div className="container">
            <h2 className="section-title">{t('media')}</h2>
            <div className={styles.videoGrid}>
              {homeVideoUrls.map((url, index) => {
                const embedSrc = youtubeEmbedUrl(url)
                if (!embedSrc) return null
                return (
                    <div key={`${embedSrc}-${index}`} className={styles.videoCard}>
                      <iframe
                          className={styles.videoIframe}
                          src={embedSrc}
                          title={`${t('media')} ${index + 1}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                      />
                    </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2 className="section-title">{t('articles')}</h2>
            <div className={styles.articleGrid}>
              {homeNewsItems.map((item) => {
                const title = locale === 'az' ? (item.titleAz || item.title) : item.title
                const href = item.link || '#'
                const external = href.startsWith('http://') || href.startsWith('https://')
                return (
                    <a
                        href={href}
                        key={item.id}
                        className={styles.articleCard}
                        target={external ? '_blank' : undefined}
                        rel={external ? 'noopener noreferrer' : undefined}
                    >
                      <div className={styles.articleImage}>
                        <img
                            src={item.imageUrl}
                            alt={title}
                            className={styles.articleImageFill}
                            loading="lazy"
                            decoding="async"
                        />
                      </div>
                      <div className={styles.articleBody}>
                        <h3 className={styles.articleTitle}>{title}</h3>
                      </div>
                    </a>
                )
              })}
            </div>
          </div>
        </section>
        <WhatsAppButton pageTag="home" />
        <PromoCampaignRoot />
      </>
  )
}
