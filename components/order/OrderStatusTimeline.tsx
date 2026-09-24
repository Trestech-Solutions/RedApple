'use client'

import { useMemo } from 'react'
import { Check, Clock, XCircle, Loader2, ChefHat, Bike, PackageCheck, ThumbsUp } from 'lucide-react'

type OrderStatus = string

export interface TimelineStep {
  key: string
  label: string
  dateTime?: string
  done: boolean
  active: boolean
  cancelled?: boolean
  icon?: 'clock' | 'check' | 'thumbsup' | 'chef' | 'bike' | 'package' | 'x'
}

export interface OrderStatusTimelineProps {
  status: OrderStatus
  /** ISO datetime string of the moment the order was placed. Used for the 1st-step timestamp. */
  createdAt?: string
  /** ISO datetime string of last update. Used as timestamp for the active step. */
  updatedAt?: string
  /** Extra css class for the outermost wrapper. */
  className?: string
}

/**
 * 6 possible statuses:
 *   pending | accepted | preparing | out_for_delivery | completed | cancelled
 *
 * Backend sends these exact lowercase values (snake_case for out_for_delivery).
 * "Out For Delivery" / "out for delivery" are normalised to out_for_delivery.
 */
type StepKey = 'pending' | 'accepted' | 'preparing' | 'out_for_delivery' | 'completed'

function normalizeStatus(raw: OrderStatus): StepKey | 'cancelled' {
  const s = (raw || '').toLowerCase().trim().replace(/\s+/g, '_')

  switch (s) {
    case 'cancelled':
    case 'cancel':
      return 'cancelled'
    case 'pending':
      return 'pending'
    case 'accepted':
    case 'confirmed': // backward-compat alias
      return 'accepted'
    case 'preparing':
      return 'preparing'
    case 'out_for_delivery':
    case 'out-for-delivery':
      return 'out_for_delivery'
    case 'completed':
    case 'delivered':
      return 'completed'
    default:
      return 'pending'
  }
}

function getStepsFromStatus(
  status: OrderStatus,
  createdAt?: string,
  updatedAt?: string,
): TimelineStep[] {
  const order: StepKey[] = [
    'pending',
    'accepted',
    'preparing',
    'out_for_delivery',
    'completed',
  ]

  const labels: Record<StepKey, string> = {
    pending:          'Order placed — waiting for confirmation',
    accepted:         'Order accepted',
    preparing:        'Preparing your order',
    out_for_delivery: 'Out for delivery',
    completed:        'Order completed',
  }

  const icons: Record<StepKey, TimelineStep['icon']> = {
    pending:          'clock',
    accepted:         'thumbsup',
    preparing:        'chef',
    out_for_delivery: 'bike',
    completed:        'package',
  }

  const normalized = normalizeStatus(status)
  const isCancelled = normalized === 'cancelled'

  if (isCancelled) {
    return [{
      key:       'cancelled',
      label:     'Order cancelled',
      dateTime:  updatedAt ?? createdAt,
      done:      false,
      active:    true,
      cancelled: true,
      icon:      'x',
    }]
  }

  const activeIdx = Math.max(0, order.indexOf(normalized))

  return order.map((s, i) => {
    const activeAtCurrent = i === activeIdx
    const done = i < activeIdx

    let dateTime: string | undefined
    if (i === 0) dateTime = createdAt
    else if (activeAtCurrent || (i === order.length - 1 && done)) dateTime = updatedAt ?? createdAt

    return {
      key:      s,
      label:    labels[s],
      dateTime,
      done,
      active:   activeAtCurrent,
      icon:     icons[s],
    }
  })
}

function fmtDateTime(iso?: string): { date: string; time: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return { date, time }
}

function StepIcon({ icon, tone }: { icon?: TimelineStep['icon']; tone: 'done' | 'active' | 'pending' | 'cancelled' }) {
  const size = 14
  switch (icon) {
    case 'clock':    return <Clock       size={size} className="block" />
    case 'check':    return <Check       size={size} className="block" />
    case 'thumbsup': return <ThumbsUp    size={size} className="block" />
    case 'chef':     return <ChefHat     size={size} className="block" />
    case 'bike':     return <Bike        size={size} className="block" />
    case 'package':  return <PackageCheck size={size} className="block" />
    case 'x':        return <XCircle     size={size} className="block" />
    default:
      return tone === 'active'
        ? <Loader2 size={size} className="block animate-spin" />
        : <Check   size={size} className="block" />
  }
}

