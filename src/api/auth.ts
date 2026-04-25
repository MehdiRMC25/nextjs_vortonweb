import { config } from '../config'

export type MembershipLevel = 'silver' | 'gold' | 'platinum' | 'platinum_plus'

export type UserRole = 'customer' | 'employee' | 'manager'

export type AuthUser = {
  id: string | number
  role?: UserRole
  email?: string
  /** Server truth for verification; omit/undefined treated as unknown legacy. */
  email_verified?: boolean
  second_email?: string
  second_email_verified?: boolean
  third_email?: string
  third_email_verified?: boolean
  phone?: string
  second_phone?: string
  third_phone?: string
  name?: string
  first_name?: string
  last_name?: string
  membership_number?: string
  /** Membership tier: new signups = silver; gold/platinum earned by purchases */
  membership_level?: MembershipLevel
  /** Raw API value (e.g. "Platinum Plus") — used for discount % when not overridden by numbers below */
  membership_tier_raw?: string
  /** Server override 0–100 */
  membership_discount_pct?: number
  /** Server override 0–1 */
  membership_discount_fraction?: number
  /** Loyalty/earned credits (points) */
  loyalty_credits?: number
  /** Total discount saved due to membership (e.g. in currency) */
  total_discount_earned?: number
  /** Number of orders — used for tier progression (e.g. gold after N, platinum after M) */
  orders_count?: number
  /** Total lifetime sales/purchases in AZN — Gold at 5000 AZN, Platinum at 10000 AZN */
  total_sales_azn?: number
  address_line1?: string
  address_line2?: string
  city?: string
  postcode?: string
  country?: string
  created_at?: string
  address?: string
  [key: string]: unknown
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export class AuthApiError extends Error {
  status: number
  code: 'INVALID_CREDENTIALS' | 'VALIDATION_ERROR' | 'CONFLICT' | 'AUTH_UNAVAILABLE'

  constructor(
    status: number,
    code: 'INVALID_CREDENTIALS' | 'VALIDATION_ERROR' | 'CONFLICT' | 'AUTH_UNAVAILABLE',
    message: string
  ) {
    super(message)
    this.status = status
    this.code = code
  }
}

export type SignupPayload = {
  first_name: string
  last_name: string
  phone: string
  second_phone?: string
  email?: string
  address_line1?: string
  address_line2?: string
  city?: string
  postcode?: string
  country?: string
  password: string
  confirmPassword: string
  /** Production host only — stored as customers.signup_host when API supports it */
  signup_host?: 'vorton.az' | 'vorton.uk'
}

function toPath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

function buildUrl(path: string) {
  return `${config.authApiUrl}${toPath(path)}`
}

function dedupePaths(paths: string[]) {
  return Array.from(new Set(paths.map(toPath)))
}

/** Returns the first string in obj that looks like a JWT (header.payload.signature). */
function findJwtInObject(obj: Record<string, unknown>): string | undefined {
  for (const value of Object.values(obj)) {
    if (typeof value === 'string' && value.length > 20 && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(value.trim())) {
      return value.trim()
    }
  }
  return undefined
}

function mapEmailVerifyCodeToMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'UNAUTHENTICATED':
      return 'Please sign in again.'
    case 'INVALID_EMAIL':
      return 'Invalid email address.'
    case 'INVALID_EMAIL_OR_CODE':
      return 'Invalid email or verification code.'
    case 'ACCOUNT_NOT_FOUND':
      return 'Account not found.'
    case 'EMAIL_TAKEN':
      return 'This email is already registered.'
    case 'NO_PENDING_EMAIL_CHANGE':
      return 'No pending verification. Please request a new code.'
    case 'PENDING_EMAIL_MISMATCH':
      return 'Email does not match pending verification.'
    case 'EMAIL_CODE_EXPIRED':
      return 'Code expired. Please request a new code.'
    case 'INVALID_VERIFICATION_CODE':
      return 'Invalid verification code.'
    case 'EMAIL_DELIVERY_UNAVAILABLE':
      return 'Email delivery is unavailable. Please try again later.'
    case 'EMAIL_CODE_COOLDOWN':
      return 'Please wait a bit before requesting another code.'
    case 'EMAIL_CODE_RATE_LIMIT':
      return 'Too many verification requests. Please try again later.'
    case 'EMAIL_CODE_SEND_FAILED':
      return 'Could not send verification code.'
    case 'EMAIL_CONFIRM_FAILED':
      return 'Could not confirm verification code.'
    default:
      return fallback
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text()
  if (!text) return ''
  const isHtml = /<\s*!?\s*DOCTYPE|<\s*html|<\s*pre\s*>/i.test(text)
  if (isHtml || text.includes('Cannot POST') || text.includes('Not Found')) return ''

  try {
    const j = JSON.parse(text) as {
      code?: unknown
      message?: unknown
      error?: unknown
      details?: unknown
      errors?: unknown
    }

    const code = typeof j.code === 'string' ? j.code : undefined

    let base = ''
    if (Array.isArray(j.errors)) {
      base = j.errors.filter((x): x is string => typeof x === 'string').join(', ')
    } else if (typeof j.errors === 'string') {
      base = j.errors
    } else if (typeof j.message === 'string') {
      base = j.message
    } else if (typeof j.error === 'string') {
      base = j.error
    } else if (typeof j.details === 'string') {
      base = j.details
    }

    return mapEmailVerifyCodeToMessage(code, base || '')
  } catch {
    return text.slice(0, 300)
  }
}

function pickFirstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = record[key]
    if (typeof v === 'string') {
      const t = v.trim()
      if (t) return t
    }
  }
  return undefined
}

function mergeUserAndMembership(
  userPayload: unknown,
  membershipPayload: unknown
): Record<string, unknown> {
  const userObj =
    userPayload && typeof userPayload === 'object' ? { ...(userPayload as Record<string, unknown>) } : {}
  if (!membershipPayload || typeof membershipPayload !== 'object') return userObj
  const m = membershipPayload as Record<string, unknown>

  // Keep user fields as base; prefer explicit membership service values when present.
  if (typeof m.name === 'string' && m.name.trim()) {
    userObj.membership_level = m.name
  }
  if (typeof m.membership_level === 'string' && m.membership_level.trim()) {
    userObj.membership_level = m.membership_level
  }
  if (typeof m.tier === 'string' && m.tier.trim()) {
    userObj.membership_level = m.tier
  }
  if (typeof m.discount_pct === 'number') {
    userObj.membership_discount_pct = m.discount_pct
  }
  if (typeof m.membership_discount_pct === 'number') {
    userObj.membership_discount_pct = m.membership_discount_pct
  }
  if (typeof m.discount_fraction === 'number') {
    userObj.membership_discount_fraction = m.discount_fraction
  }
  if (typeof m.membership_discount_fraction === 'number') {
    userObj.membership_discount_fraction = m.membership_discount_fraction
  }
  return userObj
}

