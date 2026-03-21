'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { useAuth } from '@/context/AuthContext'
import type { MembershipLevel, UserRole } from '@/api/auth'
import styles from './Account.module.css'

const LEVEL_KEYS: Record<MembershipLevel, string> = {
    silver: 'membershipSilver',
    gold: 'membershipGold',
    platinum: 'membershipPlatinum',
}

const BENEFIT_KEYS: Record<MembershipLevel, string[]> = {
    silver: ['benefitSilver1', 'benefitSilver2'],
    gold: ['benefitGold1', 'benefitGold2', 'benefitGold3'],
    platinum: ['benefitPlatinum1', 'benefitPlatinum2', 'benefitPlatinum3', 'benefitPlatinum4'],
}

const DISCOUNT_PERCENT: Record<MembershipLevel, string> = {
    silver: '5%',
    gold: '10%',
    platinum: '15–20%',
}

/** Tier thresholds in AZN total sales — same card design for all levels */
const GOLD_THRESHOLD_AZN = 5000
const PLATINUM_THRESHOLD_AZN = 10000

function getLevelFromSales(totalSalesAzn: number | undefined, apiLevel?: MembershipLevel): MembershipLevel {
    if (typeof totalSalesAzn === 'number') {
        if (totalSalesAzn >= PLATINUM_THRESHOLD_AZN) return 'platinum'
        if (totalSalesAzn >= GOLD_THRESHOLD_AZN) return 'gold'
    }
    if (apiLevel === 'platinum' || apiLevel === 'gold') return apiLevel
    return 'silver'
}

