import HomeClient from './HomeClient'
import styles from './Home.module.css'
import { headers } from 'next/headers'

/**
 * Server-rendered intro (h1 + paragraph) is passed into the client shell so it
 * sits right under the hero in the DOM (good for crawlers and layout).
 */
export default async function HomePage() {
  const h = await headers()
  const locale = h.get('x-next-locale') === 'az' ? 'az' : 'en'
  const introTitle =
    locale === 'az' ? 'Üslubun Rahatlıqla Qovuşduğu Yer' : 'Where Style Meets Comfort'
  const introText =
    locale === 'az'
      ? 'Kişilər və qadınlar üçün premium gündəlik geyimlər. Yeni kolleksiyaları, seçilmiş modelləri kəşf edin və rahatlıqla qapınıza çatdırılan dəbli geyimlərdən yararlanın.'
      : 'Premium everyday wear for men and women. Explore new arrivals, curated collections, and effortless fashion delivered to your door.'

  return (
    <HomeClient
      intro={
        <section className={styles.seoIntro} aria-labelledby="home-heading">
          <div className="container">
            <h1 id="home-heading" className={styles.seoIntroTitle}>
              {introTitle}
            </h1>
            <p className={styles.seoIntroText}>
              {introText}
            </p>
          </div>
        </section>
      }
    />
  )
}
