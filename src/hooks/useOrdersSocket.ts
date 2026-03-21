import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { config } from '../config'

/**
 * Connects to the orders backend Socket.io and calls onOrderEvent when order_created or order_status_updated fire.
 * Pass a stable callback (e.g. from useCallback) to refetch orders or merge payload.
 */
export function useOrdersSocket(onOrderEvent: () => void) {
  const socketRef = useRef<Socket | null>(null)
  const callbackRef = useRef(onOrderEvent)
  callbackRef.current = onOrderEvent

  useEffect(() => {
    const origin = config.socketIoOrigin
    if (!origin) return
    try {
      const socket = io(origin, { autoConnect: true })
      socketRef.current = socket
      const handler = () => callbackRef.current()
      socket.on('order_created', handler)
      socket.on('order_status_updated', handler)
      return () => {
        socket.off('order_created', handler)
        socket.off('order_status_updated', handler)
        socket.disconnect()
        socketRef.current = null
      }
    } catch {
      return undefined
    }
  }, [])
}
