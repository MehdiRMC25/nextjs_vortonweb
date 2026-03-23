import { config } from '../config'

export type OrderStatus = 'NEW' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED'

export interface OrderItem {
  name: string
  quantity: number
  price: number
  product_id?: string
  /** SKU–color code (e.g. VORT-TWHT) */
  sku_color?: string
  /** Size (e.g. S, M, L) */
  size?: string
  [key: string]: unknown
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: number
  customer_name: string
  mobile: string
  membership_level: 'silver' | 'gold' | 'platinum' | 'none'
  address: string | null
  items: OrderItem[]
  total_price: number
  status: OrderStatus
  order_date: string
  delivery_due_date: string | null
  delivered_at?: string | null
  created_at: string
  updated_at: string
  status_history?: OrderStatusHistoryEntry[]
}

export interface OrderStatsItem {
  status: OrderStatus
  count: number
}

/** Payload for manually creating an order (Sales page). Backend creates order with status NEW. If customer_id omitted, backend creates a new customer (name, mobile, address), uses the new id, attaches to mobile, persists in PostgreSQL, then creates the order. */
export interface CreateOrderPayload {
  /** Optional. If provided, link order to this customer; otherwise backend creates a new customer. */
  customer_id?: number
  customer_name: string
  mobile: string
  address?: string | null
  membership_level: Order['membership_level']
  order_date: string
  delivery_due_date?: string | null
  items: Array<{
    name: string
    quantity: number
    price: number
    sku_color?: string
    size?: string
    product_id?: string
  }>
}

const BASE = config.ordersApiBaseUrl

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export class OrdersApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function handleResponse<T>(res: Response, parse: () => Promise<T>): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    let message = 'Request failed'
    try {
      const j = JSON.parse(text) as { message?: string; error?: string }
      message = j.message ?? j.error ?? message
    } catch {
      if (text) message = text.slice(0, 200)
    }
    throw new OrdersApiError(message, res.status)
  }
  return parse()
}

/** GET /orders — employee, manager */
export async function getOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${BASE}/orders`, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  return handleResponse(res, async () => {
    const data = (await res.json()) as { orders?: Order[] }
    return Array.isArray(data.orders) ? data.orders : []
  })
}

/** GET /orders/stats — manager */
export async function getOrdersStats(token: string): Promise<OrderStatsItem[]> {
  const res = await fetch(`${BASE}/orders/stats`, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  return handleResponse(res, async () => {
    const data = (await res.json()) as { stats?: OrderStatsItem[] }
    return Array.isArray(data.stats) ? data.stats : []
  })
}

/** GET /orders/customer/:customerId — customer (own), employee, manager */
export async function getOrdersByCustomer(customerId: string | number, token: string): Promise<Order[]> {
  const res = await fetch(`${BASE}/orders/customer/${customerId}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  return handleResponse(res, async () => {
    const data = (await res.json()) as { orders?: Order[] }
    return Array.isArray(data.orders) ? data.orders : []
  })
}

/** GET /orders/:id — single order with status_history */
export async function getOrderById(orderId: string, token: string): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${orderId}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  })
  return handleResponse(res, () => res.json())
}

/** POST /orders — create order manually (Sales). Backend returns created order with status NEW. */
export async function createOrder(payload: CreateOrderPayload, token: string): Promise<Order> {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  return handleResponse(res, () => res.json())
}

/** PATCH /orders/:id/status — employee, manager */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  token: string
): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  })
  return handleResponse(res, () => res.json())
}
