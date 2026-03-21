// Next.js: use NEXT_PUBLIC_* for client-accessible env vars. Create .env.local (see .env.example).

/** Products come from vorton-payement backend (unified with auth, payments, orders). */
const PRODUCTS_BASE = 'https://vorton-payement.onrender.com'
const e = (key: string, fallback: string) => (process.env[key] || fallback).replace(/\/$/, '')

export const config = {
  /** Base URL for products API. Defaults to vorton-payement. */
  apiUrl: e('NEXT_PUBLIC_API_URL', e('NEXT_PUBLIC_PRODUCTS_API_URL', PRODUCTS_BASE)),
  productsPath: process.env.NEXT_PUBLIC_PRODUCTS_PATH || '/api/products',
  /** Payment backend base URL (no trailing slash). Backend must allow CORS for your site origin. */
  paymentApiUrl: e('NEXT_PUBLIC_PAYMENT_API_URL', 'https://vorton-payement.onrender.com'),
  /** Path for creating a payment. payement_backend uses /api/v1/payments/create */
  paymentCreatePath: process.env.NEXT_PUBLIC_PAYMENT_CREATE_PATH || '/api/v1/payments/create',
  /** Where the bank redirects after payment. Set to https://vorton.uk/payment-done.html for production. */
  paymentReturnUrl: process.env.NEXT_PUBLIC_PAYMENT_RETURN_URL || '',
  /** Unified API base URL for auth (and payment). Auth must use vorton-payement, not vorton-mob-app. */
  apiBaseUrl: e('NEXT_PUBLIC_API_BASE_URL', 'https://vorton-payement.onrender.com'),
  /** Auth API base URL. Must point to https://vorton-payement.onrender.com (auth lives there). */
  authApiUrl: e('NEXT_PUBLIC_AUTH_API_URL', e('NEXT_PUBLIC_API_BASE_URL', 'https://vorton-payement.onrender.com')),
  authLoginPath: process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH || '/auth/login',
  authSignUpPath: process.env.NEXT_PUBLIC_AUTH_SIGNUP_PATH || '/auth/signup',
  authMePath: process.env.NEXT_PUBLIC_AUTH_ME_PATH || '/api/v1/auth/me',
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