function toAuthUser(user: unknown): AuthUser {
  if (!user || typeof user !== 'object') return { id: 'user' }
  const u = user as Record<string, unknown>
  const firstName = typeof u.first_name === 'string' ? u.first_name : ''
  const lastName = typeof u.last_name === 'string' ? u.last_name : ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  const addressLine1 = typeof u.address_line1 === 'string' ? u.address_line1 : ''
  const addressLine2 = typeof u.address_line2 === 'string' ? u.address_line2 : ''
  const city = typeof u.city === 'string' ? u.city : ''
  const postcode = typeof u.postcode === 'string' ? u.postcode : ''
  const country = typeof u.country === 'string' ? u.country : ''

  const secondEmail = pickFirstString(u, [
    'second_email',
    'secondEmail',
    'email_secondary',
  ])
  const thirdEmail = pickFirstString(u, ['third_email', 'thirdEmail', 'email_tertiary'])
  const secondPhone = pickFirstString(u, [
    'second_phone',
    'secondPhone',
    'second_mobile',
    'mobile_secondary',
  ])
  const thirdPhone = pickFirstString(u, [
    'third_phone',
    'thirdPhone',
    'third_mobile',
    'mobile_tertiary',
  ])

  const mapped: AuthUser = {
    ...(u as AuthUser),
    id: (u.id as string | number | undefined) ?? 'user',
    role:
      (u.role as UserRole) === 'manager'
        ? 'manager'
        : (u.role as UserRole) === 'employee'
          ? 'employee'
          : (u.role as UserRole) === 'customer'
            ? 'customer'
            : undefined,
    email: typeof u.email === 'string' ? u.email : undefined,
    email_verified:
      typeof u.email_verified === 'boolean'
        ? u.email_verified
        : typeof u.is_email_verified === 'boolean'
          ? u.is_email_verified
          : undefined,
    second_email: secondEmail,
    second_email_verified:
      typeof u.second_email_verified === 'boolean'
        ? u.second_email_verified
        : typeof u.secondEmailVerified === 'boolean'
          ? u.secondEmailVerified
          : undefined,
    third_email: thirdEmail,
    third_email_verified:
      typeof u.third_email_verified === 'boolean'
        ? u.third_email_verified
        : typeof u.thirdEmailVerified === 'boolean'
          ? u.thirdEmailVerified
          : undefined,
    phone:
      (typeof u.phone === 'string' ? u.phone : undefined) ??
      (typeof u.mobile === 'string' ? u.mobile : undefined) ??
      (typeof u.mobileNumber === 'string' ? u.mobileNumber : undefined),
    second_phone: secondPhone,
    third_phone: thirdPhone,
    name: fullName || (typeof u.fullName === 'string' ? u.fullName : undefined),
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    membership_number: typeof u.membership_number === 'string' ? u.membership_number : undefined,
    membership_tier_raw: typeof u.membership_level === 'string' ? u.membership_level : undefined,
    membership_discount_pct:
      typeof u.membership_discount_pct === 'number'
        ? u.membership_discount_pct
        : typeof u.membershipDiscountPct === 'number'
          ? u.membershipDiscountPct
          : undefined,
    membership_discount_fraction:
      typeof u.membership_discount_fraction === 'number'
        ? u.membership_discount_fraction
        : typeof u.membershipDiscountFraction === 'number'
          ? u.membershipDiscountFraction
          : undefined,
    membership_level: (() => {
      const ml = u.membership_level
      if (ml === 'platinum_plus' || ml === 'platinum' || ml === 'gold' || ml === 'silver') return ml
      if (typeof ml === 'string') {
        const k = ml
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')
        if (k === 'platinum_plus' || k === 'platinum+' || k === 'platinum-plus') return 'platinum_plus'
        if (k.startsWith('platinum')) return 'platinum'
        if (k === 'gold') return 'gold'
        if (k === 'silver') return 'silver'
      }
      return undefined
    })(),
    loyalty_credits:
      typeof u.reward_points_balance === 'number'
        ? u.reward_points_balance
        : typeof u.loyalty_credits === 'number'
          ? u.loyalty_credits
          : undefined,
    total_discount_earned: typeof u.total_discount_earned === 'number' ? u.total_discount_earned : undefined,
    orders_count: typeof u.orders_count === 'number' ? u.orders_count : undefined,
    total_sales_azn:
      typeof u.total_sales_azn === 'number'
        ? u.total_sales_azn
        : typeof u.total_purchases_azn === 'number'
          ? u.total_purchases_azn
          : typeof u.lifetime_spend_azn === 'number'
            ? u.lifetime_spend_azn
            : undefined,
    address_line1: addressLine1 || undefined,
    address_line2: addressLine2 || undefined,
    city: city || undefined,
    postcode: postcode || undefined,
    country: country || undefined,
    created_at: typeof u.created_at === 'string' ? u.created_at : undefined,
  }

  const compactAddress = [addressLine1, addressLine2, city, postcode, country]
    .filter(Boolean)
    .join(', ')
    .trim()
  if (compactAddress) mapped.address = compactAddress

  return mapped
}

