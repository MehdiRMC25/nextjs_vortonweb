// Next.js: use NEXT_PUBLIC_* for client-accessible env vars. Create .env.local (see .env.example).

/** Products come from vorton-payement backend (unified with auth, payments, orders). */
const PRODUCTS_BASE = 'https://vorton-payement.onrender.com'
const e = (key: string, fallback: string) => (process.env[key] || fallback).replace(/\/$/, '')

function envNumber(key: string, fallback: number): number {
  const v = process.env[key]
  if (v == null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export const config = {
  /** Base URL for products API. Defaults to vorton-payement. */
  apiUrl: e('NEXT_PUBLIC_API_URL', e('NEXT_PUBLIC_PRODUCTS_API_URL', PRODUCTS_BASE)),
  productsPath: process.env.NEXT_PUBLIC_PRODUCTS_PATH || '/api/products',
  /** Payment backend base URL (no trailing slash). Backend must allow CORS for your site origin. */
  paymentApiUrl: e('NEXT_PUBLIC_PAYMENT_API_URL', 'https://vorton-payement.onrender.com'),
  /** Path for creating a payment. payement_backend uses /api/v1/payments/create */
  paymentCreatePath: process.env.NEXT_PUBLIC_PAYMENT_CREATE_PATH || '/api/v1/payments/create',
  /**
   * Where the bank redirects after payment (must match a URL allowed by Kapital).
   * If empty, checkout builds a URL: production uses the current origin; localhost uses NEXT_PUBLIC_SITE_URL (see getPaymentReturnUrl).
   */
  paymentReturnUrl: process.env.NEXT_PUBLIC_PAYMENT_RETURN_URL || '',
  /** Canonical public site (no trailing slash). Used for payment return URL on localhost. */
  siteUrl: e('NEXT_PUBLIC_SITE_URL', 'https://vorton.uk'),
  /** Unified API base URL for auth (and payment). Auth must use vorton-payement, not vorton-mob-app. */
  apiBaseUrl: e('NEXT_PUBLIC_API_BASE_URL', 'https://vorton-payement.onrender.com'),
  /** Auth API base URL. Must point to https://vorton-payement.onrender.com (auth lives there). */
  authApiUrl: e('NEXT_PUBLIC_AUTH_API_URL', e('NEXT_PUBLIC_API_BASE_URL', 'https://vorton-payement.onrender.com')),
  authLoginPath: process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH || '/auth/login',
  authSignUpPath: process.env.NEXT_PUBLIC_AUTH_SIGNUP_PATH || '/auth/signup',
  authMePath: process.env.NEXT_PUBLIC_AUTH_ME_PATH || '/api/v1/auth/me',
  /** PATCH profile — same as mobile (address, phone, etc.) */
  authProfilePath: process.env.NEXT_PUBLIC_AUTH_PROFILE_PATH || '/api/v1/auth/profile',
  /** Append-only checkout delivery contact log */
  authCheckoutDeliveryPath:
    process.env.NEXT_PUBLIC_AUTH_CHECKOUT_DELIVERY_PATH || '/api/v1/auth/checkout-delivery',
  /** Orders API base (e.g. http://localhost:3000/api/v1). Same backend as auth. */
  ordersApiBaseUrl: (() => {
    const base = e('NEXT_PUBLIC_ORDERS_API_URL', e('NEXT_PUBLIC_API_BASE_URL', 'https://vorton-payement.onrender.com'))
    return base.includes('/api/v1') ? base : `${base}/api/v1`
  })(),
  /** Socket.io origin: same host as API, no path (e.g. http://localhost:3000). */
  get socketIoOrigin(): string {
    const u = config.ordersApiBaseUrl
    try {
      return new URL(u).origin
    } catch {
      return u.replace(/\/api\/v1.*$/, '').replace(/\/$/, '')
    }
  },
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'vorton-products',
  },
  whatsapp: {
    phoneAz: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE_AZ || '').trim(),
    phoneIntl: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE_INTL || '').trim(),
    // Explicit unknown-country fallback. If omitted, AZ number is used as default fallback.
    phoneFallback: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE_FALLBACK || '').trim(),
    // Legacy single-number keys; keep compatibility with existing setups.
    phoneLegacy: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').trim(),
    defaultMessage: (process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE || '').trim(),
  },
  /**
   * Checkout delivery — amounts in AZN are sent on payments/create (__delivery__).
   * USD/GBP are display-only rates for the shipping row when that currency is selected in checkout.
   * Keep env in sync with payement-backend validation.
   */
  shipping: {
    bakuAzn: envNumber('NEXT_PUBLIC_SHIPPING_BAKU_AZN', 5),
    /** Rest of Azerbaijan (not Baku). Legacy env name kept. */
    azerbaijanAzn: envNumber(
      'NEXT_PUBLIC_SHIPPING_AZERBAIJAN_AZN',
      envNumber('NEXT_PUBLIC_SHIPPING_NATIONAL_AZN', 10)
    ),
    /** Outside Azerbaijan — AZN (set explicitly; not in USD/GBP table). */
    internationalAzn: envNumber('NEXT_PUBLIC_SHIPPING_INTERNATIONAL_AZN', 85),
    bakuUsd: envNumber('NEXT_PUBLIC_SHIPPING_BAKU_USD', 3),
    azerbaijanUsd: envNumber('NEXT_PUBLIC_SHIPPING_AZERBAIJAN_USD', 5.9),
    internationalUsd: envNumber('NEXT_PUBLIC_SHIPPING_INTERNATIONAL_USD', 50),
    bakuGbp: envNumber('NEXT_PUBLIC_SHIPPING_BAKU_GBP', 2.3),
    azerbaijanGbp: envNumber('NEXT_PUBLIC_SHIPPING_AZERBAIJAN_GBP', 4.3),
    internationalGbp: envNumber('NEXT_PUBLIC_SHIPPING_INTERNATIONAL_GBP', 37),
    /**
     * If true (default): empty or non-Baku-looking address uses Azerbaijan (non-Baku) rate, not international.
     * Set env to "0" to use Baku rate when zone is unknown.
     */
    unknownAddressUsesNational: process.env.NEXT_PUBLIC_SHIPPING_UNKNOWN_USES_NATIONAL !== '0',
  },
  /**
   * UI-only FX for converting AZN → USD/GBP in checkout when the API omits quote fields (e.g. local dev).
   * Values are “AZN per 1 unit” of foreign currency (e.g. $1 = 1.7 AZN → enter 1.7).
   * Payment and settlement remain AZN.
   */
  displayFx: {
    aznPerUsd: envNumber('NEXT_PUBLIC_FX_AZN_PER_USD', 1.7),
    aznPerGbp: envNumber('NEXT_PUBLIC_FX_AZN_PER_GBP', 2.15),
  },
}

/** Common image extensions to strip — ensures .jpeg/.png mismatch between MongoDB and Cloudinary does not affect fetching. */
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|bmp|tiff?)(\?.*)?$/i

/** Filename → public_id: strip path/extension, collapse spaces around hyphens (match mobile imageHelper + server). */
function filenameToPublicId(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''
  const base = filename.trim().replace(/^\//, '').replace(IMAGE_EXTENSIONS, '')
  return base.replace(/\s*-\s*/g, '-')
}

export function cloudinaryUrl(filename: string): string {
  const { cloudName, folder } = config.cloudinary
  if (!cloudName || !filename?.trim()) return ''
  const raw = filename.trim()
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  const publicId = filenameToPublicId(raw)
  if (!publicId) return ''
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`
  const path = folder ? `${folder}/${encodeURIComponent(publicId)}` : encodeURIComponent(publicId)
  return `${base}/${path}`
}
