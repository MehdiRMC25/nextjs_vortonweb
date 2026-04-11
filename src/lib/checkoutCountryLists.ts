/**
 * Country lists for checkout UI — ISO2 is internal; labels use Intl (no ISO in copy).
 */
import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js'

export function sortedCountryCodes(locale: 'az' | 'en'): CountryCode[] {
  const codes = getCountries()
  const loc = locale === 'az' ? 'az' : 'en'
  try {
    const dn = new Intl.DisplayNames([loc], { type: 'region' })
    return [...codes].sort((a, b) =>
      (dn.of(a) ?? a).localeCompare(dn.of(b) ?? b, loc, { sensitivity: 'base' })
    )
  } catch {
    return [...codes].sort()
  }
}

export function countryLabel(iso: CountryCode, locale: 'az' | 'en'): string {
  const loc = locale === 'az' ? 'az' : 'en'
  try {
    const dn = new Intl.DisplayNames([loc], { type: 'region' })
    return dn.of(iso) ?? iso
  } catch {
    return iso
  }
}

export function phoneCountryOptionLabel(iso: CountryCode, locale: 'az' | 'en'): string {
  const name = countryLabel(iso, locale)
  const dial = getCountryCallingCode(iso)
  return `${name} (+${dial})`
}
