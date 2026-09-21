'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, XCircle, Star } from 'lucide-react'
import api from '@/api/axios'
import API_ENDPOINTS from '@/api/endpoint'
import type { Order } from '@/api/types'
import OrderStatusTimeline, { ApprovalBanner } from '@/components/order/OrderStatusTimeline'
import { useSubmitOrderFeedback } from '@/api/client/customer'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRs(value: string | number) {
  const n = parseFloat(String(value))
  return isNaN(n) ? String(value) : `Rs. ${Math.round(n).toLocaleString()}`
}

function capitalize(s: string) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function orderTypeLabel(type: string) {
  if (type === 'dinein')   return 'Dine-in'
  if (type === 'pickup')   return 'Pickup'
  if (type === 'delivery') return 'Delivery'
  return capitalize(type)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className="font-semibold text-neutral-800 text-right">{value}</span>
    </div>
  )
}

function PriceRow({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        bold ? 'font-bold text-neutral-900 border-t border-neutral-200 pt-3 mt-1' : 'text-sm'
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

// ─── Feedback form (shown when order is completed and no feedback yet) ────────

function FeedbackForm({ orderId, customerPhone }: { orderId: number; customerPhone: string }) {
  const [stars,   setStars]   = useState(0)
  const [hover,   setHover]   = useState(0)
  const [comment, setComment] = useState('')
  const [done,    setDone]    = useState(false)

  const { submitFeedback, isPending } = useSubmitOrderFeedback(orderId, {
    onSuccess: () => setDone(true),
  })

  if (done) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-1">
        <p className="text-lg">⭐</p>
        <p className="font-bold text-emerald-700">Thank you for your feedback!</p>
        <p className="text-sm text-emerald-600">Your review helps us improve.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
      <h3 className="font-bold text-neutral-800">How was your order?</h3>

      {/* Star picker */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={`transition-colors ${
                n <= (hover || stars)
                  ? 'fill-amber-400 stroke-amber-400'
                  : 'stroke-neutral-300 fill-transparent'
              }`}
            />
          </button>
        ))}
        {stars > 0 && (
          <span className="ml-2 text-sm font-semibold text-neutral-600">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][stars]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us more about your experience (optional)"
        rows={3}
        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700 outline-none focus:border-neutral-400 resize-none"
      />

      <button
        type="button"
        disabled={stars === 0 || isPending}
        onClick={() => submitFeedback({ customer_phone: customerPhone, stars, feed_back_comment: comment })}
        className="w-full rounded-xl py-3 text-sm font-bold text-[var(--color-secondary)] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-90"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {isPending ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const orderId      = searchParams.get('id')

  const [order,     setOrder]     = useState<Order | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [errorMsg,  setErrorMsg]  = useState('')

  // ── Fetch order on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) {
      setErrorMsg('No order ID provided.')
      setLoading(false)
      return
    }

    let cancelled = false

    api
      .get<Order>(API_ENDPOINTS.StorefrontOrders.detail(orderId))
      .then((res) => {
        if (!cancelled) setOrder(res.data)
      })
      .catch(() => {
        if (!cancelled) setErrorMsg('Could not load order details. Please check your order history.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [orderId])

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading order details…</p>
        </div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (errorMsg || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-neutral-700 font-semibold">{errorMsg || 'Order not found.'}</p>
          <Link
            href="/website/home"
            className="inline-block rounded-xl bg-[var(--color-primary)] text-[var(--color-secondary)] text-sm font-bold px-6 py-3 hover:brightness-90 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // ── Receipt ─────────────────────────────────────────────────────────────────
  const gt = parseFloat(order.grand_total) || 0

  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="mx-auto max-w-[1100px] w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* ── LEFT: Order Details ── */}
          <div className="space-y-5 min-w-0">

            {/* Grand-total header */}
            <div className="rounded-2xl bg-[var(--color-primary)] px-6 py-6 text-center text-[var(--color-secondary)] shadow">
              <p className="text-xs uppercase tracking-wider [color:color-mix(in_srgb,var(--color-secondary),transparent_40%)] mb-1">
                Order #{order.id} · Grand Total
              </p>
              <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {formatRs(order.grand_total)}
              </p>
            </div>

            {/* Details card */}
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight pt-2">
                Order details
              </h2>

              <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3 text-sm">
                <DetailRow label="Customer"   value={order.customer_name} />
                <DetailRow label="Phone"      value={order.customer_phone} />
                <DetailRow label="Order Type" value={orderTypeLabel(order.order_type)} />
                <DetailRow label="Branch"     value={order.branch_name ?? '—'} />
                {order.customer_address && (
                  <DetailRow label="Address"  value={order.customer_address} />
                )}
                <DetailRow label="Status"     value={capitalize(order.status)} />
              </div>

              {/* Products */}
              <div className="rounded-2xl bg-white p-6 shadow-sm divide-y divide-neutral-100">
                <h3 className="pb-3 font-bold text-neutral-800">Products</h3>
                {order.items.map((line, i) => {
                  const unitPrice = parseFloat(line.unit_price) || 0
                  const lineTotal = parseFloat(line.line_total)
                  const displayTotal = isNaN(lineTotal)
                    ? unitPrice * line.quantity
                    : lineTotal

                  // Group components by group_name for display
                  const compGroups = (line.components ?? []).reduce<
                    { groupName: string; entries: { name: string; qty: number }[] }[]
                  >((acc, c) => {
                    const last = acc[acc.length - 1]
                    if (last && last.groupName === c.group_name) {
                      last.entries.push({ name: c.item_name, qty: c.quantity })
                    } else {
                      acc.push({ groupName: c.group_name, entries: [{ name: c.item_name, qty: c.quantity }] })
                    }
                    return acc
                  }, [])

                  return (
                    <div
                      key={line.id ?? i}
                      className="py-2.5 text-sm"
                    >
                      {/* Item name + total */}
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-neutral-700">
                          {line.quantity} × {line.item_name}
                          {line.size_name ? ` (${line.size_name})` : ''}
                        </span>
                        <span className="font-semibold shrink-0">
                          {formatRs(displayTotal)}
                        </span>
                      </div>

                      {/* Deal components (fixed/on_spot selections) */}
                      {compGroups.length > 0 && (
                        <div className="mt-1.5 ml-4 space-y-1.5">
                          {compGroups.map((grp, gi) => (
                            <div key={gi}>
                              {grp.groupName && (
                                <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-0.5">
                                  ● {grp.groupName}
                                </p>
                              )}
                              <div className="space-y-0.5 pl-3 border-l-2 border-neutral-100">
                                {grp.entries.map((e, ei) => (
                                  <p key={ei} className="text-[11px] text-neutral-500">
                                    <span className="font-semibold">{e.qty}×</span> {e.name}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Regular item addons */}
                      {(line.addons ?? []).length > 0 && (
                        <div className="mt-1.5 ml-4 pl-3 border-l-2 border-neutral-100 space-y-0.5">
                          {line.addons.map((a) => (
                            <div key={a.id} className="flex items-center justify-between gap-2">
                              <p className="text-[11px] text-neutral-500">
                                <span className="font-semibold">{a.quantity}×</span> {a.addon_name}
                              </p>
                              {parseFloat(a.unit_price) > 0 && (
                                <span className="text-[11px] font-semibold text-amber-600 shrink-0">
                                  +{formatRs(parseFloat(a.unit_price) * a.quantity)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="rounded-2xl bg-white p-6 shadow-sm space-y-2 text-sm">
                <PriceRow
                  label="Subtotal"
                  value={formatRs(order.subtotal)}
                />
                {parseFloat(order.delivery_charge) > 0 && (
                  <PriceRow
                    label="Delivery Charge"
                    value={formatRs(order.delivery_charge)}
                  />
                )}
                {parseFloat(order.packaging_charge) > 0 && (
                  <PriceRow
                    label="Packaging Charge"
                    value={formatRs(order.packaging_charge)}
                  />
                )}
                {parseFloat(order.discount_total) > 0 && (
                  <PriceRow
                    label="Discount"
                    value={`− ${formatRs(order.discount_total)}`}
                  />
                )}
                <PriceRow
                  label="Grand Total"
                  value={formatRs(gt)}
                  bold
                />
              </div>
            </div>

            {/* Feedback form — shown once order is completed and no rating yet */}
            {order.status?.toLowerCase() === 'completed' && !order.stars && (
              <FeedbackForm orderId={order.id} customerPhone={order.customer_phone} />
            )}

            {/* Already reviewed — show the rating */}
            {order.stars != null && (
              <div className="rounded-2xl bg-white p-5 shadow-sm text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} size={20}
                      className={n <= (order.stars ?? 0) ? 'fill-amber-400 stroke-amber-400' : 'stroke-neutral-200 fill-transparent'} />
                  ))}
                </div>
                {order.feed_back_comment && (
                  <p className="text-sm text-neutral-500 italic">&ldquo;{order.feed_back_comment}&rdquo;</p>
                )}
              </div>
            )}

            <button
              onClick={() => router.push('/website/home')}
              className="w-full rounded-xl bg-[var(--color-primary)] py-4 text-sm font-bold text-[var(--color-secondary)] hover:brightness-90 transition-colors"
            >
              Place Another Order
            </button>
          </div>

          {/* ── RIGHT: Status Timeline (sticky) ── */}
          <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <OrderStatusTimeline
                status={order.status}
                createdAt={order.created_at}
                updatedAt={order.updated_at}
              />
            </div>
            <ApprovalBanner
              status={order.status}
              orderNo={order.id}
              orderHref="/website/profile/myOrders"
            />
          </div>

        </div>
      </div>
    </div>
  )
}