export default function Account() {
    const { t, locale, setLocale } = useLocale()
    const { user, logout } = useAuth()
    const router = useRouter()

    const displayName =
        typeof user?.name === 'string' && user.name.trim()
            ? user.name
            : [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || t('notProvided')
    const displayEmail =
        typeof user?.email === 'string' && user.email.trim() ? user.email : t('notProvided')
    const displayPhone =
        typeof user?.phone === 'string' && user.phone.trim() ? user.phone : t('notProvided')
    const userAddress =
        typeof user?.address === 'string' && user.address.trim() ? user.address : ''
    const joinedDate =
        typeof user?.created_at === 'string' && user.created_at
            ? new Date(user.created_at).toLocaleDateString(locale === 'az' ? 'az-AZ' : 'en-GB')
            : t('notProvided')
    const membershipNumber =
        typeof user?.membership_number === 'string' && user.membership_number
            ? user.membership_number
            : (typeof user?.id === 'string' || typeof user?.id === 'number' ? `VORT-${String(user?.id).padStart(6, '0')}` : t('notProvided'))

    const totalSalesAzn = typeof user?.total_sales_azn === 'number' ? user.total_sales_azn : undefined
    const level = getLevelFromSales(totalSalesAzn, user?.membership_level)
    const levelLabel = t(LEVEL_KEYS[level])
    const benefitKeys = BENEFIT_KEYS[level]
    const memberSinceYear =
        typeof user?.created_at === 'string' && user.created_at
            ? String(new Date(user.created_at).getFullYear())
            : joinedDate

    const role: UserRole = (user?.role as UserRole) ?? 'customer'
    const isCustomer = role !== 'employee' && role !== 'manager'

    const recentOrders = [
        { id: 'VR-009841', date: '2026-02-21', total: '$129.00', status: t('orderStatusDelivered') },
        { id: 'VR-009764', date: '2026-01-14', total: '$84.00', status: t('orderStatusInTransit') },
        { id: 'VR-009702', date: '2025-12-28', total: '$59.00', status: t('orderStatusProcessing') },
    ]

    function handleSignOut() {
        logout()
        router.replace('/')
    }

    return (
        <div className="container">
            <div className={styles.wrap}>
                <h1 className={styles.title}>{t('myAccount')}</h1>
                <p className={styles.welcome}>{t('welcome')}</p>

                <section className={styles.membershipCardSection}>
                    <article
                        className={`${styles.membershipCard} ${styles[`membershipCard_${level}`]}`}
                        aria-label={t('membershipLevel')}
                    >
                        <div className={styles.membershipCardInner}>
                            <header className={styles.membershipCardHeader}>
                                <span className={styles.membershipLevelName}>{levelLabel}</span>
                                <span className={styles.membershipMemberLabel}>{t('member')}</span>
                            </header>
                            <div className={styles.membershipNumberBand}>
                                <p className={styles.membershipNumber}>{membershipNumber}</p>
                            </div>
                            <div className={styles.membershipDetails}>
                                <div className={styles.membershipDetail}>
                                    <span className={styles.membershipDetailLabel}>{t('overallDiscount')}</span>
                                    <span className={styles.membershipDetailValue}>{DISCOUNT_PERCENT[level]}</span>
                                </div>
                                <div className={styles.membershipDetail}>
                                    <span className={styles.membershipDetailLabel}>{t('memberSince')}</span>
                                    <span className={styles.membershipDetailValue}>{memberSinceYear}</span>
                                </div>
                            </div>
                            <div className={styles.membershipBenefits}>
                                <h3 className={styles.membershipBenefitsTitle}>{t('yourBenefits')}</h3>
                                <ul className={styles.membershipBenefitsList}>
                                    {benefitKeys.map((key) => (
                                        <li key={key} className={styles.membershipBenefitsItem}>
                                            {t(key)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <p className={styles.membershipCardName} aria-hidden="true">{displayName}</p>
                        </div>
                    </article>
                    <p className={styles.tierThresholds}>{t('tierThresholds')}</p>
                </section>

                {isCustomer && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>{t('deliveryAndOrderTracking')}</h2>
                        <p className={styles.placeholder}>
                            {t('myOrders')} — {t('trackOrder')}.
                        </p>
                        <Link href="/orders" className={styles.link}>
                            {t('viewMyOrdersAndTrack')} →
                        </Link>
                    </section>
                )}

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('profile')}</h2>
                    <div className={styles.infoGrid}>
                        <div>
                            <p className={styles.label}>{t('nameLabel')}</p>
                            <p className={styles.text}>{displayName}</p>
                        </div>
                        <div>
                            <p className={styles.label}>{t('email')}</p>
                            <p className={styles.text}>{displayEmail}</p>
                        </div>
                        <div>
                            <p className={styles.label}>{t('mobileLabel')}</p>
                            <p className={styles.text}>{displayPhone}</p>
                        </div>
                        <div>
                            <p className={styles.label}>{t('address')}</p>
                            <p className={styles.text}>{userAddress || t('notProvided')}</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('settings')}</h2>
                    <div className={styles.settingRow}>
                        <span className={styles.settingLabel}>{t('language')}</span>
                        <div className={styles.langOptions}>
                            <button
                                type="button"
                                className={locale === 'az' ? styles.langOptionActive : styles.langOption}
                                onClick={() => setLocale('az')}
                            >
                                {t('azerbaijani')}
                            </button>
                            <button
                                type="button"
                                className={locale === 'en' ? styles.langOptionActive : styles.langOption}
                                onClick={() => setLocale('en')}
                            >
                                {t('english')}
                            </button>
                        </div>
                    </div>
                    <div className={styles.infoGrid}>
                        <div>
                            <p className={styles.label}>{t('marketingEmails')}</p>
                            <p className={styles.text}>{t('enabled')}</p>
                        </div>
                        <div>
                            <p className={styles.label}>{t('smsUpdates')}</p>
                            <p className={styles.text}>{t('enabled')}</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('security')}</h2>
                    <div className={styles.infoGrid}>
                        <div>
                            <p className={styles.label}>{t('passwordStatus')}</p>
                            <p className={styles.text}>{t('passwordSet')}</p>
                        </div>
                        <div>
                            <p className={styles.label}>{t('twoFactorAuth')}</p>
                            <p className={styles.text}>{t('disabled')}</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('orderHistory')}</h2>
                    <div className={styles.orderList}>
                        {recentOrders.map((order) => (
                            <div key={order.id} className={styles.orderRow}>
                                <div>
                                    <p className={styles.orderId}>{order.id}</p>
                                    <p className={styles.orderMeta}>
                                        {new Date(order.date).toLocaleDateString(
                                            locale === 'az' ? 'az-AZ' : 'en-GB'
                                        )}
                                    </p>
                                </div>
                                <div className={styles.orderRight}>
                                    <p className={styles.orderTotal}>{order.total}</p>
                                    <p className={styles.orderMeta}>{order.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link href="/shop" className={styles.link}>
                        {t('continueShopping')}
                    </Link>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('addresses')}</h2>
                    <p className={styles.placeholder}>{userAddress || t('noAddressSaved')}</p>
                </section>

                <section className={styles.section}>
                    <button type="button" className={styles.signOutBtn} onClick={handleSignOut}>
                        {t('signOut')}
                    </button>
                </section>
            </div>
        </div>
    )
}
