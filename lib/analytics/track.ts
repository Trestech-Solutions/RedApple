'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { BASE_URL } from '@/api/axios'
import { getRestaurantId } from '@/api/utils'
import { store } from '@/redux/store'

/**
 * First-party storefront tracking → POST /storefront/events/
 * Feeds the admin dashboard's Marketing tab (pages viewed, add to cart,
 * checkout attempts, returning visitors, funnel).
 *
 * Fire-and-forget: plain fetch with keepalive (survives navigation) and
 * never throws, so tracking can't break the site.
 */

export type TrackEvent = 'page_view' | 'add_to_cart' | 'checkout_start'

const VISITOR_KEY = 'trestech_visitor_id'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'v-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = newId()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    // storage blocked (private mode etc.) — still count the event
    return newId()
  }
}

export function track(event_type: TrackEvent, extra: { item_name?: string; quantity?: number } = {}) {
  if (typeof window === 'undefined') return
  try {
    const body = JSON.stringify({
      restaurant: Number(getRestaurantId()),
      branch: store.getState().order.branchId ?? null,
      visitor_id: getVisitorId(),
      event_type,
      path: window.location.pathname,
      ...extra,
    })
    fetch(`${BASE_URL}/storefront/events/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* no-op */
  }
}

/** One page_view per route change (guarded against StrictMode double effects). */
export function usePageViewTracking() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return
    lastPath.current = pathname
    track('page_view')
  }, [pathname])
}
