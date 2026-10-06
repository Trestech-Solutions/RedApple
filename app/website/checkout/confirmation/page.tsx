'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, XCircle, Star, CheckCircle2,
  User, Phone, MapPin, Store, Truck, Calendar,
  ShoppingBag, CreditCard, Headphones,
  ChevronDown, ChevronUp, ArrowRight, Receipt,
  Copy, Check,
} from 'lucide-react'
import api from '@/api/axios'
import API_ENDPOINTS from '@/api/endpoint'
import type { Order } from '@/api/types'
import OrderStatusTimeline, { ApprovalBanner } from '@/components/order/OrderStatusTimeline'
import { useSubmitOrderFeedback } from '@/api/client/customer'
import { useStoreSettings } from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'

// ─── Theme tokens (driven by CSS variables) ───────────────────────────────────
// NOTE: class strings are written out in full so Tailwind's scanner picks them up.
// color-mix() is used instead of `/10` opacity, because opacity modifiers
// don't work on plain var() colors.

const P_BG         = 'bg-[color:var(--color-primary)]'
const P_BG_HOVER   = 'hover:bg-[color:color-mix(in_srgb,var(--color-primary)_88%,black)]'
const P_TEXT       = 'text-[color:var(--color-primary)]'
const P_SOFT       = 'bg-[color:color-mix(in_srgb,var(--color-primary)_10%,white)]'
const P_SOFT_HOVER = 'hover:bg-[color:color-mix(in_srgb,var(--color-primary)_10%,white)]'
const P_RING       = 'ring-[color:color-mix(in_srgb,var(--color-primary)_22%,white)]'
const P_BORDER     = 'border-[color:color-mix(in_srgb,var(--color-primary)_28%,white)]'
const P_BORDER_L   = 'border-l-[color:color-mix(in_srgb,var(--color-primary)_28%,white)]'
const P_SHADOW     = 'shadow-[0_10px_25px_-10px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]'
const P_FOCUS      = 'focus:border-[color:var(--color-primary)] focus:ring-[color:color-mix(in_srgb,var(--color-primary)_18%,white)]'

// gradients as inline styles (reliable with CSS variables)
const GRADIENT_HERO  = { background: 'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 70%, var(--color-primary)) 55%, var(--color-primary) 100%)' }
const GRADIENT_TOTAL = { background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary))' }

