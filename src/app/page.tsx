"use client";

import { useState, useCallback, useRef, useEffect, type RefObject } from 'react'
import { useProducts } from '@/context/ProductsContext'
import { useLocale } from '@/context/LocaleContext'
import { articles } from '@/data'
import ProductCard from '@/components/ProductCard'
import { CircularProgress } from '@/components/CircularProgress'
import WhatsAppButton from '@/components/WhatsAppButton'
import styles from './Home.module.css'

/* Add or remove image URLs – slider adapts automatically */
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=800&fit=crop',
]

export default function Home() {
  const { t } = useLocale()
  const { products, loading, error, retry } = useProducts()
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set())
  const [heroIndex, setHeroIndex] = useState(0)
  const newCollectionRef = useRef<HTMLDivElement | null>(null)
  const onSaleRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const onImageError = useCallback((productId: string) => {
    setFailedImageIds((prev) => new Set(prev).add(productId))
  }, [])

  const scrollProducts = useCallback((rowRef: RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (!rowRef.current) return
    const amount = Math.max(260, Math.round(rowRef.current.clientWidth * 0.8))
    rowRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }, [])

  const newCollectionProducts = products.filter((p) => p.isNew && !failedImageIds.has(p.id))
  const onSaleProducts = products.filter((p) => p.onSale && !failedImageIds.has(p.id))

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
        <section className={styles.section}>
          <div className="container">
            <h2 className="section-title">{t('newCollection')}</h2>
            {newCollectionProducts.length > 0 ? (
                <div className={styles.carouselWrap}>
                  <button
                      type="button"
                      className={styles.scrollArrowLeft}
                      aria-label="Scroll new collection left"
                      onClick={() => scrollProducts(newCollectionRef, 'left')}
                  >
                    ←
                  </button>
                  <div className={styles.productRow} ref={newCollectionRef}>
                    {newCollectionProducts.map((p) => (
                        <ProductCard key={p.id} product={p} onImageError={onImageError} />
                    ))}
                  </div>
                  <button
                      type="button"
                      className={styles.scrollArrowRight}
                      aria-label="Scroll new collection right"
                      onClick={() => scrollProducts(newCollectionRef, 'right')}
                  >
                    →
                  </button>
                </div>
            ) : (
                <p className={styles.empty}>{t('noProductsYet')}</p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2 className="section-title">{t('onSale')}</h2>
            {onSaleProducts.length > 0 ? (
                <div className={styles.carouselWrap}>
                  <button
                      type="button"
                      className={styles.scrollArrowLeft}
                      aria-label="Scroll on sale left"
                      onClick={() => scrollProducts(onSaleRef, 'left')}
                  >
                    ←
                  </button>
                  <div className={styles.productRow} ref={onSaleRef}>
                    {onSaleProducts.map((p) => (
                        <ProductCard key={p.id} product={p} onImageError={onImageError} />
                    ))}
                  </div>
                  <button
                      type="button"
                      className={styles.scrollArrowRight}
                      aria-label="Scroll on sale right"
                      onClick={() => scrollProducts(onSaleRef, 'right')}
                  >
                    →
                  </button>
                </div>
            ) : (
                <p className={styles.empty}>{t('noItemsOnSale')}</p>
            )}
          </div>
        </section>
          </>
        )}

        <section className={styles.vortonLine} aria-hidden>
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

        <section className={styles.section}>
          <div className="container">
            <h2 className="section-title">{t('media')}</h2>
            <div className={styles.videoGrid}>
              <div className={styles.videoCard}>
                <iframe
                    className={styles.videoIframe}
                    src="https://www.youtube.com/embed/Gw4LlCsJozM?rel=0"
                    title="The Future of Fashion: How Bio-Based Fibers Are Changing Everything"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
              </div>
              <div className={styles.videoCard}>
                <iframe
                    className={styles.videoIframe}
                    src="https://www.youtube.com/embed/1CZElaBmnmM?rel=0"
                    title="Suzanne Lee: Designing With Biology – Biofabrication and Sustainable Materials"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2 className="section-title">{t('articles')}</h2>
            <div className={styles.articleGrid}>
              {articles.map((a) => (
                  <a href={a.url || '#'} target={a.url ? '_blank' : undefined} rel={a.url ? 'noopener noreferrer' : undefined} key={a.id} className={styles.articleCard}>
                    <div className={styles.articleImage}>
                      <img src={a.image} alt={a.title} />
                    </div>
                    <div className={styles.articleBody}>
                      <h3 className={styles.articleTitle}>{a.title}</h3>
                      <p className={styles.articleExcerpt}>{a.excerpt}</p>
                      <span className={styles.articleDate}>{a.date}</span>
                    </div>
                  </a>
              ))}
            </div>
          </div>
        </section>
        <WhatsAppButton pageTag="home" />
      </>
  )
}
