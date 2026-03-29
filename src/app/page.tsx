import HomeClient from './HomeClient'
import styles from './Home.module.css'

/**
 * Server-rendered intro (h1 + paragraph) is passed into the client shell so it
 * sits right under the hero in the DOM (good for crawlers and layout).
 */
export default function HomePage() {
  return (
    <HomeClient
      intro={
        <section className={styles.seoIntro} aria-labelledby="home-heading">
          <div className="container">
            <h1 id="home-heading" className={styles.seoIntroTitle}>
              Vorton Fashion — Discover Your Style
            </h1>
            <p className={styles.seoIntroText}>
              Contemporary fashion and everyday clothing for men and women. Shop new arrivals, seasonal edits, and sale items with secure checkout and delivery in Azerbaijan.
            </p>
          </div>
        </section>
      }
    />
  )
}