const SURFACE     = 'rounded-3xl bg-white ring-1 ring-gray-200/70 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]'
const BTN         = 'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40'
const BTN_PRIMARY = `${BTN} ${P_BG} ${P_BG_HOVER} ${P_SHADOW} text-white active:scale-[0.99]`
const BTN_OUTLINE = `${BTN} border border-gray-200 bg-white text-gray-700 ${P_SOFT_HOVER} hover:text-[color:var(--color-primary)] hover:border-[color:color-mix(in_srgb,var(--color-primary)_28%,white)]`

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
  return `${P_SOFT} ${P_TEXT} ${P_RING}`   // Accepted / Preparing / others → theme primary
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
    <section className={`${SURFACE} overflow-hidden`}>
      <div className="relative flex items-center gap-3 border-b border-gray-100 bg-gradient-to-b from-gray-50/70 to-white px-5 pb-4 pt-5 sm:px-6">
        {/* secondary accent bar */}
        <span
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full"
          style={{ background: 'var(--color-secondary)' }}
        />
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${P_SOFT} ${P_TEXT} ${P_RING}`}>
          {icon}
        </div>
        <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
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
    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
      {icon && (
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-100 ${P_TEXT}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        {children ?? (
          <p className="mt-0.5 break-words text-sm font-semibold text-gray-800">{value}</p>
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
    <div className="border-b border-gray-100 py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-7 min-w-8 shrink-0 items-center justify-center rounded-lg px-1.5 text-xs font-extrabold ring-1 ${P_SOFT} ${P_TEXT} ${P_RING}`}>
            {line.quantity}×
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {line.item_name}
              {line.size_name && (
                <span className="ml-1.5 text-xs font-normal text-gray-400">({line.size_name})</span>
              )}
            </p>
            {line.notes && (
              <p className="mt-1 text-xs italic text-gray-400">"{line.notes}"</p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold text-gray-900">{formatRs(displayTotal)}</span>
      </div>

      {hasExtras && (
        <div className="ml-11 mt-2">
          <button
            type="button"
            onClick={() => setShowExtras((p) => !p)}
            className={`flex items-center gap-1 text-xs font-semibold hover:opacity-80 ${P_TEXT}`}
          >
            {showExtras ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showExtras ? 'Hide' : 'Show'} Add-ons
          </button>

          {showExtras && (
            <div className="mt-2 space-y-2">
              {compGroups.map((grp, gi) => (
                <div key={gi}>
                  {grp.groupName && (
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      {grp.groupName}
                    </p>
                  )}
                  <div className={`space-y-0.5 border-l-2 pl-3 ${P_BORDER_L}`}>
                    {grp.entries.map((e, ei) => (
                      <p key={ei} className="text-[11px] text-gray-500">
                        <span className="font-semibold">{e.qty}×</span> {e.name}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {(line.addons ?? []).map((a) => (
                <div key={a.id} className={`flex items-center justify-between gap-2 border-l-2 pl-3 ${P_BORDER_L}`}>
                  <p className="text-[11px] text-gray-500">
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

  const overlay = 'fixed inset-0 z-[100] flex items-end justify-center bg-gray-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4'

  if (done) {
    return (
      <div className={overlay}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-dialog-title"
          tabIndex={-1}
          className="w-full max-w-md rounded-t-3xl bg-white p-7 text-center shadow-2xl outline-none sm:rounded-3xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
            <CheckCircle2 size={28} />
          </div>
          <h2 id="feedback-dialog-title" className="mt-4 text-lg font-bold text-gray-900">
            Thank you for your feedback!
          </h2>
          <p className="mt-1 text-sm text-gray-500">Your review helps us improve.</p>
          <button type="button" onClick={onContinue} className={`${BTN_PRIMARY} mt-6 w-full`}>
            Continue to order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={overlay}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl outline-none sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-8 ring-amber-50/60">
            <Star size={24} className="fill-amber-400" />
          </div>
          <h2 id="feedback-dialog-title" className="mt-4 text-lg font-bold text-gray-900">
            Rate Your Experience
          </h2>
          <p className="mt-1 text-sm text-gray-500">Share your feedback about this order.</p>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                aria-pressed={stars === n}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  size={34}
                  className={`transition-colors ${
                    n <= (hover || stars)
                      ? 'fill-amber-400 stroke-amber-400'
                      : 'fill-transparent stroke-gray-300'
                  }`}
                />
              </button>
            ))}
            {stars > 0 && (
              <span className="ml-2 text-sm font-semibold text-gray-600">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][stars]}
              </span>
            )}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience (optional)"
            rows={4}
            className={`w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-700 outline-none transition focus:bg-white focus:ring-4 sm:text-sm ${P_FOCUS}`}
          />
          <button
            type="button"
            disabled={stars === 0 || isPending}
            onClick={() => submitFeedback({ customer_phone: customerPhone, stars, feed_back_comment: comment })}
            className={`${BTN_PRIMARY} w-full`}
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
  const [copied,   setCopied]   = useState(false)

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

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable */ }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className={`h-8 w-8 animate-spin ${P_TEXT}`} />
          <p className="text-sm">Loading order details…</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className={`${SURFACE} w-full max-w-sm space-y-4 p-8 text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/60">
            <XCircle className="h-7 w-7 text-red-400" />
          </div>
          <p className="font-semibold text-gray-700">{errorMsg || 'Order not found.'}</p>
          <Link href="/website/home" className={`${BTN_PRIMARY} w-full`}>
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
  const orderNo      = getDisplayOrderNumber(order)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-14">
      <div className="mx-auto max-w-[1100px] px-3 pt-16 sm:px-4">

        {/* ── HERO ── */}
        <div
          className="relative mb-5 overflow-hidden rounded-3xl px-5 py-8 text-white shadow-xl sm:px-10 sm:py-10"
          style={GRADIENT_HERO}
        >
          {/* decoration */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-8 ring-white/20">
              <CheckCircle2 size={30} className="text-emerald-500" strokeWidth={2.5} />
            </div>
            <h1 className="mt-4 text-xl font-extrabold sm:text-2xl">
              Order placed successfully!
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Thank you, {order.customer_name?.split(' ')[0] || 'friend'}. We&apos;re on it.
            </p>

            {/* Order number + total */}
            <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 px-4 py-3.5 ring-1 ring-white/20 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Order Number</p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <p className="break-all font-mono text-xl font-extrabold tracking-wider sm:text-2xl">{orderNo}</p>
                  {orderNo !== 'Unavailable' && (
                    <button
                      type="button"
                      onClick={() => handleCopy(orderNo)}
                      aria-label="Copy order number"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3.5 ring-1 ring-white/20 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Grand Total</p>
                <p className="mt-1 text-xl font-extrabold sm:text-2xl">{formatRs(gt)}</p>
              </div>
            </div>

            {/* Quick meta chips */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
                <Truck size={12} /> {orderTypeLabel(order.order_type)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
                <Calendar size={12} /> {fmtDateTime(order.created_at)}
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm">
                {statusLabel(order.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_380px]">

          {/* ── RIGHT COLUMN — Timeline (first on mobile, sticky on desktop) ── */}
          <div className="order-first space-y-4 lg:sticky lg:top-6 lg:order-last lg:self-start">
            <div className={`${SURFACE} p-5 sm:p-6`}>
              <OrderStatusTimeline
                status={order.status}
                createdAt={order.created_at}
                updatedAt={order.updated_at}
              />
            </div>
            <ApprovalBanner
              status={order.status}
              orderNo={orderNo}
              orderHref="/website/profile/myOrders"
            />
          </div>

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

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
                <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment Type
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${P_SOFT} ${P_TEXT} ${P_RING}`}>
                    <CreditCard size={12} /> Cash on Delivery
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatRs(order.subtotal)}</span>
                </div>
                {hasDelivery && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Delivery Charge</span>
                    <span className="font-medium">{formatRs(order.delivery_charge)}</span>
                  </div>
                )}
                {hasPackaging && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
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
                <div
                  className="mt-3 flex items-center justify-between rounded-2xl px-4 py-4 text-base font-extrabold text-white shadow-lg"
                  style={GRADIENT_TOTAL}
                >
                  <span>Grand Total</span>
                  <span>{formatRs(gt)}</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard icon={<Headphones size={18} />} title="Need Support?">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Having an issue with your order?</p>
                  <p className="mt-0.5 text-xs text-gray-400">Our team is ready to help you.</p>
                </div>
                <div className="flex flex-col gap-2.5 min-[420px]:flex-row min-[420px]:items-center">
                  {supportPhone && (
                    <a href={`tel:${supportPhone}`} className={BTN_PRIMARY}>
                      <Phone size={14} /> Call Us
                    </a>
                  )}
                  <Link href="/website/contact" className={BTN_OUTLINE}>
                    <Headphones size={14} /> Contact
                  </Link>
                </div>
              </div>
            </SectionCard>

            {order.status?.toLowerCase() === 'completed' && !order.stars && !feedbackDismissed && (
              <FeedbackForm
                orderId={order.unique_order_number || order.id}
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
                          : 'fill-transparent stroke-gray-200'
                      }
                    />
                  ))}
                </div>
                {order.feed_back_comment && (
                  <p className="mt-3 text-sm italic text-gray-500">
                    &ldquo;{order.feed_back_comment}&rdquo;
                  </p>
                )}
              </SectionCard>
            )}

            {/* Bottom actions */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
              <button
                onClick={() => router.push('/website/home')}
                className={`${BTN_PRIMARY} group !py-4`}
              >
                Place Another Order
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
          
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}