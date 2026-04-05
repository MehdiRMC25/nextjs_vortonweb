'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { useAuth } from '@/context/AuthContext'
import { confirmEmailChange, requestEmailChangeCode } from '@/api/auth'
import { isValidEmail, isValidPhone } from '@/utils/validation'
import styles from './EditProfile.module.css'

export default function EditProfilePage() {
    const { t } = useLocale()
    const router = useRouter()
    const { user, token, loading, isAuthenticated, login, updateProfile, syncUser } = useAuth()

    const [addr1, setAddr1] = useState('')
    const [addr2, setAddr2] = useState('')
    const [city, setCity] = useState('')
    const [postcode, setPostcode] = useState('')
    const [country, setCountry] = useState('')

    const [newEmail, setNewEmail] = useState('')
    const [emailCode, setEmailCode] = useState('')
    const [emailCodeSent, setEmailCodeSent] = useState(false)

    const [phonePassword, setPhonePassword] = useState('')
    const [newPhone, setNewPhone] = useState('')

    const [busy, setBusy] = useState<string | null>(null)
    const [msg, setMsg] = useState<string | null>(null)
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/signin?returnTo=%2Faccount%2Fedit-profile')
        }
    }, [loading, isAuthenticated, router])

    useEffect(() => {
        if (!user) return
        setAddr1(user.address_line1 ?? '')
        setAddr2(user.address_line2 ?? '')
        setCity(user.city ?? '')
        setPostcode(user.postcode ?? '')
        setCountry(user.country ?? '')
        setNewEmail(user.email ?? '')
        setNewPhone('')
    }, [user])

    const loginIdentifier = useMemo(() => {
        const e = user?.email?.trim()
        if (e) return e
        return (user?.phone ?? '').trim()
    }, [user])

    async function onSaveAddress() {
        if (!user || !token) return
        setErr(null)
        setMsg(null)
        setBusy('addr')
        try {
            await updateProfile({
                address_line1: addr1.trim() || undefined,
                address_line2: addr2.trim() || undefined,
                city: city.trim() || undefined,
                postcode: postcode.trim() || undefined,
                country: country.trim() || undefined,
            })
            setMsg(t('editProfileSaved'))
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Save failed')
        } finally {
            setBusy(null)
        }
    }

    async function onSendEmailCode() {
        const next = newEmail.trim()
        if (!next || !isValidEmail(next)) {
            setErr(t('editProfileFillRequired'))
            return
        }
        if (next === (user?.email ?? '').trim()) {
            setErr(t('editProfileFillRequired'))
            return
        }
        if (!token) return
        setErr(null)
        setMsg(null)
        setBusy('email-send')
        try {
            const res = await requestEmailChangeCode(token, next)
            if (!res.ok) {
                if (res.error === 'EMAIL_CODE_UNAVAILABLE') {
                    setErr(t('editProfileEmailBackendHint'))
                } else {
                    setErr(res.error || 'Request failed')
                }
                return
            }
            setEmailCodeSent(true)
            setMsg(null)
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Request failed')
        } finally {
            setBusy(null)
        }
    }

    async function onConfirmEmail() {
        const next = newEmail.trim()
        const code = emailCode.trim()
        if (!next || !code || !token) {
            setErr(t('editProfileFillRequired'))
            return
        }
        setErr(null)
        setMsg(null)
        setBusy('email-confirm')
        try {
            const u = await confirmEmailChange(token, next, code)
            syncUser(u)
            setMsg(t('editProfileSaved'))
            setEmailCodeSent(false)
            setEmailCode('')
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Confirm failed')
        } finally {
            setBusy(null)
        }
    }

    async function onUpdatePhone() {
        const next = newPhone.trim()
        const pwd = phonePassword
        if (!pwd || !next) {
            setErr(t('editProfileFillRequired'))
            return
        }
        const accountPhone = (user?.phone ?? '').trim()
        if (accountPhone && next.replace(/\s/g, '') === accountPhone.replace(/\s/g, '')) {
            setErr(t('editProfilePhoneSameAsCurrent'))
            return
        }
        if (!isValidPhone(next)) {
            setErr(t('invalidMobileNumber'))
            return
        }
        if (!loginIdentifier) return
        setErr(null)
        setMsg(null)
        setBusy('phone')
        try {
            await login(loginIdentifier, pwd)
        } catch {
            setErr(t('editProfileLoginFailed'))
            return
        }
        try {
            await updateProfile({
                phone: next,
                current_phone: accountPhone || undefined,
            })
            setPhonePassword('')
            setNewPhone('')
            setMsg(t('editProfileSaved'))
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Update failed')
        } finally {
            setBusy(null)
        }
    }

    if (loading || !user) {
        return (
            <div className="container">
                <p className={styles.hint}>{t('loading')}</p>
            </div>
        )
    }

    return (
        <div className="container">
            <div className={styles.wrap}>
                <Link href="/account" className={styles.back}>
                    ← {t('myAccount')}
                </Link>
                <h1 className={styles.title}>{t('editProfileTitle')}</h1>

                {err && <p className={styles.error}>{err}</p>}
                {msg && <p className={styles.success}>{msg}</p>}

                <h2 className={styles.sectionTitle}>{t('editProfileAddressSection')}</h2>
                <div className={styles.card}>
                    <label className={styles.label}>
                        {t('addressLine1Label')}
                        <input
                            className={styles.input}
                            value={addr1}
                            onChange={(e) => setAddr1(e.target.value)}
                            autoComplete="address-line1"
                        />
                    </label>
                    <label className={styles.label}>
                        {t('addressLine2Label')}
                        <input
                            className={styles.input}
                            value={addr2}
                            onChange={(e) => setAddr2(e.target.value)}
                            autoComplete="address-line2"
                        />
                    </label>
                    <label className={styles.label}>
                        {t('cityLabel')}
                        <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} />
                    </label>
                    <label className={styles.label}>
                        {t('postcodeLabel')}
                        <input className={styles.input} value={postcode} onChange={(e) => setPostcode(e.target.value)} />
                    </label>
                    <label className={styles.label}>
                        {t('countryLabel')}
                        <input className={styles.input} value={country} onChange={(e) => setCountry(e.target.value)} />
                    </label>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void onSaveAddress()}
                        disabled={busy !== null}
                    >
                        {busy === 'addr' ? t('loading') : t('editProfileSaveAddress')}
                    </button>
                </div>

                <h2 className={styles.sectionTitle}>{t('editProfileEmailSection')}</h2>
                <div className={styles.card}>
                    <p className={styles.label}>{t('email')}</p>
                    <input
                        className={`${styles.input} ${styles.readOnly}`}
                        value={user.email ?? ''}
                        readOnly
                        aria-readonly
                    />
                    <label className={styles.label}>
                        {t('editProfileNewEmail')}
                        <input
                            type="email"
                            className={styles.input}
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </label>
                    <div className={styles.rowActions}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => void onSendEmailCode()}
                            disabled={busy !== null}
                        >
                            {busy === 'email-send' ? t('loading') : t('editProfileSendCode')}
                        </button>
                    </div>
                    {emailCodeSent && (
                        <>
                            <label className={styles.label}>
                                {t('editProfileCodePlaceholder')}
                                <input
                                    className={styles.input}
                                    value={emailCode}
                                    onChange={(e) => setEmailCode(e.target.value)}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                />
                            </label>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => void onConfirmEmail()}
                                disabled={busy !== null}
                            >
                                {busy === 'email-confirm' ? t('loading') : t('editProfileConfirmEmail')}
                            </button>
                        </>
                    )}
                </div>

                <h2 className={styles.sectionTitle}>{t('editProfilePhoneSection')}</h2>
                <div className={styles.card}>
                    <p className={styles.label}>{t('mobileLabel')}</p>
                    <input
                        className={`${styles.input} ${styles.readOnly}`}
                        value={user.phone ?? ''}
                        readOnly
                        aria-readonly
                    />
                    <label className={styles.label}>{t('editProfileNewPhone')}</label>
                    <input
                        className={styles.input}
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+994..."
                    />
                    <label className={styles.label}>
                        {t('editProfilePhonePassword')}
                        <input
                            type="password"
                            className={styles.input}
                            value={phonePassword}
                            onChange={(e) => setPhonePassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </label>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void onUpdatePhone()}
                        disabled={busy !== null}
                    >
                        {busy === 'phone' ? t('loading') : t('editProfileUpdatePhone')}
                    </button>
                </div>
            </div>
        </div>
    )
}
