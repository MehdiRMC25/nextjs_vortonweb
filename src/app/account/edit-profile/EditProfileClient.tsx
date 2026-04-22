'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { useAuth } from '@/context/AuthContext'
import { confirmEmailChange, requestEmailChangeCode } from '@/api/auth'
import { isValidEmail, isValidPhone } from '@/utils/validation'
import styles from './EditProfile.module.css'

type VerifySlot = 'primary' | 'second' | 'third'

type InlineField =
    | 'email1'
    | 'email2'
    | 'email3'
    | 'phone1'
    | 'phone2'
    | 'phone3'
    | 'phonePw'
    | 'emailCode'
    | 'save'

type EditProfileStyles = typeof styles

function EmailVerificationPanel(props: {
    t: (key: string) => string
    styles: EditProfileStyles
    msg: string | null
    emailCode: string
    setEmailCode: (v: string) => void
    inlineError: { field: InlineField; message: string } | null
    busy: string | null
    onResend: () => void
    onConfirm: () => void
    onVerifyLater: () => void
    clearInlineIf: (field: InlineField) => void
}) {
    const {
        t,
        styles: s,
        msg,
        emailCode,
        setEmailCode,
        inlineError,
        busy,
        onResend,
        onConfirm,
        onVerifyLater,
        clearInlineIf,
    } = props
    return (
        <div className={s.verificationCard} role="region" aria-labelledby="email-verify-title">
            <h2 id="email-verify-title" className={s.verificationTitle}>
                {t('emailNotVerifiedTitle')}
            </h2>
            {msg && <p className={s.verificationNotice}>{msg}</p>}
            <div className={s.verificationActionsTop}>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => void onResend()}
                    disabled={busy !== null}
                >
                    {busy === 'email-send' ? t('loading') : t('emailVerificationResend')}
                </button>
            </div>
            <label className={s.label}>
                {t('editProfileCodePlaceholder')}
                <input
                    className={`${s.input} ${inlineError?.field === 'emailCode' ? s.inputInvalid : ''}`}
                    value={emailCode}
                    onChange={(e) => {
                        setEmailCode(e.target.value)
                        clearInlineIf('emailCode')
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                />
            </label>
            {inlineError?.field === 'emailCode' && (
                <p className={s.fieldError} role="alert">
                    {inlineError.message}
                </p>
            )}
            <div className={s.verificationActionsRow}>
                <button type="button" className="btn btn-secondary" onClick={onVerifyLater} disabled={busy !== null}>
                    {t('verifyLater')}
                </button>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void onConfirm()}
                    disabled={busy !== null}
                >
                    {busy === 'email-confirm' ? t('loading') : t('emailVerificationConfirm')}
                </button>
            </div>
        </div>
    )
}

