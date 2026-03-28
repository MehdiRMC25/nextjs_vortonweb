/** Cookie name must match `src/middleware.ts` so SSR and policy pages see the same locale as the UI. */
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
export const LOCALE_STORAGE_KEY = 'vorton-locale'
export const LOCALE_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365
