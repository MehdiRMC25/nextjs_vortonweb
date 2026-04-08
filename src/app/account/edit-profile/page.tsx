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

    const [email1, setEmail1] = useState('')
    const [email2, setEmail2] = useState('')
    const [email3, setEmail3] = useState('')
    const [showEmail2, setShowEmail2] = useState(false)
    const [showEmail3, setShowEmail3] = useState(false)
    const [emailCode, setEmailCode] = useState('')
    const [emailCodeSent, setEmailCodeSent] = useState(false)

    const [phonePassword, setPhonePassword] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [phone2, setPhone2] = useState('')
    const [phone3, setPhone3] = useState('')
    const [showPhone2, setShowPhone2] = useState(false)
    const [showPhone3, setShowPhone3] = useState(false)

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
        setEmail1(user.email ?? '')
        setEmail2(user.second_email ?? '')
        setEmail3(user.third_email ?? '')
        setShowEmail2(Boolean((user.second_email ?? '').trim()))
        setShowEmail3(Boolean((user.third_email ?? '').trim()))
        setNewPhone(user.phone ?? '')
        setPhone2(user.second_phone ?? '')
        setPhone3(user.third_phone ?? '')
        setShowPhone2(Boolean((user.second_phone ?? '').trim()))
        setShowPhone3(Boolean((user.third_phone ?? '').trim()))
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
        const next = email1.trim()
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
        const next = email1.trim()
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

    async function onSaveContactInfo() {
        if (!user || !token) return
        setErr(null)
        setMsg(null)
        setBusy('contact')
        try {
            const primaryPhone = (user.phone ?? '').trim()
            const nextPhone = newPhone.trim()
            const primaryPhoneChanged =
                Boolean(nextPhone) && nextPhone.replace(/\s/g, '') !== primaryPhone.replace(/\s/g, '')

            // Validate emails (optional fields)
            const e1 = email1.trim()
            const e2 = showEmail2 ? email2.trim() : ''
            const e3 = showEmail3 ? email3.trim() : ''
            if (e1 && !isValidEmail(e1)) throw new Error(t('invalidEmailAddress'))
            if (e2 && !isValidEmail(e2)) throw new Error(t('invalidEmailAddress'))
            if (e3 && !isValidEmail(e3)) throw new Error(t('invalidEmailAddress'))

            // Validate phones (optional fields)
            if (nextPhone && !isValidPhone(nextPhone)) throw new Error(t('invalidMobileNumber'))
            const p2 = showPhone2 ? phone2.trim() : ''
            const p3 = showPhone3 ? phone3.trim() : ''
            if (p2 && !isValidPhone(p2)) throw new Error(t('invalidMobileNumber'))
            if (p3 && !isValidPhone(p3)) throw new Error(t('invalidMobileNumber'))

            // Only require password when primary phone changes
            if (primaryPhoneChanged) {
                if (!loginIdentifier) throw new Error(t('editProfileLoginFailed'))
                await login(loginIdentifier, phonePassword)
            }

            await updateProfile({
                email: e1 || undefined,
                second_email: showEmail2 ? e2 || undefined : undefined,
                third_email: showEmail3 ? e3 || undefined : undefined,
                ...(primaryPhoneChanged
                    ? { phone: nextPhone, current_phone: primaryPhone || undefined }
                    : {}),
                second_phone: showPhone2 ? p2 || undefined : undefined,
                third_phone: showPhone3 ? p3 || undefined : undefined,
            })
            setPhonePassword('')
            setMsg(t('editProfileSaved'))
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Save failed')
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
                <div className={`${styles.card} ${styles.cardWide}`}>
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
                <div className={`${styles.card} ${styles.cardWide}`}>
                    <label className={styles.label}>
                        {t('emailLabel')}
                        <input
                            type="email"
                            className={styles.input}
                            value={email1}
                            onChange={(e) => setEmail1(e.target.value)}
                            autoComplete="email"
                        />
                    </label>

                    {email1.trim() && email1.trim() !== (user.email ?? '').trim() && (
                        <>
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
                        </>
                    )}

                    {!showEmail2 ? (
                        <button type="button" className="btn btn-secondary" onClick={() => setShowEmail2(true)} disabled={busy !== null}>
                            {t('addSecondEmail')}
                        </button>
                    ) : (
                        <>
                            <div className={styles.rowActions}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowEmail2(false)
                                        setShowEmail3(false)
                                        setEmail2('')
                                        setEmail3('')
                                    }}
                                    disabled={busy !== null}
                                >
                                    {t('hideSecondEmail')}
                                </button>
                            </div>
                            <label className={styles.label}>
                                {t('secondEmail')}
                                <input type="email" className={styles.input} value={email2} onChange={(e) => setEmail2(e.target.value)} />
                            </label>
                            {!showEmail3 ? (
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEmail3(true)} disabled={busy !== null}>
                                    {t('addThirdEmail')}
                                </button>
                            ) : (
                                <label className={styles.label}>
                                    {t('thirdEmail')}
                                    <input type="email" className={styles.input} value={email3} onChange={(e) => setEmail3(e.target.value)} />
                                </label>
                            )}
                        </>
                    )}
                </div>

                <h2 className={styles.sectionTitle}>{t('editProfilePhoneSection')}</h2>
                <div className={`${styles.card} ${styles.cardWide}`}>
                    <label className={styles.label}>
                        {t('mobileLabel')}
                        <input
                            className={styles.input}
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="+994..."
                        />
                    </label>

                    {newPhone.trim() && newPhone.trim().replace(/\s/g, '') !== (user.phone ?? '').trim().replace(/\s/g, '') && (
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
                    )}

                    {!showPhone2 ? (
                        <button type="button" className="btn btn-secondary" onClick={() => setShowPhone2(true)} disabled={busy !== null}>
                            {t('addSecondMobile')}
                        </button>
                    ) : (
                        <>
                            <div className={styles.rowActions}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowPhone2(false)
                                        setShowPhone3(false)
                                        setPhone2('')
                                        setPhone3('')
                                    }}
                                    disabled={busy !== null}
                                >
                                    {t('hideSecondMobile')}
                                </button>
                            </div>
                            <label className={styles.label}>
                                {t('secondMobile')}
                                <input className={styles.input} value={phone2} onChange={(e) => setPhone2(e.target.value)} inputMode="tel" />
                            </label>
                            {!showPhone3 ? (
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPhone3(true)} disabled={busy !== null}>
                                    {t('addThirdMobile')}
                                </button>
                            ) : (
                                <label className={styles.label}>
                                    {t('thirdMobile')}
                                    <input className={styles.input} value={phone3} onChange={(e) => setPhone3(e.target.value)} inputMode="tel" />
                                </label>
                            )}
                        </>
                    )}

                    <div className={styles.rowActions} style={{ marginTop: 12 }}>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => void onSaveContactInfo()}
                            disabled={busy !== null}
                        >
                            {busy === 'contact' ? t('loading') : t('editProfileSaveAll')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
