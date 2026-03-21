'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { useAuth } from '@/context/AuthContext'
import { AuthApiError } from '@/api/auth'
import { isValidEmail, isValidPhone, looksLikeEmail } from '@/utils/validation'
import styles from '@/app/signin/SignIn.module.css'

/**
 * Staff-only login (internal). Same auth API; after login redirects to /staff/dashboard or returnTo.
 * Not linked from public site; staff use this URL directly.
 */
export default function StaffLogin() {
    const { t } = useLocale()
    const { login, loading, error, clearError } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const rawReturn = searchParams.get('returnTo') || '/staff/orders'
    const returnTo = rawReturn.match(/^\/staff\/orders\/[^/]+$/i) ? '/staff/orders' : rawReturn

    const [emailOrPhone, setEmailOrPhone] = useState('')
    const [password, setPassword] = useState('')
    const [localError, setLocalError] = useState<string | null>(null)
    const [emailOrPhoneError, setEmailOrPhoneError] = useState(false)

    function validateEmailOrPhone(): boolean {
        const trimmed = emailOrPhone.trim()
        if (!trimmed) {
            setEmailOrPhoneError(true)
            setLocalError(t('invalidEmail'))
            return false
        }
        if (looksLikeEmail(trimmed)) {
            if (!isValidEmail(trimmed)) {
                setEmailOrPhoneError(true)
                setLocalError(t('invalidEmail'))
                return false
            }
        } else {
            if (!isValidPhone(trimmed)) {
                setEmailOrPhoneError(true)
                setLocalError(t('invalidMobileNumber'))
                return false
            }
        }
        setEmailOrPhoneError(false)
        return true
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        clearError()
        setLocalError(null)
        setEmailOrPhoneError(false)
        if (!validateEmailOrPhone()) return
        try {
            await login(emailOrPhone.trim(), password)
            const path = returnTo.startsWith('/') ? returnTo : `/${returnTo}`
            router.replace(path)
        } catch (e) {
            if (e instanceof AuthApiError) {
                if (e.status === 401) {
                    setLocalError(t('accountNotFound'))
                    return
                }
                if (e.code === 'INVALID_CREDENTIALS') {
                    setLocalError(
                        e.message && e.message !== 'Invalid credentials'
                            ? e.message
                            : t('invalidCredentialsSignUp')
                    )
                    return
                }
                if (e.code === 'VALIDATION_ERROR' && e.message) {
                    setLocalError(e.message)
                    return
                }
            }
            if (e instanceof Error && e.message) {
                setLocalError(e.message)
                return
            }
            setLocalError(t('signInUnavailable'))
        }
    }

    return (
        <div className={styles.staffLoginWrap}>
            <div className={styles.wrap}>
                <h1 className={styles.title}>{t('staffLoginTitle')}</h1>
                <p className={styles.subtitle}>{t('internalUseOnly')}</p>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label}>
                        {t('emailOrPhoneLabel')}
                        <input
                            type="text"
                            inputMode="email"
                            autoComplete="username"
                            className={`${styles.input} ${emailOrPhoneError ? styles.inputError : ''}`}
                            placeholder={t('emailOrPhonePlaceholder')}
                            value={emailOrPhone}
                            onChange={(e) => {
                                setEmailOrPhone(e.target.value)
                                if (emailOrPhoneError) setEmailOrPhoneError(false)
                            }}
                            required
                        />
                    </label>
                    <label className={styles.label}>
                        {t('passwordLabel')}
                        <input
                            type="password"
                            autoComplete="current-password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    {(localError || error) && (
                        <p className={styles.error}>{localError || error}</p>
                    )}
                    <button type="submit" className={styles.submit} disabled={loading}>
                        {loading ? t('signingIn') : t('staffLoginTitle')}
                    </button>
                </form>
                <p className={styles.footer}>
                    <Link href="/signin">{t('customerSignIn')}</Link> — <Link href="/">{t('home')}</Link>
                </p>
            </div>
        </div>
    )
}