async function requestWithFallback<T>(
  paths: string[],
  init: RequestInit,
  parse: (res: Response) => Promise<T>
): Promise<T> {
  const candidates = dedupePaths(paths)
  let lastError: unknown = null

  for (const path of candidates) {
    let res: Response
    try {
      res = await fetch(buildUrl(path), init)
    } catch {
      continue
    }

    if (res.ok) return parse(res)

    const message = (await readErrorMessage(res)) || ''
    if (res.status === 404 || res.status === 405) {
      lastError = new AuthApiError(res.status, 'AUTH_UNAVAILABLE', message || 'Endpoint not found')
      continue
    }

    if (res.status === 401 || res.status === 403) {
      throw new AuthApiError(
        res.status,
        'INVALID_CREDENTIALS',
        message || 'Invalid credentials'
      )
    }
    if (res.status === 409) {
      throw new AuthApiError(res.status, 'CONFLICT', message || 'Conflict')
    }
    if (res.status === 400) {
      throw new AuthApiError(res.status, 'VALIDATION_ERROR', message || 'Validation failed')
    }
    // 5xx, timeout, or other server/network failure — show unavailable
    throw new AuthApiError(
      res.status,
      'AUTH_UNAVAILABLE',
      message || 'Authentication service unavailable'
    )
  }

  if (lastError instanceof Error) throw lastError
  // No path responded OK (e.g. all 404 or network failed)
  throw new AuthApiError(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable')
}

export async function signup(payload: SignupPayload): Promise<LoginResponse> {
  const body: Record<string, unknown> = {
    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),
    phone: payload.phone.trim(),
    second_phone: payload.second_phone?.trim() || undefined,
    email: payload.email?.trim() || undefined,
    address_line1: payload.address_line1?.trim() || undefined,
    address_line2: payload.address_line2?.trim() || undefined,
    city: payload.city?.trim() || undefined,
    postcode: payload.postcode?.trim() || undefined,
    country: payload.country?.trim() || undefined,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  }
  if (payload.signup_host) body.signup_host = payload.signup_host

  const paths = [config.authSignUpPath, '/api/v1/auth/signup']
  return requestWithFallback(
    paths,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    async (res) => {
      const raw = (await res.json()) as Record<string, unknown>
      const data = (raw.data as Record<string, unknown> | undefined) ?? raw
      const token =
        (data.token as string | undefined) ??
        (data.access_token as string | undefined) ??
        (data.accessToken as string | undefined) ??
        (data.jwt as string | undefined) ??
        (data.authToken as string | undefined) ??
        (raw.token as string | undefined) ??
        (raw.access_token as string | undefined) ??
        (raw.accessToken as string | undefined) ??
        (raw.jwt as string | undefined) ??
        ''
      const userPayload = data.user ?? data.customer ?? raw.user ?? raw.customer
      return { token, user: toAuthUser(userPayload) }
    }
  )
}

/**
 * Login: expects JSON body with a token (JWT). No cookie or server-side session.
 * Reads response.token (or access_token, jwt, etc.), stores it, use Authorization: Bearer <token> for API calls.
 */
export async function login(emailOrPhone: string, password: string): Promise<LoginResponse> {
  const payload = {
    email: emailOrPhone.trim(),
    login: emailOrPhone.trim(),
    username: emailOrPhone.trim(),
    mobile: emailOrPhone.trim(),
    phone: emailOrPhone.trim(),
    password,
  }

  const paths = [config.authLoginPath, '/api/v1/auth/login']
  return requestWithFallback(
    paths,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    async (res) => {
      const parsed = await res.json()
      // Backend may return the JWT as a plain string body
      if (typeof parsed === 'string' && parsed.length > 0) {
        return { token: parsed.trim(), user: toAuthUser(undefined) }
      }
      const raw = parsed as Record<string, unknown>
      const data = (raw.data as Record<string, unknown> | undefined) ?? raw
      // Backend returns { "user": {...}, "token": "<jwt>" } on 200. Read token from body (no cookie/session).
      const token =
        (raw.token as string | undefined) ??
        (data.token as string | undefined) ??
        (raw.Token as string | undefined) ??
        (data.Token as string | undefined) ??
        (raw.access_token as string | undefined) ??
        (data.access_token as string | undefined) ??
        (raw.accessToken as string | undefined) ??
        (data.accessToken as string | undefined) ??
        (raw.jwt as string | undefined) ??
        (data.jwt as string | undefined) ??
        (raw.authToken as string | undefined) ??
        (data.authToken as string | undefined) ??
        findJwtInObject(raw) ??
        findJwtInObject(data) ??
        ''
      const userPayload = data.user ?? data.User ?? raw.user ?? raw.User ?? data.customer ?? raw.customer
      return { token, user: toAuthUser(userPayload) }
    }
  )
}

export async function getMe(token: string): Promise<AuthUser> {
  const paths = [config.authMePath, '/auth/me']
  return requestWithFallback(
    paths,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
    async (res) => {
      const data = (await res.json()) as Record<string, unknown> | unknown
      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>
        // GET /auth/me — { user, membership } from Node backend
        if ('user' in d && d.user != null) {
          return toAuthUser(mergeUserAndMembership(d.user, d.membership))
        }
      }
      return toAuthUser(data)
    }
  )
}

