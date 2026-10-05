'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, XCircle, Star, CheckCircle2,
  User, Phone, MapPin, Store, Truck, Calendar,
  ShoppingBag, CreditCard, Headphones,
  ChevronDown, ChevronUp, ArrowRight, Receipt,
} from 'lucide-react'
import api from '@/api/axios'
import API_ENDPOINTS from '@/api/endpoint'
import type { Order } from '@/api/types'
import OrderStatusTimeline, { ApprovalBanner } from '@/components/order/OrderStatusTimeline'
import { useSubmitOrderFeedback } from '@/api/client/customer'
import { useStoreSettings } from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRs(value: string | number) {
  const n = parseFloat(String(value))
  return isNaN(n) ? String(value) : `Rs. ${Math.round(n).toLocaleString()}`
}

function getDisplayOrderNumber(order: Order): string {
  return order.order_no || order.order_number || order.unique_order_number || 'Unavailable'
}

function capitalize(s: string) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function statusLabel(status: string): string {
  const s = (status || '').toLowerCase().trim().replace(/\s+/g, '_')
  if (s === 'pending')                                      return 'Pending'
  if (s === 'accepted' || s === 'confirmed')                return 'Accepted'
  if (s === 'preparing')                                    return 'Preparing'
  if (s === 'out_for_delivery' || s === 'out-for-delivery') return 'Out For Delivery'
  if (s === 'completed' || s === 'delivered')               return 'Completed'
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel' || s === 'rejected') return 'Cancelled'
  return capitalize(status)
}

function statusClasses(status: string): string {
  const label = statusLabel(status)
  if (label === 'Completed')        return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (label === 'Cancelled')        return 'bg-red-50 text-red-600 ring-red-200'
  if (label === 'Pending')          return 'bg-amber-50 text-amber-700 ring-amber-200'
  if (label === 'Out For Delivery') return 'bg-sky-50 text-sky-700 ring-sky-200'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
}

