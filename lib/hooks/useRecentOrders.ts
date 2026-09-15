'use client'

/**
 * useRecentOrders
 *
 * Manages a list of recently placed order IDs stored in a browser cookie
 * (`recent_order_ids`, comma-separated, max 5, 30-day TTL) and fetches the
 * latest status for each from the storefront orders API.
 *
 * Usage:
 *   const { orders, isLoading, addOrderId } = useRecentOrders()
 *
 *   // after a successful checkout:
 *   addOrderId(res.id)
 */

import { useState, useEffect, useCallback } from 'react'
import api from '@/api/axios'
import API_ENDPOINTS from '@/api/endpoint'
import type { Order } from '@/api/types'

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const COOKIE_KEY  = 'recent_order_ids'
const MAX_ORDERS  = 5
const TTL_DAYS    = 30

function readOrderIdsCookie(): number[] {
  if (typeof document === 'undefined') return []
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_KEY}=`))
  if (!match) return []
  return match
    .split('=')
    .slice(1)
    .join('=')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
}

function writeOrderIdsCookie(ids: number[]): void {
  if (typeof document === 'undefined') return
  const unique = Array.from(new Set(ids)).slice(0, MAX_ORDERS)
  const expires = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${COOKIE_KEY}=${unique.join(',')}; path=/; expires=${expires}; SameSite=Lax`
}

// ─── Public helpers (for use outside the hook, e.g. in onSuccess) ─────────────

/** Prepend an order ID to the cookie (call right after a successful checkout). */
export function appendOrderIdToCookie(id: number): void {
  const existing = readOrderIdsCookie()
  // Most recent first
  writeOrderIdsCookie([id, ...existing.filter((x) => x !== id)])
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface RecentOrderEntry {
  id: number
  status: string
  grand_total: string
  order_type: string
  created_at: string
}

interface UseRecentOrdersResult {
  /** Orders fetched from the API, most recent first. Empty while loading or if no IDs stored. */
  orders: RecentOrderEntry[]
  /** True while any order fetch is still in-flight. */
  isLoading: boolean
  /** IDs currently stored in the cookie (even before API responses arrive). */
  orderIds: number[]
  /** Prepend a new order ID to the cookie and immediately refresh the list. */
  addOrderId: (id: number) => void
}

export function useRecentOrders(): UseRecentOrdersResult {
  const [orderIds, setOrderIds] = useState<number[]>([])
  const [orders,   setOrders]   = useState<RecentOrderEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Read cookie on mount (client-only)
  useEffect(() => {
    setOrderIds(readOrderIdsCookie())
  }, [])

  // Whenever orderIds changes, fetch status for all of them
  useEffect(() => {
    if (orderIds.length === 0) {
      setOrders([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    Promise.allSettled(
      orderIds.map((id) =>
        api
          .get<Order>(API_ENDPOINTS.StorefrontOrders.detail(id))
          .then((r) => r.data)
      )
    ).then((results) => {
      if (cancelled) return
      const fetched: RecentOrderEntry[] = results
        .map((r, i) => {
          if (r.status === 'fulfilled') {
            const o = r.value
            return {
              id:          o.id,
              status:      o.status,
              grand_total: o.grand_total,
              order_type:  o.order_type,
              created_at:  o.created_at,
            }
          }
          // API returned an error for this ID — keep a stub so it still shows
          return {
            id:          orderIds[i],
            status:      'unknown',
            grand_total: '0',
            order_type:  '',
            created_at:  '',
          }
        })
        // Keep the same order as orderIds (most recent first)
        .sort((a, b) => orderIds.indexOf(a.id) - orderIds.indexOf(b.id))
      setOrders(fetched)
      setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [orderIds])

  const addOrderId = useCallback((id: number) => {
    appendOrderIdToCookie(id)
    setOrderIds(readOrderIdsCookie())
  }, [])

  return { orders, isLoading, orderIds, addOrderId }
}