export type ProfileUpdatePayload = {
  first_name?: string
  last_name?: string
  /** Use `null` to clear optional fields on the server (omit key to leave unchanged). */
  email?: string | null
  second_email?: string | null
  third_email?: string | null
  phone?: string | null
  second_phone?: string | null
  third_phone?: string | null
  address_line1?: string
  address_line2?: string
  city?: string
  postcode?: string
  country?: string
  password?: string
  current_phone?: string
}

function buildProfileBody(payload: ProfileUpdatePayload): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  const keys: (keyof ProfileUpdatePayload)[] = [
    'first_name',
    'last_name',
    'email',
    'second_email',
    'third_email',
    'phone',
    'second_phone',
    'third_phone',
    'address_line1',
    'address_line2',
    'city',
    'postcode',
    'country',
    'password',
    'current_phone',
  ]
  for (const k of keys) {
    const v = payload[k]
    if (v === undefined) continue
    if (v === null) {
      body[k] = null
      continue
    }
    if (typeof v === 'string' && v !== '') {
      body[k] = v
    }
  }
  return body
}

/**
 * PATCH profile — Bearer token. Same contract as Vorton_app_mob (fallback paths).
 */
export async function updateProfile(token: string, payload: ProfileUpdatePayload): Promise<AuthUser> {
  const body = buildProfileBody(payload)
  if (Object.keys(body).length === 0) {
    return getMe(token)
  }
  const paths = [config.authProfilePath, '/api/v1/users/me', '/api/v1/auth/me', '/auth/profile']
  return requestWithFallback(
    paths,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    async (res) => {
      const raw = (await res.json()) as Record<string, unknown>
      const data = (raw.data as Record<string, unknown> | undefined) ?? raw
      const userPayload = data.user ?? data.customer ?? raw.user ?? raw.customer
      return toAuthUser(userPayload)
    }
  )
}

export async function requestEmailChangeCode(
    token: string,
    newEmail: string
): Promise<{ ok: boolean; error?: string; retryAfterSec?: number }> {
  const paths = [
    '/api/v1/auth/profile/email/request-code',
    '/api/v1/auth/email/change/request',
    '/auth/email/verify/request',
  ]

  for (const path of dedupePaths(paths)) {
    try {
      const res = await fetch(buildUrl(path), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail.trim(), new_email: newEmail.trim() }),
      })

      if (res.ok) return { ok: true }

      if (res.status === 404 || res.status === 405) continue

      const retryRaw = res.headers.get('Retry-After')
      const retryAfterSecParsed = retryRaw ? Number.parseInt(retryRaw, 10) : NaN
      const retryAfterSec =
          Number.isFinite(retryAfterSecParsed) && retryAfterSecParsed > 0 ? retryAfterSecParsed : undefined

      const msg = await readErrorMessage(res)
      return { ok: false, error: msg || res.statusText, retryAfterSec }
    } catch {
      // try next fallback path
    }
  }

  return { ok: false, error: 'EMAIL_CODE_UNAVAILABLE' }
}

export async function confirmEmailChange(token: string, newEmail: string, code: string): Promise<AuthUser> {
  const paths = [
    '/api/v1/auth/profile/email/confirm',
    '/api/v1/auth/email/change/confirm',
    '/auth/email/verify/confirm',
  ]
  return requestWithFallback(
    paths,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: newEmail.trim(),
        new_email: newEmail.trim(),
        code: code.trim(),
      }),
    },
    async (res) => {
      const raw = (await res.json()) as Record<string, unknown>
      const data = (raw.data as Record<string, unknown> | undefined) ?? raw
      const userPayload = data.user ?? raw.user ?? data
      return toAuthUser(userPayload)
    }
  )
}

/** Append-only delivery phone/address for checkout (does not replace saved profile). Returns log row id for linking to the order after payment. */
export async function appendCheckoutDelivery(
  token: string,
  payload: { phone: string; address: string }
): Promise<{ id: number }> {
  const paths = [config.authCheckoutDeliveryPath, '/api/v1/auth/checkout-delivery']
  return requestWithFallback(
    paths,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: payload.phone.trim(),
        address: payload.address.trim(),
      }),
    },
    async (res) => {
      const raw = (await res.json()) as { ok?: boolean; id?: number }
      const id = typeof raw.id === 'number' ? raw.id : Number(raw.id)
      if (!Number.isFinite(id) || id <= 0) {
        throw new Error('Invalid delivery log response from server')
      }
      return { id }
    }
  )
}
