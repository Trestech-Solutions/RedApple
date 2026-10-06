'use client'

/**
 * useRecentOrders
 *
 * Manages a list of recently placed order references stored in a browser cookie
 * (`recent_order_ids`, comma-separated `unique_order_number` values, max 5,
 * 30-day TTL) and fetches the latest status for each from the storefront
 * orders API (which also keys off `unique_order_number`).
 *
 * Usage:
 *   const { orders, isLoading, addOrderRef } = useRecentOrders()
 *
 *   // after a successful checkout:
 *   addOrderRef(res.unique_order_number ?? String(res.id))
 */

import { useState, useEffect, useCallback } from 'react'
import api from '@/api/axios'
import API_ENDPOINTS from '@/api/endpoint'
import type { Order } from '@/api/types'

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const COOKIE_KEY  = 'recent_order_ids'
const MAX_ORDERS  = 5
const TTL_DAYS    = 30

/**
 * Cookie stores `unique_order_number` (10-char uppercase string) values.
 * Old cookies with numeric pk IDs are tolerated but we keep them as strings
 * so the API gets what's stored — only matching orders will resolve.
 */
function readOrderRefsCookie(): string[] {
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
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function writeOrderRefsCookie(refs: string[]): void {
  if (typeof document === 'undefined') return
  const unique = Array.from(new Set(refs)).slice(0, MAX_ORDERS)
  const expires = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${COOKIE_KEY}=${unique.join(',')}; path=/; expires=${expires}; SameSite=Lax`
}

// ─── Public helpers (for use outside the hook, e.g. in onSuccess) ─────────────

/** Prepend an order ref (unique_order_number preferred, stringified pk as fallback) to the cookie. */
export function appendOrderIdToCookie(orderRef: string | number): void {
  const ref = String(orderRef).trim()
  if (!ref) return
  const existing = readOrderRefsCookie()
  writeOrderRefsCookie([ref, ...existing.filter((x) => x !== ref)])
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface RecentOrderEntry {
  /** Primary identifier for lookups — unique_order_number (or numeric id for legacy cookies) */
  ref: string
  /** Numeric pk id — kept for profile/links that still use pk param naming */
  id: number
  order_number: string | null
  unique_order_number: string | null
  status: string
  grand_total: string
  order_type: string
  created_at: string
}

interface UseRecentOrdersResult {
  /** Orders fetched from the API, most recent first. Empty while loading or if no refs stored. */
  orders: RecentOrderEntry[]
  /** True while any order fetch is still in-flight. */
  isLoading: boolean
  /** Refs currently stored in the cookie (even before API responses arrive). */
  orderIds: string[]
  /** Prepend a new order ref to the cookie and immediately refresh the list. */
  addOrderId: (orderRef: string | number) => void
  /** Remove an order ref from the browser's recent-orders cookie. */
  removeOrderId: (orderRef: string | number) => void
  /** Clear all order refs from the browser's recent-orders cookie. */
  clearOrderIds: () => void
}

export function useRecentOrders(): UseRecentOrdersResult {
  const [orderIds, setOrderIds] = useState<string[]>([])
  const [orders,   setOrders]   = useState<RecentOrderEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setOrderIds(readOrderRefsCookie())
  }, [])

  useEffect(() => {
    if (orderIds.length === 0) {
      setOrders([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    Promise.allSettled(
      orderIds.map((ref) =>
        api
          .get<Order>(API_ENDPOINTS.StorefrontOrders.detail(ref))
          .then((r) => r.data)
      )
    ).then((results) => {
      if (cancelled) return
      const fetched: RecentOrderEntry[] = results
        .map((r, i) => {
          if (r.status === 'fulfilled') {
            const o = r.value
            return {
              ref:                  o.unique_order_number ?? orderIds[i]!,
              id:                   o.id,
              order_number:         o.order_number ?? null,
              unique_order_number:  o.unique_order_number ?? null,
              status:               o.status,
              grand_total:          o.grand_total,
              order_type:           o.order_type,
              created_at:           o.created_at,
            }
          }
          return {
            ref:                 orderIds[i]!,
            id:                  Number.isFinite(Number(orderIds[i])) ? Number(orderIds[i]) : 0,
            order_number:        null,
            unique_order_number: null,
            status:              'unknown',
            grand_total:         '0',
            order_type:          '',
            created_at:          '',
          }
        })
        .sort((a, b) => orderIds.indexOf(a.ref) - orderIds.indexOf(b.ref))
      setOrders(fetched)
      setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [orderIds])

  const addOrderId = useCallback((orderRef: string | number) => {
    appendOrderIdToCookie(orderRef)
    setOrderIds(readOrderRefsCookie())
  }, [])

  const removeOrderId = useCallback((orderRef: string | number) => {
    const ref = String(orderRef)
    const remaining = readOrderRefsCookie().filter((x) => x !== ref)
    writeOrderRefsCookie(remaining)
    setOrderIds(remaining)
  }, [])

  const clearOrderIds = useCallback(() => {
    writeOrderRefsCookie([])
    setOrderIds([])
  }, [])

  return { orders, isLoading, orderIds, addOrderId, removeOrderId, clearOrderIds }
}
