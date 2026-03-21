import type { Order, OrderStatsItem } from '../api/orders'

/** Demo orders and stats for previewing the staff UI when the API has no data. Zeroed for real-order testing; structure kept. */
export const DEMO_ORDERS: Order[] = []

export const DEMO_STATS: OrderStatsItem[] = []

export function getDemoOrderById(id: string): Order | undefined {
  if (id.startsWith('demo-')) {
    const found = DEMO_ORDERS.find((o) => o.id === id)
    if (found) {
      return {
        ...found,
        status_history: [
          { status: found.status, created_at: found.created_at },
          ...(found.status !== 'NEW' ? [{ status: 'NEW' as const, created_at: found.created_at }] : []),
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      }
    }
  }
  return undefined
}