export default function OrderStatusTimeline({
  status, createdAt, updatedAt, className = '',
}: OrderStatusTimelineProps) {
  const steps = useMemo(
    () => getStepsFromStatus(status, createdAt, updatedAt),
    [status, createdAt, updatedAt],
  )

  const firstFmted = fmtDateTime(createdAt ?? updatedAt)

  return (
    <div className={`space-y-5 ${className}`.trim()}>
      <div className="flex items-start justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-primary)] tracking-tight">
          Order Status
        </h2>
        {firstFmted && (
          <div className="text-right leading-tight">
            <p className="text-xs sm:text-sm text-neutral-500">{firstFmted.date}</p>
            <p className="text-xs sm:text-sm font-bold text-neutral-900">{firstFmted.time}</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes timelinePump {
          0%, 100% { transform: scale(1); }
          25%       { transform: scale(1.18); }
          45%       { transform: scale(1); }
          65%       { transform: scale(1.1); }
        }
      `}</style>

      <ol className="space-y-0">
        {steps.map((step, i) => {
          const tone: 'done' | 'active' | 'pending' | 'cancelled' = step.cancelled
            ? 'cancelled'
            : step.active
              ? 'active'
              : step.done
                ? 'done'
                : 'pending'

          const isLast = i === steps.length - 1

          // Per-step active colours
          const activeColorClass =
            step.key === 'pending'          ? 'bg-amber-400  text-white ring-4 ring-amber-100'
            : step.key === 'accepted'         ? 'bg-green-500  text-white ring-4 ring-green-100'
            : step.key === 'preparing'        ? 'bg-orange-500 text-white ring-4 ring-orange-100'
            : step.key === 'out_for_delivery' ? 'bg-blue-500   text-white ring-4 ring-blue-100'
            :                                   'bg-emerald-500 text-white ring-4 ring-emerald-100'

          const dotClass =
            tone === 'cancelled' ? 'bg-red-500 text-white ring-4 ring-red-100'
            : tone === 'done'      ? 'bg-black  text-white ring-4 ring-neutral-200'
            : tone === 'active'    ? `${activeColorClass} animate-[timelinePump_1.4s_ease-in-out_infinite]`
            :                        'bg-neutral-300 text-white ring-4 ring-neutral-100'

          const activeLabelColorClass =
            step.key === 'pending'          ? 'text-amber-600'
            : step.key === 'accepted'         ? 'text-green-600'
            : step.key === 'preparing'        ? 'text-orange-600'
            : step.key === 'out_for_delivery' ? 'text-blue-600'
            :                                   'text-emerald-600'

          const labelClass =
            tone === 'cancelled' ? 'text-red-600    font-semibold'
            : tone === 'done'      ? 'text-neutral-900 font-medium'
            : tone === 'active'    ? `${activeLabelColorClass} font-bold`
            :                        'text-neutral-400 font-medium'

          return (
            <li key={step.key}>
              <div className="flex items-center gap-4 py-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${dotClass}`}
                  aria-hidden
                >
                  <StepIcon icon={step.icon} tone={tone} />
                </span>
                <p className={`text-sm sm:text-base ${labelClass} flex-1`}>{step.label}</p>
              </div>
              {!isLast && (
                <div className="flex items-center gap-4">
                  <span className="ml-[13px] w-[2px] h-2 shrink-0 bg-neutral-200" />
                  <span className="text-neutral-300 select-none" aria-hidden>&mdash;</span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/**
 * Status banner shown below the timeline on the confirmation / my-orders pages.
 * Hidden for Pending and Cancelled.
 */
export function ApprovalBanner({
  status, orderNo, orderHref,
}: { status: OrderStatus; orderNo?: string | number; orderHref?: string }) {
  const normalized = normalizeStatus(status)
  if (normalized === 'pending' || normalized === 'cancelled') return null

  const heading =
    normalized === 'accepted'         ? 'Good news!'
    : normalized === 'preparing'        ? 'Your order is being prepared'
    : normalized === 'out_for_delivery' ? 'Your order is on its way!'
    : normalized === 'completed'        ? 'Order completed'
    : 'Order update'

  const body =
    normalized === 'accepted' ? (
      <>
        Your{' '}
        {orderHref ? (
          <a
            href={orderHref}
            className="underline text-neutral-900 font-semibold hover:text-black transition-colors"
          >
            order{orderNo ? ` #${orderNo}` : ''}
          </a>
        ) : (
          <span className="font-semibold text-neutral-800">
            order{orderNo ? ` #${orderNo}` : ''}
          </span>
        )}{' '}
        has been accepted!
      </>
    ) : normalized === 'preparing' ? (
      <>Our kitchen is currently preparing your delicious order.</>
    ) : normalized === 'out_for_delivery' ? (
      <>Your rider is on the way. Get ready to enjoy your meal!</>
    ) : normalized === 'completed' ? (
      <>
        Thank you for ordering! Your{' '}
        {orderHref ? (
          <a href={orderHref} className="underline text-neutral-900 font-semibold hover:text-black">
            order{orderNo ? ` #${orderNo}` : ''}
          </a>
        ) : (
          <span className="font-semibold">order{orderNo ? ` #${orderNo}` : ''}</span>
        )}{' '}
        has been delivered.
      </>
    ) : null

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-6 py-7 text-center shadow-sm">
      <h3 className="text-lg sm:text-xl font-bold text-neutral-800 mb-1">{heading}</h3>
      {body && (
        <p className="text-sm sm:text-base leading-7 text-neutral-500 max-w-md mx-auto">{body}</p>
      )}
    </div>
  )
}
