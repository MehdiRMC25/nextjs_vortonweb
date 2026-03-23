'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useLocale } from '@/context/LocaleContext'
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberWithError,
  type CountryCode,
} from 'libphonenumber-js'

const COMMON_COUNTRIES: CountryCode[] = [
  'AZ', 'TR', 'RU', 'GE', 'IR', 'US', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'AE', 'SA', 'PK', 'IN', 'CN',
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
  id?: string
  autoComplete?: string
  className?: string
}

function toDefaultCountry(geoCountry: string | undefined, locale: string): CountryCode {
  if (geoCountry) {
    const code = geoCountry.toUpperCase().slice(0, 2)
    if (getCountries().includes(code as CountryCode)) return code as CountryCode
  }
  return locale === 'az' ? 'AZ' : 'GB'
}

function countryToFlag(country: string): string {
  return String.fromCodePoint(
    ...country.toUpperCase().split('').map((c) => 0x1f1a5 + c.charCodeAt(0))
  )
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  placeholder,
  error = false,
  disabled = false,
  id,
  autoComplete = 'tel',
  className = '',
}: PhoneInputProps) {
  const { geoCountry, locale } = useLocale()
  const defaultCountry = toDefaultCountry(geoCountry, locale)
  const [country, setCountry] = useState<CountryCode>(() => defaultCountry)
  const [nationalValue, setNationalValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isAZ = country === 'AZ'

  const parseValueToParts = useCallback((v: string): { country: CountryCode; national: string } => {
    const trimmed = v.trim()
    if (!trimmed) return { country: defaultCountry, national: '' }
    try {
      const parsed = parsePhoneNumberWithError(trimmed, defaultCountry)
      return {
        country: parsed.country as CountryCode,
        national: parsed.nationalNumber,
      }
    } catch {
      if (trimmed.startsWith('+994')) {
        const nat = trimmed.replace(/\D/g, '').slice(3) || ''
        return { country: 'AZ', national: nat }
      }
      return { country: defaultCountry, national: trimmed.replace(/\D/g, '') }
    }
  }, [defaultCountry])

  useEffect(() => {
    const v = (value ?? '').trim()
    if (v) {
      const { country: c, national: n } = parseValueToParts(v)
      setCountry(c)
      setNationalValue(n)
    } else {
      setNationalValue('')
      setCountry(defaultCountry)
    }
  }, [value, parseValueToParts, defaultCountry])

  const buildFullNumber = useCallback(
    (c: CountryCode, nat: string): string => {
      const digits = nat.replace(/\D/g, '')
      if (!digits) return ''
      return `+${getCountryCallingCode(c)}${digits}`
    },
    []
  )

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value as CountryCode
    setCountry(newCountry)
    const full = buildFullNumber(newCountry, nationalValue)
    onChange(full)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '')
    if (isAZ && raw.length > 9) raw = raw.slice(0, 9)
    setNationalValue(raw)
    onChange(buildFullNumber(country, raw))
  }

  const formatDisplayValue = (): string => {
    if (!nationalValue) return ''
    if (isAZ) {
      const nat = nationalValue.replace(/\D/g, '')
      if (nat.length <= 2) return nat
      if (nat.length <= 5) return `${nat.slice(0, 2)} ${nat.slice(2)}`
      if (nat.length <= 7) return `${nat.slice(0, 2)} ${nat.slice(2, 5)} ${nat.slice(5)}`
      return `${nat.slice(0, 2)} ${nat.slice(2, 5)} ${nat.slice(5, 7)} ${nat.slice(7, 9)}`
    }
    return nationalValue.replace(/\D/g, '')
  }

  const allCountries = getCountries()
  const displayCountries = [...new Set([...COMMON_COUNTRIES, ...allCountries])]

  return (
    <div
      ref={containerRef}
      className={`flex items-stretch border rounded-lg overflow-hidden bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 ${
        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
      } ${disabled ? 'opacity-60' : ''} ${className}`}
    >
      <select
        value={country}
        onChange={handleCountryChange}
        className="phone-select pl-2 pr-5 py-3 bg-transparent text-sm font-medium focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 [&:focus]:ring-0 border-0"
        aria-label="Country code"
      >
        {displayCountries.map((c) => (
          <option key={c} value={c}>
            {countryToFlag(c)} +{getCountryCallingCode(c)}
          </option>
        ))}
      </select>

      <input
        ref={inputRef}
        id={id}
        type="tel"
        autoComplete={autoComplete}
        inputMode="numeric"
        value={formatDisplayValue()}
        onChange={handleInputChange}
        onBlur={onBlur}
        placeholder={placeholder ?? (isAZ ? '50 123 45 67' : '1234567890')}
        disabled={disabled}
        className="flex-1 min-w-0 pl-1 pr-3 py-3 bg-transparent border-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-0"
      />
    </div>
  )
}