function orderTypeLabel(type: string) {
  if (type === 'dinein')   return 'Dine-in'
  if (type === 'pickup')   return 'Pickup'
  if (type === 'delivery') return 'Delivery'
  return capitalize(type)
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl bg-white shadow-[0_2px_20px_-6px_rgba(0,0,0,0.08)] ring-1 ring-black/5 overflow-hidden">
      <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-neutral-100">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </div>
        <h3 className="text-[15px] font-bold text-neutral-900">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

// ─── Info item (label above value) ────────────────────────────────────────────

function InfoItem({
  label,
  value,
  icon,
  children,
}: {
  label: string
  value?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
      {icon && <span className="mt-0.5 shrink-0 text-emerald-600">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
        {children ?? (
          <p className="mt-0.5 text-sm font-semibold text-neutral-800 break-words">{value}</p>
        )}
      </div>
    </div>
  )
}

// ─── Product line item ────────────────────────────────────────────────────────

function ProductLine({ line }: { line: Order['items'][number] }) {
  const [showExtras, setShowExtras] = useState(false)

  const unitPrice    = parseFloat(line.unit_price) || 0
  const lineTotal    = parseFloat(line.line_total)
  const displayTotal = isNaN(lineTotal) ? unitPrice * line.quantity : lineTotal

  const hasExtras = (line.addons?.length ?? 0) > 0 || (line.components?.length ?? 0) > 0

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
    <div className="py-4 border-b border-neutral-100 last:border-0 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 px-1.5 text-xs font-extrabold text-emerald-700">
            {line.quantity}×
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">
              {line.item_name}
              {line.size_name && (
                <span className="ml-1.5 text-xs font-normal text-neutral-400">({line.size_name})</span>
              )}
            </p>
            {line.notes && (
              <p className="mt-1 text-xs italic text-neutral-400">"{line.notes}"</p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold text-neutral-900">{formatRs(displayTotal)}</span>
      </div>

      {hasExtras && (
        <div className="mt-2 ml-10">
          <button
            type="button"
            onClick={() => setShowExtras((p) => !p)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {showExtras ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showExtras ? 'Hide' : 'Show'} Add-ons
          </button>

          {showExtras && (
            <div className="mt-2 space-y-2">
              {compGroups.map((grp, gi) => (
                <div key={gi}>
                  {grp.groupName && (
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                      {grp.groupName}
                    </p>
                  )}
                  <div className="space-y-0.5 border-l-2 border-emerald-100 pl-3">
                    {grp.entries.map((e, ei) => (
                      <p key={ei} className="text-[11px] text-neutral-500">
                        <span className="font-semibold">{e.qty}×</span> {e.name}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {(line.addons ?? []).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 border-l-2 border-emerald-100 pl-3">
                  <p className="text-[11px] text-neutral-500">
                    <span className="font-semibold">{a.quantity}×</span> {a.addon_name}
                  </p>
                  {parseFloat(a.unit_price) > 0 && (
                    <span className="shrink-0 text-[11px] font-semibold text-amber-600">
                      +{formatRs(parseFloat(a.unit_price) * a.quantity)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Feedback form ────────────────────────────────────────────────────────────

function FeedbackForm({
  orderId,
  customerPhone,
  onContinue,
}: {
  orderId: number
  customerPhone: string
  onContinue: () => void
}) {
  const [stars,   setStars]   = useState(0)
  const [hover,   setHover]   = useState(0)
  const [comment, setComment] = useState('')
  const [done,    setDone]    = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const { submitFeedback, isPending } = useSubmitOrderFeedback(orderId, {
    onSuccess: () => setDone(true),
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    function preventDismissal(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), textarea:not(:disabled)'
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        event.preventDefault()
        dialogRef.current.focus()
      } else if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialogRef.current)
      ) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', preventDismissal)
    return () => {
      document.removeEventListener('keydown', preventDismissal)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [])

  if (done) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/55 p-4 backdrop-blur-md">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-dialog-title"
          tabIndex={-1}
          className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl outline-none"
        >
          <p className="text-3xl">⭐</p>
          <h2 id="feedback-dialog-title" className="mt-2 font-bold text-emerald-700">
            Thank you for your feedback!
          </h2>
          <p className="mt-1 text-sm text-emerald-600">Your review helps us improve.</p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Continue to order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/55 p-4 backdrop-blur-md">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl outline-none sm:p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <Star size={23} />
          </div>
          <h2 id="feedback-dialog-title" className="mt-3 text-lg font-bold text-neutral-900">
            Rate Your Experience
          </h2>
          <p className="mt-1 text-sm text-neutral-500">Share your feedback about this order.</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                aria-pressed={stars === n}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={32}
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
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience (optional)"
            rows={4}
            className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
          <button
            type="button"
            disabled={stars === 0 || isPending}
            onClick={() => submitFeedback({ customer_phone: customerPhone, stars, feed_back_comment: comment })}
            className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {isPending ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const orderId      = searchParams.get('id')
  const { settings } = useStoreSettings()
  const { branchPhone } = useStoreLocation()

  const [order,    setOrder]    = useState<Order | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [feedbackDismissed, setFeedbackDismissed] = useState(false)

  const supportPhone =
    branchPhone ||
    (settings as any).branch_phone ||
    (settings.phone_icon_type !== 'none' ? '021-111-022-022' : null)

  useEffect(() => {
    if (!orderId) {
      setErrorMsg('No order ID provided.')
      setLoading(false)
      return
    }
    let cancelled = false
    api
      .get<Order>(API_ENDPOINTS.StorefrontOrders.detail(orderId))
      .then((res) => { if (!cancelled) setOrder(res.data) })
      .catch(() => { if (!cancelled) setErrorMsg('Could not load order details.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [orderId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm">Loading order details…</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="font-semibold text-neutral-700">{errorMsg || 'Order not found.'}</p>
          <Link
            href="/website/home"
            className="inline-block rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const gt           = parseFloat(order.grand_total) || 0
  const hasDiscount  = parseFloat(order.discount_total) > 0
  const hasDelivery  = parseFloat(order.delivery_charge) > 0
  const hasPackaging = parseFloat(order.packaging_charge) > 0

  return (
    <div className="min-h-screen bg-neutral-50 pb-14">
      <div className="mx-auto max-w-[1100px] px-4 pt-16">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_380px]">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Success header card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 text-center text-white shadow-lg shadow-emerald-600/20">
              <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -right-12 h-56 w-56 rounded-full bg-teal-300/20 blur-3xl" />

              <div className="relative">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md">
                  <CheckCircle2 size={28} className="text-emerald-500" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-semibold text-white/90">
                  Order placed successfully. Thank you, {order.customer_name?.split(' ')[0] || 'friend'}!
                </p>

                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Your Order Number
                </p>
                <p className="mt-1 font-mono text-3xl font-extrabold tracking-widest sm:text-4xl">
                  {getDisplayOrderNumber(order)}
                </p>

                <div className="mx-auto my-4 h-px w-24 bg-white/30" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Grand Total
                </p>
                <p className="mt-1 text-3xl font-extrabold sm:text-4xl">{formatRs(gt)}</p>
              </div>
            </div>

            <SectionCard icon={<User size={18} />} title="Customer Information">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoItem label="Full Name" icon={<User size={14} />} value={order.customer_name} />
                <InfoItem label="Mobile" icon={<Phone size={14} />} value={order.customer_phone} />
              </div>
            </SectionCard>

            <SectionCard icon={<Truck size={18} />} title="Delivery Information">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {order.customer_address && (
                  <InfoItem label="Address" icon={<MapPin size={14} />} value={order.customer_address} />
                )}
                {order.customer_landmark && (
                  <InfoItem label="Landmark" icon={<MapPin size={14} />} value={order.customer_landmark} />
                )}
                {order.customer_city && (
                  <InfoItem label="City" icon={<MapPin size={14} />} value={order.customer_city} />
                )}
                <InfoItem label="Branch" icon={<Store size={14} />} value={order.branch_name ?? '—'} />
                <InfoItem label="Order Type" icon={<Truck size={14} />} value={orderTypeLabel(order.order_type)} />
                <InfoItem label="Order Date" icon={<Calendar size={14} />} value={fmtDateTime(order.created_at)} />
                <InfoItem label="Status" icon={<ShoppingBag size={14} />}>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${statusClasses(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </InfoItem>
                {order.customer_instructions && (
                  <div className="sm:col-span-2">
                    <InfoItem label="Instructions" value={order.customer_instructions} />
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard icon={<ShoppingBag size={18} />} title="Your Order">
              <div>
                {order.items.map((line, i) => (
                  <ProductLine key={line.id ?? i} line={line} />
                ))}
              </div>
            </SectionCard>

            <SectionCard icon={<Receipt size={18} />} title="Payment & Summary">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-3 border-b border-dashed border-neutral-200">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Payment Type
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    <CreditCard size={12} /> Cash on Delivery
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatRs(order.subtotal)}</span>
                </div>
                {hasDelivery && (
                  <div className="flex items-center justify-between text-sm text-neutral-600">
                    <span>Delivery Charge</span>
                    <span className="font-medium">{formatRs(order.delivery_charge)}</span>
                  </div>
                )}
                {hasPackaging && (
                  <div className="flex items-center justify-between text-sm text-neutral-600">
                    <span>Packaging Charge</span>
                    <span className="font-medium">{formatRs(order.packaging_charge)}</span>
                  </div>
                )}
                {hasDiscount && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span className="font-semibold">− {formatRs(order.discount_total)}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3.5 text-base font-extrabold text-emerald-700">
                  <span>Grand Total</span>
                  <span>{formatRs(gt)}</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={<Headphones size={18} />} title="Need Support?">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-800">Having an issue with your order?</p>
                  <p className="mt-0.5 text-xs text-neutral-400">Our team is ready to help you.</p>
                </div>
                <div className="flex items-center gap-3">
                  {supportPhone && (
                    <a
                      href={`tel:${supportPhone}`}
                      className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      <Phone size={14} /> Call Us
                    </a>
                  )}
                  <Link
                    href="/website/contact"
                    className="flex items-center gap-2 rounded-2xl border border-neutral-200 px-5 py-2.5 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <Headphones size={14} /> Contact
                  </Link>
                </div>
              </div>
            </SectionCard>

            {order.status?.toLowerCase() === 'completed' && !order.stars && !feedbackDismissed && (
              <FeedbackForm
                orderId={order.id}
                customerPhone={order.customer_phone}
                onContinue={() => setFeedbackDismissed(true)}
              />
            )}
            {order.stars != null && (
              <SectionCard icon={<Star size={18} />} title="Your Review">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={22}
                      className={
                        n <= (order.stars ?? 0)
                          ? 'fill-amber-400 stroke-amber-400'
                          : 'stroke-neutral-200 fill-transparent'
                      }
                    />
                  ))}
                </div>
                {order.feed_back_comment && (
                  <p className="mt-3 text-sm italic text-neutral-500">
                    &ldquo;{order.feed_back_comment}&rdquo;
                  </p>
                )}
              </SectionCard>
            )}

            <button
              onClick={() => router.push('/website/home')}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Place Another Order
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* ── RIGHT COLUMN — Status Timeline (sticky) ── */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl bg-white p-6 shadow-[0_2px_20px_-6px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
              <OrderStatusTimeline
                status={order.status}
                createdAt={order.created_at}
                updatedAt={order.updated_at}
              />
            </div>
            <ApprovalBanner
              status={order.status}
              orderNo={getDisplayOrderNumber(order)}
              orderHref="/website/profile/myOrders"
            />
          </div>

        </div>
      </div>
    </div>
  )
}