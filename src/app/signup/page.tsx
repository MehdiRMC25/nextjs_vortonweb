'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/context/LocaleContext'
import { useAuth } from '@/context/AuthContext'
import { AuthApiError } from '@/api/auth'
import { isValidEmail, isValidPhone } from '@/utils/validation'
import { PhoneInput } from '@/components/PhoneInput'
import styles from '@/app/signin/SignIn.module.css'

export default function SignUp() {
    const { t } = useLocale()
    const { signup } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [secondPhone, setSecondPhone] = useState('')
    const [email, setEmail] = useState('')
    const [addressLine1, setAddressLine1] = useState('')
    const [addressLine2, setAddressLine2] = useState('')
    const [city, setCity] = useState('')
    const [postcode, setPostcode] = useState('')
    const [country, setCountry] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [phoneError, setPhoneError] = useState(false)
    const [secondPhoneError, setSecondPhoneError] = useState(false)
    const [emailError, setEmailError] = useState(false)

    function validateForm(): boolean {
        setMessage(null)
        setPhoneError(false)
        setSecondPhoneError(false)
        setEmailError(false)
        if (!isValidPhone(phone)) {
            setPhoneError(true)
            setMessage({ type: 'error', text: t('invalidMobileNumber') })
            return false
        }
        if (secondPhone.trim() && !isValidPhone(secondPhone)) {
            setSecondPhoneError(true)
            setMessage({ type: 'error', text: t('invalidMobileNumber') })
            return false
        }
        if (email.trim() && !isValidEmail(email)) {
            setEmailError(true)
            setMessage({ type: 'error', text: t('invalidEmail') })
            return false
        }
        if (password && password !== confirmPassword) {
            setMessage({ type: 'error', text: t('passwordMismatch') })
            return false
        }
        return true
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validateForm()) return
        setLoading(true)
        setMessage(null)
        try {
            const { hasSession } = await signup({
                first_name: firstName,
                last_name: lastName,
                phone: phone.trim(),
                second_phone: secondPhone.trim() || undefined,
                email: email.trim() || undefined,
                address_line1: addressLine1 || undefined,
                address_line2: addressLine2 || undefined,
                city: city || undefined,
                postcode: postcode || undefined,
                country: country || undefined,
                password,
                confirmPassword,
            })
            const successText = t('signUpSuccess')
            setMessage({ type: 'success', text: successText })
            if (hasSession) {
                setTimeout(() => router.replace('/account'), 1500)
            } else {
                setTimeout(
                    () => router.replace(`/signin?signUpSuccess=${encodeURIComponent(successText)}`),
                    1500
                )
            }
        } catch (e) {
            if (e instanceof AuthApiError) {
                if (e.status === 400) {
                    setMessage({ type: 'error', text: e.message || t('invalidEmail') })
                    return
                }
                if (e.status === 401) {
                    setMessage({ type: 'error', text: t('accountNotFound') })
                    return
                }
                if (e.status === 409) {
                    setMessage({ type: 'error', text: t('accountAlreadyExists') })
                    return
                }
                if (e.code === 'INVALID_CREDENTIALS') {
                    setMessage({ type: 'error', text: t('invalidCredentialsSignUp') })
                    return
                }
                if ((e.code === 'CONFLICT' || e.code === 'VALIDATION_ERROR') && e.message) {
                    setMessage({ type: 'error', text: e.message })
                    return
                }
            }
            if (e instanceof Error && e.message) {
                setMessage({ type: 'error', text: e.message })
                return
            }
            setMessage({ type: 'error', text: t('signUpUnavailable') })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <div className={styles.wrap}>
                <h1 className={styles.title}>{t('createAccount')}</h1>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label}>
                        {t('firstNameLabel')} *
                        <input
                            type="text"
                            autoComplete="given-name"
                            className={styles.input}
                            placeholder={t('firstNameLabel')}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            maxLength={100}
                            required
                        />
                    </label>
                    <label className={styles.label}>
                        {t('lastNameLabel')} *
                        <input
                            type="text"
                            autoComplete="family-name"
                            className={styles.input}
                            placeholder={t('lastNameLabel')}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            maxLength={100}
                            required
                        />
                    </label>
                    <label className={styles.label}>
                        {t('mobileLabel')} *
                        <PhoneInput
                            value={phone}
                            onChange={(v) => {
                                setPhone(v)
                                if (phoneError) setPhoneError(false)
                            }}
                            error={phoneError}
                            placeholder=""
                            autoComplete="tel"
                            id="phone"
                        />
                    </label>
                    <label className={styles.label}>
                        {t('mobileOptional2')}
                        <PhoneInput
                            value={secondPhone}
                            onChange={(v) => {
                                setSecondPhone(v)
                                if (secondPhoneError) setSecondPhoneError(false)
                            }}
                            error={secondPhoneError}
                            placeholder=""
                            autoComplete="tel-national"
                            id="secondPhone"
                        />
                    </label>
                    <label className={styles.label}>
                        {t('emailOptional')}
                        <input
                            type="email"
                            autoComplete="email"
                            className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (emailError) setEmailError(false)
                            }}
                            maxLength={150}
                        />
                    </label>
                    <label className={styles.label}>
                        {t('addressLine1Label')}
                        <input
                            type="text"
                            autoComplete="address-line1"
                            className={styles.input}
                            placeholder=""
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            maxLength={255}
                        />
                    </label>
                    <label className={styles.label}>
                        {t('addressLine2Label')}
                        <input
                            type="text"
                            autoComplete="address-line2"
                            className={styles.input}
                            placeholder=""
                            value={addressLine2}
                            onChange={(e) => setAddressLine2(e.target.value)}
                            maxLength={255}
                        />
                    </label>
                    <label className={styles.label}>
                        {t('cityLabel')}
                        <input
                            type="text"
                            autoComplete="address-level2"
                            className={styles.input}
                            placeholder=""
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            maxLength={100}
                        />
                    </label>
                    <label className={styles.label}>
                        {t('postcodeLabel')}
                        <input
                            type="text"
                            autoComplete="postal-code"
                            className={styles.input}
                            placeholder=""
                            value={postcode}
                            onChange={(e) => setPostcode(e.target.value)}
                            maxLength={20}
                        />
                    </label>
                    <label className={styles.label}>
                        {t('countryLabel')}
                        <input
                            type="text"
                            autoComplete="country-name"
                            className={styles.input}
                            placeholder=""
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            maxLength={100}
                        />
                    </label>
                    <label className={styles.label}>
                        {t('passwordLabel')}
                        <input
                            type="password"
                            autoComplete="new-password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <label className={styles.label}>
                        {t('confirmPasswordLabel')}
                        <input
                            type="password"
                            autoComplete="new-password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </label>
                    {message && (
                        <p className={message.type === 'error' ? styles.error : styles.success}>
                            {message.text}
                        </p>
                    )}
                    <button type="submit" className={styles.submit} disabled={loading}>
                        {loading ? t('signingUp') : t('signUpSubmit')}
                    </button>
                </form>
                <p className={styles.footer}>
                    {t('alreadyHaveAccount')} <Link href="/signin">{t('signIn')}</Link>
                </p>
            </div>
        </div>
    )
}
