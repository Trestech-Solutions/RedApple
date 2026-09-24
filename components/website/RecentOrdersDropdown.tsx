'use client'

/**
 * RecentOrdersDropdown
 *
 * Shows a "Recent Orders" button in the navbar that reveals a dropdown with
 * order IDs, live statuses, and links to the confirmation/detail page.
 * Only mounts when at least one order ID is stored in the cookie.
 */

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardList, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useRecentOrders } from '@/lib/hooks/useRecentOrders'

// ─── Status badge colours ─────────────────────────────────────────────────────

function statusColour(status: string): string {
  const s = (status || '').toLowerCase().trim().replace(/\s+/g, '_')
  if (s === 'pending')                           return 'bg-amber-100 text-amber-700'
  if (s === 'accepted' || s === 'confirmed')     return 'bg-green-100 text-green-700'
  if (s === 'preparing')                         return 'bg-orange-100 text-orange-700'
  if (s === 'out_for_delivery' ||
      s === 'out-for-delivery')                  return 'bg-blue-100 text-blue-700'
  if (s === 'completed' || s === 'delivered')    return 'bg-emerald-100 text-emerald-700'
  if (s === 'cancel' || s === 'rejected')     return 'bg-red-100 text-red-700'
  return 'bg-neutral-100 text-neutral-600'
}

/** Human-readable label for a status value */
function statusLabel(status: string): string {
  const s = (status || '').toLowerCase().trim().replace(/\s+/g, '_')
  if (s === 'pending')                          return 'Pending'
  if (s === 'accepted' || s === 'confirmed')    return 'Accepted'
  if (s === 'preparing')                        return 'Preparing'
  if (s === 'out_for_delivery' ||
      s === 'out-for-delivery')                 return 'Out For Delivery'
  if (s === 'completed' || s === 'delivered')   return 'Completed'
  if (s === 'cancel' || s === 'rejected')    return 'Cancelled'
  return capitalize(status)
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecentOrdersDropdownProps {
  /** Navbar background colour — used as the button background */
  navFg: string
  /** Foreground / icon colour — used as the button text/icon colour */
  iconTextColor: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecentOrdersDropdown({ navFg, iconTextColor }: RecentOrdersDropdownProps) {
  const { orders, isLoading, orderIds } = useRecentOrders()
  const [open, setOpen]         = useState(false)
  const containerRef            = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  // Don't render at all when no cookies stored
  if (orderIds.length === 0) return null

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Recent orders"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-semibold transition-opacity hover:opacity-90 sm:gap-1.5 sm:px-2.5 sm:py-2 sm:text-xs"
        style={{ backgroundColor: navFg, color: iconTextColor }}
      >
        <ClipboardList size={15} className="sm:hidden shrink-0" />
        <ClipboardList size={17} className="hidden sm:block shrink-0" />
        <span className="hidden sm:inline">Orders</span>
        {isLoading
          ? <Loader2 size={11} className="animate-spin opacity-60" />
          : open
            ? <ChevronUp  size={11} className="opacity-60" />
            : <ChevronDown size={11} className="opacity-60" />
        }
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Recent Orders</p>
            {isLoading && <Loader2 size={13} className="animate-spin text-neutral-400" />}
          </div>

          <ul className="max-h-80 divide-y divide-neutral-100 overflow-y-auto">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/website/checkout/confirmation?id=${order.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-900">
                      Order #{order.id}
                    </p>
                    {order.grand_total && order.grand_total !== '0' && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Rs. {Math.round(parseFloat(order.grand_total)).toLocaleString()}
                        {order.order_type ? ` · ${capitalize(order.order_type)}` : ''}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      order.status === 'unknown'
                        ? 'bg-neutral-100 text-neutral-400 italic normal-case'
                        : statusColour(order.status)
                    }`}
                  >
                    {order.status === 'unknown' ? '—' : statusLabel(order.status)}
                  </span>
                </Link>
              </li>
            ))}

            {/* Skeleton rows while loading (before first fetch resolves) */}
            {isLoading && orders.length === 0 &&
              orderIds.map((id) => (
                <li key={id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 animate-pulse rounded bg-neutral-100" />
                    <div className="h-2.5 w-16 animate-pulse rounded bg-neutral-100" />
                  </div>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
                </li>
              ))
            }
          </ul>

          {/* <div className="border-t border-neutral-100 px-4 py-2.5 text-center">
            <Link
              href="/website/profile/myOrders"
              onClick={() => setOpen(false)}
              className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              View all orders →
            </Link>
          </div> */}
        </div>
      )}
    </div>
  )
}
