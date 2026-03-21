'use client'

import { useLocale } from '@/context/LocaleContext'
import styles from './Contact.module.css'

// Caspian Plaza, Jafar Jabbarli 44, Baku
const MAP_EMBED =
    'https://www.openstreetmap.org/export/embed.html?bbox=49.848%2C40.372%2C49.860%2C40.382&layer=mapnik&marker=40.377%2C49.854'

const CONTACT = {
    location: 'AZERBAIJAN',
    address: 'Jafar Jabbarli St, 44, Caspian Plaza, 3rd block, 506',
    phones: ['+994 10 234 33 19', '+994 12 311 39 39'],
    email: 'info@vorton.uk',
    instagram: 'https://instagram.com/vortonnn',
    instagramHandle: 'vortonnn',
}

export default function Contact() {
    const { t, locale } = useLocale()
    const isAzerbaijan = locale === 'az'

    return (
        <div className="container">
            <div className={styles.wrap}>
                <h1 className={styles.title}>{t('contactTitle')}</h1>

                {/*{!isAzerbaijan && (*/}
                {/*  <p className={styles.globalIntro}>{t('contactIntro')}</p>*/}
                {/*)}*/}

                <section className={styles.mapSection}>
                    <div className={styles.mapWrap}>
                        <iframe
                            title="Vorton location map"
                            src={MAP_EMBED}
                            className={styles.map}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                        <a
                            href="https://www.openstreetmap.org/?mlat=40.377&mlon=49.854#map=17/40.377/49.854"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.mapLink}
                        >
                            {t('viewLargerMap')}
                        </a>
                    </div>
                </section>

                <section className={styles.details}>
                    <p className={styles.locationLine}>
                        <span className={styles.label}>{t('locationLabel')}: </span>
                        <strong className={styles.locationValue}>{CONTACT.location}</strong>
                    </p>
                    {isAzerbaijan && (
                        <p className={styles.nearestOffice}>{t('yourNearestOffice')}</p>
                    )}

                    <div className={styles.block}>
                        <h2 className={styles.blockTitle}>{t('address')}</h2>
                        <p className={styles.blockValue}>{CONTACT.address}</p>
                    </div>

                    <div className={styles.block}>
                        <h2 className={styles.blockTitle}>{t('phone')}</h2>
                        <ul className={styles.phoneList}>
                            {CONTACT.phones.map((phone) => (
                                <li key={phone}>
                                    <a href={`tel:${phone.replace(/\s/g, '')}`} className={styles.phoneLink}>
                                        {phone}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={styles.block}>
                        <h2 className={styles.blockTitle}>{t('email')}</h2>
                        <a href={`mailto:${CONTACT.email}`} className={styles.emailLink}>
                            {CONTACT.email}
                        </a>
                    </div>

                    <div className={styles.block}>
                        <h2 className={styles.blockTitle}>Instagram</h2>
                        <a
                            href={CONTACT.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.emailLink}
                        >
                            {CONTACT.instagramHandle}
                        </a>
                    </div>
                </section>
            </div>
        </div>
    )
}
