import { config } from '../config'

export type MembershipLevel = 'silver' | 'gold' | 'platinum'

export type UserRole = 'customer' | 'employee' | 'manager'

export type AuthUser = {
  id: string | number
  role?: UserRole
  email?: string
  phone?: string
  name?: string
  first_name?: string
  last_name?: string
  membership_number?: string
  /** Membership tier: new signups = silver; gold/platinum earned by purchases */
  membership_level?: MembershipLevel
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

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text()
  if (!text) return ''
  const isHtml = /<\s*!?\s*DOCTYPE|<\s*html|<\s*pre\s*>/i.test(text)
  if (isHtml || text.includes('Cannot POST') || text.includes('Not Found')) return ''
  try {
    const j = JSON.parse(text) as {
      message?: string
      error?: string
      details?: string
      errors?: string[] | string
    }
    if (Array.isArray(j.errors)) return j.errors.join(', ')
    if (typeof j.errors === 'string') return j.errors
    return j.message ?? j.error ?? j.details ?? ''
  } catch {
    return text.slice(0, 300)
  }
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
    phone:
      (typeof u.phone === 'string' ? u.phone : undefined) ??
      (typeof u.mobile === 'string' ? u.mobile : undefined) ??
      (typeof u.mobileNumber === 'string' ? u.mobileNumber : undefined),
    name: fullName || (typeof u.fullName === 'string' ? u.fullName : undefined),
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    membership_number: typeof u.membership_number === 'string' ? u.membership_number : undefined,
    membership_level:
      (u.membership_level as 'silver' | 'gold' | 'platinum') === 'platinum'
        ? 'platinum'
        : (u.membership_level as 'silver' | 'gold') === 'gold'
          ? 'gold'
          : undefined,
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
  const body = {
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
      const data = (await res.json()) as { user?: unknown } | unknown
      const userData = typeof data === 'object' && data && 'user' in data ? (data as { user?: unknown }).user : data
      return toAuthUser(userData)
    }
  )
}