export function EditProfileClient() {
    const { t } = useLocale()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, token, loading, isAuthenticated, login, updateProfile, syncUser } = useAuth()

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')

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
    const [showVerificationCard, setShowVerificationCard] = useState(false)
    const [pendingVerifySlot, setPendingVerifySlot] = useState<VerifySlot>('primary')
    const [verificationDismissed, setVerificationDismissed] = useState(false)
    const deepLinkRef = useRef<{ slot: VerifySlot; codeRequested: boolean } | null>(null)
    const handledDeepLinkVerifyRef = useRef(false)
    const primaryAutoOpenedRef = useRef(false)

    const [phonePassword, setPhonePassword] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [phone2, setPhone2] = useState('')
    const [phone3, setPhone3] = useState('')
    const [showPhone2, setShowPhone2] = useState(false)
    const [showPhone3, setShowPhone3] = useState(false)

    const [busy, setBusy] = useState<string | null>(null)
    const [msg, setMsg] = useState<string | null>(null)
    const [inlineError, setInlineError] = useState<{ field: InlineField; message: string } | null>(null)
    const [saveNotice, setSaveNotice] = useState(false)
    const saveNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/signin?returnTo=%2Faccount%2Fedit-profile')
        }
    }, [loading, isAuthenticated, router])

    useEffect(() => {
        return () => {
            if (saveNoticeTimerRef.current) clearTimeout(saveNoticeTimerRef.current)
        }
    }, [])

    useEffect(() => {
        if (!user) return
        let fn = (user.first_name ?? '').trim()
        let ln = (user.last_name ?? '').trim()
        if (!fn && !ln && user.name) {
            const parts = user.name.trim().split(/\s+/)
            fn = parts[0] ?? ''
            ln = parts.slice(1).join(' ')
        }
        setFirstName(fn)
        setLastName(ln)
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

    const normalizePhone = (s: string) => s.replace(/\s/g, '')

    function clearInlineIf(field: InlineField) {
        setInlineError((cur) => (cur?.field === field ? null : cur))
    }

    function emailForSlot(slot: VerifySlot): string {
        if (slot === 'primary') return email1.trim()
        if (slot === 'second' && showEmail2) return email2.trim()
        if (slot === 'third' && showEmail3) return email3.trim()
        return email1.trim()
    }

    function emailOnServerForSlot(u: NonNullable<typeof user>, slot: VerifySlot): string {
        if (slot === 'primary') return (u.email ?? '').trim()
        if (slot === 'second') return (u.second_email ?? '').trim()
        return (u.third_email ?? '').trim()
    }

    function pickPostSaveVerification(
        before: { e1: string; e2: string; e3: string },
        after: { e1: string; e2: string; e3: string; show2: boolean; show3: boolean }
    ): { slot: VerifySlot; email: string } | null {
        if (after.e1 && after.e1 !== before.e1) return { slot: 'primary', email: after.e1 }
        if (after.show2 && after.e2 && after.e2 !== before.e2) return { slot: 'second', email: after.e2 }
        if (after.show3 && after.e3 && after.e3 !== before.e3) return { slot: 'third', email: after.e3 }
        return null
    }

    async function requestCodeForEmailAddress(targetEmail: string): Promise<boolean> {
        if (!token || !targetEmail.trim()) return false
        if (!isValidEmail(targetEmail)) {
            setInlineError({ field: 'emailCode', message: t('invalidEmailAddress') })
            return false
        }
        setBusy('email-send')
        setInlineError(null)
        try {
            const res = await requestEmailChangeCode(token, targetEmail)
            if (!res.ok) {
                if (res.error === 'EMAIL_CODE_UNAVAILABLE') {
                    setInlineError({ field: 'emailCode', message: t('editProfileEmailBackendHint') })
                } else {
                    setInlineError({ field: 'emailCode', message: res.error || 'Request failed' })
                }
                return false
            }
            setMsg(t('emailVerificationSentNotice'))
            return true
        } catch (e) {
            setInlineError({ field: 'emailCode', message: e instanceof Error ? e.message : 'Request failed' })
            return false
        } finally {
            setBusy(null)
        }
    }

    async function onResendVerificationCode() {
        setMsg(null)
        const em = emailForSlot(pendingVerifySlot)
        await requestCodeForEmailAddress(em)
    }

    async function onConfirmVerification() {
        const em = emailForSlot(pendingVerifySlot)
        const code = emailCode.trim()
        if (!em) {
            setInlineError({ field: 'emailCode', message: t('editProfileFillRequired') })
            return
        }
        if (!code || !token) {
            setInlineError({ field: 'emailCode', message: t('editProfileFillRequired') })
            return
        }
        setInlineError(null)
        setMsg(null)
        setBusy('email-confirm')
        try {
            const u = await confirmEmailChange(token, em, code)
            syncUser(u)
            setMsg(t('emailVerifiedSuccess'))
            setEmailCode('')
            setShowVerificationCard(false)
            setVerificationDismissed(true)
        } catch (e) {
            setInlineError({ field: 'emailCode', message: e instanceof Error ? e.message : 'Confirm failed' })
        } finally {
            setBusy(null)
        }
    }

    function onVerifyLater() {
        setVerificationDismissed(true)
        setShowVerificationCard(false)
        setEmailCode('')
        setMsg(null)
        setInlineError(null)
    }

    /** Deep link ?verifyEmail=1 — open card and scroll to panel, then strip query. */
    useEffect(() => {
        if (searchParams.get('verifyEmail') !== '1') return
        if (deepLinkRef.current) return
        const s = searchParams.get('slot')
        const slot: VerifySlot = s === 'second' ? 'second' : s === 'third' ? 'third' : 'primary'
        deepLinkRef.current = { slot, codeRequested: false }
        handledDeepLinkVerifyRef.current = true
        primaryAutoOpenedRef.current = true
        setPendingVerifySlot(slot)
        setVerificationDismissed(false)
        setShowVerificationCard(true)
        requestAnimationFrame(() => {
            document.getElementById('email-verify-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        router.replace('/account/edit-profile', { scroll: false })
    }, [searchParams, router])

    /** After deep link: request verification code in background (mobile parity). */
    useEffect(() => {
        if (!deepLinkRef.current || deepLinkRef.current.codeRequested || !user || !token) return
        const slot = deepLinkRef.current.slot
        const em = emailOnServerForSlot(user, slot)
        if (!em) return
        deepLinkRef.current.codeRequested = true
        void requestCodeForEmailAddress(em)
    }, [user, token])

    /** Primary email on file but unverified — show verification card (no auto-send). */
    useEffect(() => {
        if (!user || verificationDismissed) return
        if (handledDeepLinkVerifyRef.current) return
        if (deepLinkRef.current) return
        if (searchParams.get('verifyEmail') === '1') return
        const has = Boolean(user.email?.trim())
        if (!has || user.email_verified === true) return
        if (primaryAutoOpenedRef.current) return
        primaryAutoOpenedRef.current = true
        setPendingVerifySlot('primary')
        setShowVerificationCard(true)
    }, [user, verificationDismissed, searchParams])

    async function onSaveAll() {
        if (!user || !token) return
        setInlineError(null)
        setMsg(null)

        const emailBefore = {
            e1: (user.email ?? '').trim(),
            e2: (user.second_email ?? '').trim(),
            e3: (user.third_email ?? '').trim(),
        }

        const primaryPhone = (user.phone ?? '').trim()
        const nextPhone = newPhone.trim()
        const primaryPhoneDirty = normalizePhone(nextPhone) !== normalizePhone(primaryPhone)
        const primaryPhoneCleared = Boolean(primaryPhone) && nextPhone === ''

        const e1 = email1.trim()
        const e2 = showEmail2 ? email2.trim() : ''
        const e3 = showEmail3 ? email3.trim() : ''
        if (e1 && !isValidEmail(e1)) {
            setInlineError({ field: 'email1', message: t('invalidEmailAddress') })
            return
        }
        if (e2 && !isValidEmail(e2)) {
            setInlineError({ field: 'email2', message: t('invalidEmailAddress') })
            return
        }
        if (e3 && !isValidEmail(e3)) {
            setInlineError({ field: 'email3', message: t('invalidEmailAddress') })
            return
        }

        if (nextPhone && !isValidPhone(nextPhone)) {
            setInlineError({ field: 'phone1', message: t('invalidMobileNumber') })
            return
        }
        const p2 = showPhone2 ? phone2.trim() : ''
        const p3 = showPhone3 ? phone3.trim() : ''
        if (p2 && !isValidPhone(p2)) {
            setInlineError({ field: 'phone2', message: t('invalidMobileNumber') })
            return
        }
        if (p3 && !isValidPhone(p3)) {
            setInlineError({ field: 'phone3', message: t('invalidMobileNumber') })
            return
        }

        setBusy('save')
        try {
            if (primaryPhoneDirty) {
                if (!loginIdentifier) {
                    setInlineError({ field: 'phonePw', message: t('editProfileLoginFailed') })
                    return
                }
                try {
                    await login(loginIdentifier, phonePassword)
                } catch {
                    setInlineError({ field: 'phonePw', message: t('editProfileLoginFailed') })
                    return
                }
            }

            await updateProfile({
                first_name: firstName.trim() || undefined,
                last_name: lastName.trim() || undefined,
                address_line1: addr1.trim() || undefined,
                address_line2: addr2.trim() || undefined,
                city: city.trim() || undefined,
                postcode: postcode.trim() || undefined,
                country: country.trim() || undefined,
                email: e1 === '' ? null : e1,
                second_email: showEmail2 ? (e2 === '' ? null : e2) : undefined,
                third_email: showEmail3 ? (e3 === '' ? null : e3) : undefined,
                ...(primaryPhoneDirty
                    ? {
                          phone: primaryPhoneCleared ? null : nextPhone,
                          current_phone: primaryPhone || undefined,
                      }
                    : {}),
                second_phone: showPhone2 ? (p2 === '' ? null : p2) : undefined,
                third_phone: showPhone3 ? (p3 === '' ? null : p3) : undefined,
            })
            setPhonePassword('')

            const afterPayload = {
                e1,
                e2,
                e3,
                show2: showEmail2,
                show3: showEmail3,
            }
            const anyEmailLineChanged =
                e1 !== emailBefore.e1 ||
                (showEmail2 && e2 !== emailBefore.e2) ||
                (showEmail3 && e3 !== emailBefore.e3)
            const verifyPick = pickPostSaveVerification(emailBefore, afterPayload)
            const needsVerifyFollowUp = anyEmailLineChanged && verifyPick !== null

            if (needsVerifyFollowUp && verifyPick) {
                setShowVerificationCard(true)
                setPendingVerifySlot(verifyPick.slot)
                setVerificationDismissed(false)
                setEmailCode('')
                await requestCodeForEmailAddress(verifyPick.email)
            } else {
                if (saveNoticeTimerRef.current) clearTimeout(saveNoticeTimerRef.current)
                setSaveNotice(true)
                saveNoticeTimerRef.current = setTimeout(() => {
                    setSaveNotice(false)
                    saveNoticeTimerRef.current = null
                }, 4000)
            }
        } catch (e) {
            setInlineError({ field: 'save', message: e instanceof Error ? e.message : 'Save failed' })
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

    const primaryPhoneDirty = normalizePhone(newPhone) !== normalizePhone(user.phone ?? '')

    const showVerifyPrimary = showVerificationCard && pendingVerifySlot === 'primary'
    const showVerifySecond = showVerificationCard && pendingVerifySlot === 'second'
    const showVerifyThird = showVerificationCard && pendingVerifySlot === 'third'

    const verificationPanelProps = {
        t,
        styles,
        msg,
        emailCode,
        setEmailCode,
        inlineError,
        busy,
        onResend: onResendVerificationCode,
        onConfirm: onConfirmVerification,
        onVerifyLater,
        clearInlineIf,
    }

    return (
        <div className="container">
            <div className={styles.wrap}>
                <Link href="/account" className={styles.back}>
                    ← {t('myAccount')}
                </Link>
                <h1 className={styles.title}>{t('editProfileTitle')}</h1>

                {msg && !showVerificationCard && <p className={styles.success}>{msg}</p>}

                <h2 className={styles.sectionTitle}>{t('editProfileNameSection')}</h2>
                <div className={`${styles.card} ${styles.cardWide}`}>
                    <label className={styles.label}>
                        {t('firstNameLabel')}
                        <input
                            className={styles.input}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="given-name"
                        />
                    </label>
                    <label className={styles.label}>
                        {t('lastNameLabel')}
                        <input
                            className={styles.input}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            autoComplete="family-name"
                        />
                    </label>
                </div>

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
                </div>

                <div className={`${styles.card} ${styles.cardWide}`}>
                    <div
                        className={`${styles.emailSlotWithVerify} ${
                            showVerifyPrimary ? styles.emailSlotWithVerifySideBySide : ''
                        }`}
                    >
                        <div className={`${styles.fieldGroup} ${styles.fieldGroupRow}`}>
                            <label className={styles.label}>
                                {t('emailLabel')}
                                <input
                                    type="email"
                                    className={`${styles.input} ${inlineError?.field === 'email1' ? styles.inputInvalid : ''}`}
                                    value={email1}
                                    onChange={(e) => {
                                        setEmail1(e.target.value)
                                        clearInlineIf('email1')
                                    }}
                                    autoComplete="email"
                                />
                            </label>
                            {inlineError?.field === 'email1' && (
                                <p className={styles.fieldError} role="alert">
                                    {inlineError.message}
                                </p>
                            )}
                        </div>
                        {showVerifyPrimary && <EmailVerificationPanel {...verificationPanelProps} />}
                    </div>

                    {!showEmail2 ? (
                        <button type="button" className="btn btn-secondary" onClick={() => setShowEmail2(true)} disabled={busy !== null}>
                            {t('addSecondEmail')}
                        </button>
                    ) : (
                        <>
                            <div
                                className={`${styles.emailSlotWithVerify} ${
                                    showVerifySecond ? styles.emailSlotWithVerifySideBySide : ''
                                }`}
                            >
                                <div className={`${styles.fieldGroup} ${styles.fieldGroupRow}`}>
                                    <label className={styles.label}>
                                        {t('secondEmail')}
                                        <input
                                            type="email"
                                            className={`${styles.input} ${inlineError?.field === 'email2' ? styles.inputInvalid : ''}`}
                                            value={email2}
                                            onChange={(e) => {
                                                setEmail2(e.target.value)
                                                clearInlineIf('email2')
                                            }}
                                        />
                                    </label>
                                    {inlineError?.field === 'email2' && (
                                        <p className={styles.fieldError} role="alert">
                                            {inlineError.message}
                                        </p>
                                    )}
                                </div>
                                {showVerifySecond && <EmailVerificationPanel {...verificationPanelProps} />}
                            </div>
                            {!showEmail3 ? (
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEmail3(true)} disabled={busy !== null}>
                                    {t('addThirdEmail')}
                                </button>
                            ) : (
                                <div
                                    className={`${styles.emailSlotWithVerify} ${
                                        showVerifyThird ? styles.emailSlotWithVerifySideBySide : ''
                                    }`}
                                >
                                    <div className={`${styles.fieldGroup} ${styles.fieldGroupRow}`}>
                                        <label className={styles.label}>
                                            {t('thirdEmail')}
                                            <input
                                                type="email"
                                                className={`${styles.input} ${inlineError?.field === 'email3' ? styles.inputInvalid : ''}`}
                                                value={email3}
                                                onChange={(e) => {
                                                    setEmail3(e.target.value)
                                                    clearInlineIf('email3')
                                                }}
                                            />
                                        </label>
                                        {inlineError?.field === 'email3' && (
                                            <p className={styles.fieldError} role="alert">
                                                {inlineError.message}
                                            </p>
                                        )}
                                    </div>
                                    {showVerifyThird && <EmailVerificationPanel {...verificationPanelProps} />}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className={`${styles.card} ${styles.cardWide}`}>
                    <div className={`${styles.fieldGroup} ${styles.fieldGroupRow}`}>
                        <label className={styles.label}>
                            {t('mobileLabel')}
                            <input
                                className={`${styles.input} ${inlineError?.field === 'phone1' ? styles.inputInvalid : ''}`}
                                value={newPhone}
                                onChange={(e) => {
                                    setNewPhone(e.target.value)
                                    clearInlineIf('phone1')
                                }}
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="+994..."
                            />
                        </label>
                        {inlineError?.field === 'phone1' && (
                            <p className={styles.fieldError} role="alert">
                                {inlineError.message}
                            </p>
                        )}
                    </div>

                    {primaryPhoneDirty && (
                        <div className={`${styles.fieldGroup} ${styles.fieldGroupRow}`}>
                            <label className={`${styles.label} ${styles.phonePasswordLabel}`}>
                                {t('editProfilePhonePassword')}
                                <input
                                    type="password"
                                    className={`${styles.input} ${styles.phonePasswordInput} ${inlineError?.field === 'phonePw' ? styles.inputInvalid : ''}`}
                                    value={phonePassword}
                                    onChange={(e) => {
                                        setPhonePassword(e.target.value)
                                        clearInlineIf('phonePw')
                                    }}
                                    autoComplete="current-password"
                                />
                            </label>
                            {inlineError?.field === 'phonePw' && (
                                <p className={styles.fieldError} role="alert">
                                    {inlineError.message}
                                </p>
                            )}
                        </div>
                    )}

                    {!showPhone2 ? (
                        <button type="button" className="btn btn-secondary" onClick={() => setShowPhone2(true)} disabled={busy !== null}>
                            {t('addSecondMobile')}
                        </button>
                    ) : (
                        <>
                            <div className={`${styles.fieldGroup} ${styles.fieldGroupRow}`}>
                                <label className={styles.label}>
                                    {t('secondMobile')}
                                    <input
                                        className={`${styles.input} ${inlineError?.field === 'phone2' ? styles.inputInvalid : ''}`}
                                        value={phone2}
                                        onChange={(e) => {
                                            setPhone2(e.target.value)
                                            clearInlineIf('phone2')
                                        }}
                                        inputMode="tel"
                                    />
                                </label>
                                {inlineError?.field === 'phone2' && (
                                    <p className={styles.fieldError} role="alert">
                                        {inlineError.message}
                                    </p>
                                )}
                            </div>
                            {!showPhone3 ? (
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPhone3(true)} disabled={busy !== null}>
                                    {t('addThirdMobile')}
                                </button>
                            ) : (
                                <div className={`${styles.fieldGroup} ${styles.fieldGroupRow}`}>
                                    <label className={styles.label}>
                                        {t('thirdMobile')}
                                        <input
                                            className={`${styles.input} ${inlineError?.field === 'phone3' ? styles.inputInvalid : ''}`}
                                            value={phone3}
                                            onChange={(e) => {
                                                setPhone3(e.target.value)
                                                clearInlineIf('phone3')
                                            }}
                                            inputMode="tel"
                                        />
                                    </label>
                                    {inlineError?.field === 'phone3' && (
                                        <p className={styles.fieldError} role="alert">
                                            {inlineError.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className={`${styles.cardWide} ${styles.saveBlock}`}>
                    <div className={styles.saveRow}>
                        <button
                            type="button"
                            className={`btn btn-primary ${styles.saveButton}`}
                            onClick={() => void onSaveAll()}
                            disabled={busy !== null}
                        >
                            {busy === 'save' ? t('loading') : t('editProfileSaveAll')}
                        </button>
                        {saveNotice && <p className={styles.saveFeedback}>{t('editProfileSaved')}</p>}
                    </div>
                    {inlineError?.field === 'save' && (
                        <p className={styles.fieldError} role="alert">
                            {inlineError.message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
