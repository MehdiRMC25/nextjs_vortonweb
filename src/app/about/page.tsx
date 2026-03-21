'use client'

import { useLocale } from '@/context/LocaleContext'
import styles from './About.module.css'

export default function About() {
    const { t } = useLocale()
    return (
        <div className={`container ${styles.aboutContainer}`}>
            <div className={styles.wrap}>
                <h1 className={styles.title}>{t('aboutVorton')}</h1>
                <div className={styles.content}>
                    <p className={styles.lead}>{t('aboutIntro1')}</p>
                    <p>{t('aboutIntro2')}</p>
                    <h2 className={styles.sectionTitle}>{t('aboutOurInspiration')}</h2>
                    <p>{t('aboutOurInspirationText')}</p>
                    <h2 className={styles.sectionTitle}>{t('aboutDesignedForRealLife')}</h2>
                    <p>{t('aboutDesignedForRealLifeText')}</p>
                    <h2 className={styles.sectionTitle}>{t('aboutTeamMindset')}</h2>
                    <p>{t('aboutTeamMindsetText')}</p>
                    <p>{t('aboutGlobal')}</p>
                    <p className={styles.tagline}>{t('aboutTagline')}</p>
                    <div className={styles.contact}>
                        <h2>{t('getInTouch')}</h2>
                        <p>{t('questionsFeedback')}</p>
                        <p className={styles.email}>info@vorton.uk</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
