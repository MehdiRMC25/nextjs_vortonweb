import type { Locale } from '@/locales/translations'

function lowerFirst(s: string): string {
  if (!s) return s
  return s[0].toLowerCase() + s.slice(1)
}

const AZ_TOKEN_MAP: Record<string, string> = {
  // modifiers
  dark: 'Tünd',
  light: 'Açıq',
  hot: 'Parlaq',
  pastel: 'Pastel',
  off: 'Kırıq',
  deep: 'Dərin',
  electric: 'Elektrik',
  royal: 'Kral',
  sky: 'Göy',
  midnight: 'Gecə',
  smoke: 'Dumanlı',
  steel: 'Polad',
  graphite: 'Qrafit',
  ash: 'Kül',

  // base colors
  grey: 'Boz',
  gray: 'Boz',
  black: 'Qara',
  white: 'Ağ',
  red: 'Qırmızı',
  blue: 'Mavi',
  green: 'Yaşıl',
  yellow: 'Sarı',
  orange: 'Narıncı',
  purple: 'Bənövşəyi',
  pink: 'Çəhrayı',
  brown: 'Qəhvəyi',
  beige: 'Bej',
  cream: 'Krem',
  navy: 'Mavi',
  olive: 'Zeytun',
  charcoal: 'Kömür',
  indigo: 'İndiqo',
  turquoise: 'Türkuaz',
  aqua: 'Aqua',
  gold: 'Qızılı',
  silver: 'Gümüş',
  bronze: 'Bürünc',
  copper: 'Mis',
}

/**
 * Translate a color name into the UI language.
 * Keeps the underlying value unchanged (useful for filters / query params).
 */
export function displayColorName(colorName: string, locale: Locale): string {
  const raw = (colorName ?? '').toString().trim()
  if (!raw) return raw
  if (locale !== 'az') return raw

  // already Azerbaijani (best-effort): keep as-is
  if (/[əğıöüşçƏĞIİÖÜŞÇ]/.test(raw)) return raw

  // common special-cases where word-by-word translation is wrong
  const rawLower = raw.toLowerCase().replace(/\s+/g, ' ').trim()
  if (rawLower === 'navy blue' || rawLower === 'navy-blue') return 'Tünd göy'
  if (rawLower === 'navy') return 'Tünd göy'

  const parts = raw.split(/[\s-]+/).filter(Boolean)
  if (parts.length === 0) return raw

  const translated = parts.map((p) => AZ_TOKEN_MAP[p.toLowerCase()] ?? p)

  // If it's a phrase, lowercase subsequent words for natural AZ (e.g. "Tünd mavi")
  if (translated.length > 1) {
    for (let i = 1; i < translated.length; i++) {
      // only adjust words we translated (i.e., exist in map)
      const originalLower = parts[i].toLowerCase()
      if (AZ_TOKEN_MAP[originalLower]) translated[i] = lowerFirst(translated[i])
    }
  }

  return translated.join(' ')
}

