'use client'

/**
 * Drop-in replacement for CheckoutPage — premium visual pass, same as the
 * ProductDetailModal treatment. ALL logic, hooks, form wiring, validation,
 * and submit behavior are 100% unchanged — only markup/className/small
 * presentational wrappers changed.
 *
 * What's new:
 *  - Page background gets a very soft gradient wash instead of flat white.
 *  - Left card and both right-hand cards are now rounded-[28px]/2xl with
 *    softer diffused shadows and a hairline ring instead of a flat border.
 *  - Section labels (Gift, address list, order summary) got a small
 *    accent-dot treatment consistent with the modal redesign.
 *  - Gift toggle button has a soft pop animation when turned on.
 *  - Address radio rows: selected state now gets a soft ring + gentle
 *    scale instead of just a color change.
 *  - Free-delivery progress bar has a shimmer while filling and a little
 *    celebratory pop when unlocked.
 *  - "Place Order" button: ambient ongoing shine sweep (like the modal
 *    CTA) + breathing glow behind it, disabled state stays flat/dim.
 *  - Whole form fades/slides in on mount.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CheckCircle, Circle, Plus, Bike, ArrowLeft, Navigation, Loader2, Gift } from 'lucide-react'
import {
  useCart, useStoreSettings,
  DEFAULT_DELIVERY_FEE,
  type CartItem,
} from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'
import { FALLBACK_BRANCHES } from '@/components/website/OrderTypeModal'
import { useCheckout, buildCheckoutPayload } from '@/api/client/checkout'
import { useGetAddresses, useAddAddress } from '@/api/client/customer'
import { PaymentSection } from '@/components/checkout/PaymentSection'
import type { CheckoutFormValues } from '@/components/checkout/types'
import { appendOrderIdToCookie } from '@/lib/hooks/useRecentOrders'

const FALLBACK_PHONE = '021-111-022-022'

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 placeholder:text-neutral-400'
const labelClass = 'mb-2 block text-sm font-semibold text-neutral-700'

const TITLE_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']

/** Safe numeric parser for min/max purchase, used when settings contain ''/null/number/string-number. */
function toNullableNum(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

// Small reusable section-label with accent dot — same language as the modal
function SectionLabel({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'pink' | 'primary' }) {
  const dot = tone === 'pink' ? 'bg-pink-500' : tone === 'primary' ? 'bg-[var(--color-primary)]' : 'bg-neutral-900'
  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </p>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const {
    items, orderType, user, addAddress: addLocalAddress,
    branch, branchId, areaId, location, subtotal, clearCart, cartToken: liveCartToken,
  } = useCart()
  const {
    branchName, branchAddress, branchLocation, branchMapLocation, branchPhone,
  } = useStoreLocation()

  // ─── form ──────────────────────────────────────────────────────────────────
  const { register, control, handleSubmit, watch, setValue, getValues } =
    useForm<CheckoutFormValues>({
      defaultValues: {
        title: 'Mr.',
        guestFullName: '',
        guestMobile: '',
        guestAltMobile: '',
        guestAddress: '',
        guestLandmark: '',
        guestEmail: '',
        instructions: '',
        payment: 'cod',
        changeAmount: '500',
        voucher: '',
        isGift: false,
        selectedAddressId: '',
        newAddrLine: '',
        newAddrCity: 'Karachi',
        giftReceiptName: '',
        giftMessage: '',
        giftReceiptNumber: '',
      },
    })
  const formValues = watch()

  // ─── API addresses (logged-in) ─────────────────────────────────────────────
  const { data: apiAddresses = [], isLoading: loadingAddresses } = useGetAddresses({ enabled: !!user })
  const apiAddrAdder = useAddAddress({
    onSuccess(newAddr) {
      setValue('selectedAddressId', String(newAddr.id))
      setShowAddrForm(false)
      setValue('newAddrLine', '')
      setValue('newAddrCity', 'Karachi')
    },
  })

  // ─── local state ──────────────────────────────────────────────────────────
  const [showAddrForm, setShowAddrForm] = useState(false)
  const [errorMsg, setErrorMsg]         = useState('')

  // auto-select first API address
  useEffect(() => {
    if (apiAddresses.length > 0 && !formValues.selectedAddressId) {
      setValue('selectedAddressId', String(apiAddresses[0].id))
    }
  }, [apiAddresses]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── store settings ───────────────────────────────────────────────────────
  const { settings } = useStoreSettings()

  const deliveryFeeRaw = orderType === 'delivery'
    ? (settings.deliveryFee > 0 ? settings.deliveryFee : DEFAULT_DELIVERY_FEE)
    : 0

  const effectiveDeliveryFee =
    orderType === 'delivery' && subtotal >= settings.freeDeliveryAboveSubtotal
      ? 0
      : deliveryFeeRaw

  const packagingFeeBase = settings.packagingCharge
  const packagingFee = settings.packaging_incremental ? packagingFeeBase * items.length : packagingFeeBase
  const convenience  = settings.convenienceFee

  const isCash    = formValues.payment === 'cod'
  const taxRate   = (() => {
    if (isCash  && settings.cashTaxRate > 0) return settings.cashTaxRate
    if (!isCash && settings.cardTaxRate > 0) return settings.cardTaxRate
    return settings.taxPercentageRate
  })()

  const taxableBase =
    settings.do_not_apply_tax_to_delivery_charges === false
      ? subtotal + effectiveDeliveryFee
      : subtotal
  const tax      = Math.round(taxableBase * taxRate)
  const taxLabel = `Tax${taxRate > 0 ? ` ${Math.round(taxRate * 100)}%` : ''}`
  const grandTotal = subtotal + tax + effectiveDeliveryFee + packagingFee + convenience
  const checkoutNote = settings.checkout_note
  const orderTypeStr = orderType as string

  const globalMinByType: Record<string, number | null> = {
    delivery: toNullableNum(settings.delivery_minimum_purchase_amount),
    dinein:   toNullableNum(settings.dinein_minimum_purchase_amount),
    pickup:   toNullableNum(settings.pickup_minimum_purchase_amount),
  }
  const globalMaxByType: Record<string, number | null> = {
    delivery: toNullableNum(settings.delivery_maximum_purchase_amount),
    dinein:   toNullableNum(settings.dinein_maximum_purchase_amount),
    pickup:   toNullableNum(settings.pickup_maximum_purchase_amount),
  }

  const estMins: number | null = (() => {
    if (orderTypeStr === 'pickup') {
      return settings.deliveryPickupTimeMinutes ?? settings.pickupTimeMinutes
    }
    if (orderTypeStr === 'dinein') {
      return settings.deliveryDineinTimeMinutes ?? settings.dineinTimeMinutes
    }
    return settings.deliveryDeliveryTimeMinutes ?? settings.deliveryTimeMinutes
  })()

  const typeMessage: string | undefined = (() => {
    if (orderTypeStr === 'pickup') {
      return settings.delivery_message_for_pickup ?? settings.message_for_pickup
    }
    if (orderTypeStr === 'dinein') {
      return settings.delivery_message_for_dinein ?? settings.message_for_dinein
    }
    return settings.delivery_message_for_delivery ?? settings.message_for_delivery
  })()

  const instructionMessage = settings.delivery_message_instruction

  const minimumOrder: number | null =
    orderTypeStr === 'delivery'
      ? (settings.deliveryMinimumOrder ?? globalMinByType['delivery'])
      : (globalMinByType[orderTypeStr] ?? null)

  const maximumOrder: number | null = globalMaxByType[orderTypeStr] ?? null
  const meetsMinOrder = minimumOrder == null || subtotal >= minimumOrder
  const meetsMaxOrder = maximumOrder == null || subtotal <= maximumOrder
  const withinPurchaseBounds = meetsMinOrder && meetsMaxOrder

  const selectedAddr = apiAddresses.find(
    (a) => String(a.id) === formValues.selectedAddressId
  )

  const guestReady =
    formValues.guestFullName.trim() !== '' &&
    formValues.guestMobile.trim() !== '' &&
    (orderType === 'pickup' || formValues.guestAddress.trim() !== '')
  const userReady  = items.length > 0 && (orderType === 'pickup' || !!selectedAddr)
  const canPlace   = items.length > 0 && withinPurchaseBounds && (user ? userReady : guestReady)

  const handleAddAddress = () => {
    const line = getValues('newAddrLine')
    const city = getValues('newAddrCity')
    if (!line.trim()) return
    if (user) {
      apiAddrAdder.addAddress({ address: line.trim(), city })
    } else {
      addLocalAddress({ line1: line.trim(), city })
      setValue('newAddrLine', ''); setValue('newAddrCity', 'Karachi'); setShowAddrForm(false)
    }
  }

  // ─── checkout ──────────────────────────────────────────────────────────────
  const checkoutMutation = useCheckout({
    onSuccess(res) {
      appendOrderIdToCookie(res.id)
      clearCart()
      router.push(`/website/checkout/confirmation?id=${res.id}`)
    },
    onError(msg) { setErrorMsg(msg || 'Failed to place order') },
  })

  const isPlacing = checkoutMutation.isPending

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!canPlace) return
    setErrorMsg('')

    const resolvedToken = liveCartToken
    if (!resolvedToken) {
      setErrorMsg('Unable to create cart. Please make sure a branch is selected and try again.')
      return
    }

    const customerName  = user ? user.name : values.guestFullName.trim()
    const customerPhone = user ? user.phone : values.guestMobile.trim()
    const customerAddr  = user
      ? (selectedAddr ? `${selectedAddr.address}, ${selectedAddr.city}` : '')
      : (orderType === 'delivery' ? values.guestAddress.trim() : '')
    const customerCity  = user
      ? (selectedAddr?.city || '')
      : (orderType === 'delivery' ? (location?.split(', ').pop() || '') : '')

    const resolvedBranchId = branchId ?? (branch ? Number(branch) : undefined)
    if (!resolvedBranchId || Number.isNaN(resolvedBranchId)) {
      setErrorMsg('Please select a branch before placing your order.')
      return
    }
    if (items.length === 0) {
      setErrorMsg('Your cart is empty. Please add items before placing an order.')
      return
    }

    const payload = buildCheckoutPayload({
      branch:                 resolvedBranchId,
      area:                   areaId ?? null,
      order_type:             orderType as 'delivery' | 'pickup',
      customer_name:          customerName,
      customer_phone:         customerPhone,
      customer_address:       customerAddr || undefined,
      customer_city:          customerCity || undefined,
      customer_landmark:      (user ? undefined : values.guestLandmark) || undefined,
      customer_instructions:  values.instructions || undefined,
      cartItems:              items,
      ...(values.isGift ? {
        is_gift: true,
        send_gift: {
          receipt_name:   values.giftReceiptName.trim(),
          gift_message:   values.giftMessage.trim(),
          receipt_number: values.giftReceiptNumber.trim(),
        },
      } : {}),
    })

    checkoutMutation.checkout(payload)
  }

  const fallbackBranch =
    FALLBACK_BRANCHES.find((b) => b.id === branch) ?? FALLBACK_BRANCHES[0]

  const displayBranchName = branchName || fallbackBranch?.name || 'United King'
  const displayBranchAddr =
    (branchAddress || branchLocation || fallbackBranch?.address || '').trim()
  const displayMapsUrl =
    (branchMapLocation || fallbackBranch?.mapsUrl || '#').trim()
  const displayPhone = (branchPhone || FALLBACK_PHONE).trim()

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50/70 font-sans text-neutral-800">
      <main className="mx-auto max-w-[1200px] px-4 pt-16 pb-10 md:px-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="page-in grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:gap-8"
        >
          {/* ── LEFT ── */}
          <div className="space-y-6 rounded-[28px] border border-neutral-100 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.02] md:p-8">

            {user && (
              <p className="text-sm text-neutral-600">
                Hello, <span className="font-bold uppercase text-[var(--color-primary)]">{user.name}</span>
              </p>
            )}

            {/* Order type banner */}
            {orderType === 'pickup' ? (
              <div className="space-y-1.5 rounded-2xl border border-neutral-100 bg-neutral-50 p-4 shadow-sm">
                <p className="text-sm font-bold uppercase text-neutral-900">Takeaway Order 📦</p>
                <p className="text-sm text-neutral-600">
                  Collect from <span className="font-semibold">{displayBranchName}</span>
                </p>
                {displayBranchAddr && (
                  <p className="text-xs text-neutral-500">{displayBranchAddr}</p>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <a href={displayMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700">
                    <Navigation size={11} /> View on Maps
                  </a>
                  <a href={`tel:${displayPhone.replace(/\D/g, '')}`}
                    className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700">
                    📞 {displayPhone}
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Checkout</h1>
                  <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
                    <Bike size={13} /> Delivery Order 🛵
                  </p>
                </div>

                {/* Gift toggle button */}
                <button
                  type="button"
                  onClick={() => setValue('isGift', !formValues.isGift)}
                  className={`gift-toggle flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                    formValues.isGift
                      ? 'gift-active border-pink-300 bg-pink-50 text-pink-700 shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <Gift size={15} />
                  Send a Gift
                </button>
              </div>
            )}

            <hr className="border-neutral-100" />

            {/* ── Gift recipient details ── */}
            {formValues.isGift && (
              <div className="gift-panel-in space-y-4 rounded-2xl border border-pink-200 bg-gradient-to-b from-pink-50/80 to-pink-50/40 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Gift size={16} className="shrink-0 text-pink-500" />
                  <p className="text-sm font-bold text-pink-700">Gift Recipient Details</p>
                </div>

                <div>
                  <label className={labelClass}>Recipient Name <span className="text-pink-500">*</span></label>
                  <input
                    {...register('giftReceiptName')}
                    placeholder="e.g. Mohid"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Recipient Mobile <span className="text-pink-500">*</span></label>
                  <input
                    {...register('giftReceiptNumber')}
                    placeholder="03xx-xxxxxxx"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Gift Message</label>
                  <textarea
                    {...register('giftMessage')}
                    placeholder="e.g. Happy Birthday! 🎂"
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            )}

            {settings.close_store && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
                <p className="font-bold">Store is currently closed</p>
                {settings.close_message && (
                  <p className="mt-1 text-red-700">{settings.close_message}</p>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                {errorMsg}
              </div>
            )}

            {checkoutNote && (
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 shadow-sm">
                <p className="mb-0.5 font-semibold text-neutral-900">Note</p>
                <p>{checkoutNote}</p>
              </div>
            )}

            {/* Minimum order not met */}
            {!meetsMinOrder && minimumOrder != null && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
                <p className="font-bold text-amber-900">Minimum order amount not reached</p>
                <p className="mt-0.5">
                  Please add Rs. {Math.max(0, minimumOrder - subtotal).toLocaleString()} more to place your order.
                  Subtotal: Rs. {subtotal.toLocaleString()} · Minimum: Rs. {minimumOrder.toLocaleString()}
                </p>
              </div>
            )}

            {/* Maximum order exceeded */}
            {!meetsMaxOrder && maximumOrder != null && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
                <p className="font-bold text-rose-900">Maximum order amount exceeded</p>
                <p className="mt-0.5">
                  Please remove items to bring subtotal down by Rs. {(subtotal - maximumOrder).toLocaleString()}.
                  Subtotal: Rs. {subtotal.toLocaleString()} · Maximum: Rs. {maximumOrder.toLocaleString()}
                </p>
              </div>
            )}

            {/* Per-order-type message + estimated time + instruction */}
            {(typeMessage || estMins || instructionMessage) && (
              <div className="space-y-1 rounded-2xl border border-neutral-100 [background-color:color-mix(in_srgb,var(--color-primary),transparent_97%)] px-4 py-3 text-sm text-neutral-700 shadow-sm">
                {estMins && (
                  <p className="mb-0.5 font-bold text-[var(--color-primary)]">
                    Estimated{' '}
                    {orderTypeStr === 'pickup' ? 'pickup' : orderTypeStr === 'dinein' ? 'prep' : 'delivery'}{' '}
                    time: {estMins} min
                  </p>
                )}
                {typeMessage && <p>{typeMessage}</p>}
                {instructionMessage && (
                  <p className="mt-1 border-t [border-color:color-mix(in_srgb,var(--color-primary),transparent_95%)] pt-1 text-neutral-600">
                    <span className="font-semibold text-neutral-800">Instructions:</span> {instructionMessage}
                  </p>
                )}
              </div>
            )}

            {/* ── GUEST FORM ── */}
            {!user ? (
              <div className="space-y-4">
                <div className="grid grid-cols-[100px_1fr] gap-3">
                  <div>
                    <label className={labelClass}>Title</label>
                    <select {...register('title')} className={inputClass}>
                      {TITLE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-neutral-700">Full Name</label>
                      <span className="text-xs font-bold text-[var(--color-primary)]">*Required</span>
                    </div>
                    <input {...register('guestFullName')} placeholder="Full Name" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-neutral-700">Mobile</label>
                      <span className="text-xs font-bold text-[var(--color-primary)]">*Required</span>
                    </div>
                    <input {...register('guestMobile')} placeholder="03xx-xxxxxxx" className={inputClass} />
                  </div>
                  {!settings.hide_alternative_number && (
                    <div>
                      <label className={labelClass}>Alternate Mobile</label>
                      <input {...register('guestAltMobile')} placeholder="03xx-xxxxxxx" className={inputClass} />
                    </div>
                  )}
                </div>

                {orderType === 'delivery' && (
                  <>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-semibold text-neutral-700">Delivery Address</label>
                        <span className="text-xs font-bold text-[var(--color-primary)]">*Required</span>
                      </div>
                      <input {...register('guestAddress')} placeholder="Enter your complete address" className={inputClass} />
                    </div>
                    {!settings.hide_nearest_landmark && (
                      <div>
                        <label className={labelClass}>Nearest Landmark</label>
                        <input {...register('guestLandmark')} placeholder="Any famous place nearby" className={inputClass} />
                      </div>
                    )}
                  </>
                )}

                {!settings.hide_email_address && (
                  <div>
                    <label className={labelClass}>Email (optional)</label>
                    <input type="email" {...register('guestEmail')} placeholder="Enter your email" className={inputClass} />
                  </div>
                )}

                {!settings.hide_delivery_instructions && (
                  <div>
                    <label className={labelClass}>{orderType === 'pickup' ? 'Pickup Notes' : 'Delivery Instructions'}</label>
                    <input {...register('instructions')} placeholder="Any special instructions…" className={inputClass} />
                  </div>
                )}

                <PaymentSection control={control} register={register} orderType={orderType} />
              </div>
            ) : (
              /* ── LOGGED-IN FORM ── */
              <div className="space-y-4">
                {orderType === 'delivery' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <SectionLabel tone="primary">Select Delivery Address</SectionLabel>
                      {!showAddrForm && (
                        <button type="button" onClick={() => setShowAddrForm(true)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-red-700">
                          <Plus size={14} /> Add New
                        </button>
                      )}
                    </div>

                    {loadingAddresses && (
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Loader2 size={13} className="animate-spin text-[var(--color-primary)]" /> Loading addresses…
                      </div>
                    )}

                    <div className="space-y-2">
                      {apiAddresses.map((addr) => {
                        const sel = formValues.selectedAddressId === String(addr.id)
                        return (
                          <button key={addr.id} type="button"
                            onClick={() => setValue('selectedAddressId', String(addr.id))}
                            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                              sel
                                ? 'scale-[1.01] border-[var(--color-primary)] bg-neutral-50 text-[var(--color-primary)] shadow-md ring-1 ring-[var(--color-primary)]/20'
                                : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:shadow-sm'
                            }`}>
                            <div>
                              <span className="font-medium">{addr.address}</span>
                              {addr.city && <span className="text-neutral-400">, {addr.city}</span>}
                            </div>
                            {sel
                              ? <CheckCircle size={18} className="shrink-0 text-[var(--color-primary)]" />
                              : <Circle size={18} className="shrink-0 text-neutral-300" />}
                          </button>
                        )
                      })}
                      {!loadingAddresses && apiAddresses.length === 0 && !showAddrForm && (
                        <p className="py-2 text-sm text-neutral-400">No saved addresses. Add one below.</p>
                      )}
                    </div>

                    {showAddrForm && (
                      <div className="space-y-2 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-4">
                        <input {...register('newAddrLine')} placeholder="Street address, area, landmark"
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
                        {settings.enable_city_on_checkout && (
                          <select {...register('newAddrCity')}
                            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20">
                            {['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad'].map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        )}
                        <div className="flex gap-2">
                          <button type="button" onClick={handleAddAddress} disabled={apiAddrAdder.isPending}
                            className="flex-1 rounded-xl bg-[var(--color-primary)] py-2 text-xs font-bold text-[var(--color-secondary)] shadow-sm transition-all hover:brightness-90 disabled:opacity-50">
                            {apiAddrAdder.isPending ? 'Saving…' : 'Save Address'}
                          </button>
                          <button type="button" onClick={() => setShowAddrForm(false)}
                            className="flex-1 rounded-xl border border-neutral-300 bg-white py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className={labelClass}>{orderType === 'pickup' ? 'Pickup Notes' : 'Delivery Instructions'}</label>
                  <input {...register('instructions')} placeholder="Any special instructions…" className={inputClass} />
                </div>

                <PaymentSection control={control} register={register} orderType={orderType} />
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-4">
            {/* Items */}
            <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.02]">
              <SectionLabel>Your Items</SectionLabel>
              {items.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">Your cart is empty</p>
              ) : (
                items.map((item) => (
                  <div key={`${item.id}-${item.selectedOption}-${JSON.stringify(item.selectedAddons)}`}
                    className="py-3 text-sm">
                    {/* Item name + price row */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="leading-snug text-neutral-700">
                        {item.quantity} × {item.name}
                        {item.selectedOption ? ` (${item.selectedOption})` : ''}
                      </span>
                      <span className="shrink-0 font-semibold">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>

                    {/* Selected add-ons / group options */}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (() => {
                      const grouped = item.selectedAddons.reduce<
                        { groupName?: string; entries: { name: string; qty: number; extraCost?: number }[] }[]
                      >((acc, addon) => {
                        const last = acc[acc.length - 1]
                        if (last && last.groupName === addon.groupName) {
                          last.entries.push(addon)
                        } else {
                          acc.push({ groupName: addon.groupName, entries: [addon] })
                        }
                        return acc
                      }, [])
                      return (
                        <div className="ml-4 mt-1.5 space-y-1.5">
                          {grouped.map((group, gi) => (
                            <div key={gi}>
                              {group.groupName && (
                                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                                  ● {group.groupName}
                                </p>
                              )}
                              <div className="space-y-0.5 border-l-2 border-neutral-100 pl-3">
                                {group.entries.map((entry, ei) => (
                                  <div key={ei} className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-neutral-500">
                                      <span className="font-semibold">{entry.qty}×</span> {entry.name}
                                    </span>
                                    {entry.extraCost != null && entry.extraCost > 0 && (
                                      <span className="shrink-0 text-[11px] font-semibold text-amber-600">
                                        +Rs.{entry.extraCost.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                ))
              )}
            </div>

            {/* Price summary */}
            <div className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.02]">
              <SectionLabel>Order Summary</SectionLabel>
              <PriceRow label="Subtotal"  value={`Rs. ${subtotal.toLocaleString()}`} />

              {/* Free-delivery progress bar */}
              {orderType === 'delivery' && settings.freeDeliveryAboveSubtotal < Infinity && (() => {
                const threshold = settings.freeDeliveryAboveSubtotal
                const unlocked  = subtotal >= threshold
                const progress  = unlocked ? 100 : Math.round((subtotal / threshold) * 100)
                const remaining = Math.max(0, threshold - subtotal)
                return (
                  <div className="space-y-1.5 py-0.5">
                    {unlocked ? (
                      <p className="unlock-pop text-[11px] font-semibold text-emerald-600">
                        🎉 You&apos;ve unlocked free delivery!
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-500">
                        Add <span className="font-semibold text-neutral-700">Rs. {remaining.toLocaleString()}</span> more for{' '}
                        <span className="font-semibold text-emerald-600">FREE delivery</span>
                      </p>
                    )}
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className={`relative h-full overflow-hidden rounded-full transition-all duration-700 ease-out ${unlocked ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`}
                        style={{ width: `${progress}%` }}
                      >
                        <span className="progress-shimmer absolute inset-0" />
                      </div>
                    </div>
                  </div>
                )
              })()}

              <PriceRow label={taxLabel} value={tax > 0 ? `Rs. ${tax.toLocaleString()}` : '—'} />
              {orderType === 'delivery' && (
                <PriceRow
                  label="Delivery Fee"
                  value={
                    effectiveDeliveryFee === 0
                      ? <span className="font-bold text-emerald-600">FREE</span>
                      : `Rs. ${effectiveDeliveryFee.toLocaleString()}`
                  }
                />
              )}
              {packagingFee > 0 && (
                <PriceRow label="Packaging Charge" value={`Rs. ${packagingFee.toLocaleString()}`} />
              )}
              {convenience > 0 && (
                <PriceRow label="Convenience Fee" value={`Rs. ${convenience.toLocaleString()}`} />
              )}
              <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900">
                <span>Grand Total</span>
                <span>Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Place Order — ambient shine + breathing glow, same language as modal CTA */}
            <div className="relative">
              {canPlace && !isPlacing && (
                <span className="cta-glow pointer-events-none absolute -inset-1 rounded-2xl bg-[var(--color-primary)]" />
              )}
              <button type="submit" disabled={!canPlace || isPlacing}
                className={`place-order-shine relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--color-primary)] py-4 text-sm font-bold text-[var(--color-secondary)] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg`}>
                <span className="relative z-10 flex items-center gap-2">
                  {isPlacing
                    ? <><Loader2 size={16} className="animate-spin" />Placing Order…</>
                    : 'Place Order'}
                </span>
                {canPlace && !isPlacing && (
                  <span className="shine-sweep pointer-events-none absolute inset-0" />
                )}
              </button>
            </div>

            <Link href="/" className="flex items-center justify-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700">
              <ArrowLeft size={14} /> Back to menu
            </Link>
          </div>
        </form>
      </main>

      <style jsx>{`
        @keyframes page-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-in { animation: page-fade-in 380ms cubic-bezier(0.16, 1, 0.3, 1); }

        @keyframes gift-pop {
          0% { transform: scale(0.92); }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .gift-active { animation: gift-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1); }

        @keyframes gift-panel-in {
          from { opacity: 0; transform: translateY(-6px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 600px; }
        }
        .gift-panel-in { animation: gift-panel-in 320ms ease-out; }

        @keyframes unlock-pop {
          0% { transform: scale(0.9); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .unlock-pop { animation: unlock-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1); }

        .progress-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          transform: translateX(-100%);
          animation: progress-shimmer-move 1.8s ease-in-out infinite;
        }
        @keyframes progress-shimmer-move {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .shine-sweep {
          background: linear-gradient(
            115deg,
            transparent 20%,
            rgba(255, 255, 255, 0.3) 42%,
            rgba(255, 255, 255, 0.5) 50%,
            rgba(255, 255, 255, 0.3) 58%,
            transparent 80%
          );
          transform: translateX(-120%);
          animation: shine-sweep-move 3.4s ease-in-out infinite;
          mix-blend-mode: overlay;
        }
        .place-order-shine:hover .shine-sweep { animation-duration: 1.1s; }
        @keyframes shine-sweep-move {
          0% { transform: translateX(-120%); }
          35% { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }

        .cta-glow {
          filter: blur(16px);
          opacity: 0.3;
          animation: cta-glow-breathe 2.8s ease-in-out infinite;
          z-index: 0;
        }
        @keyframes cta-glow-breathe {
          0%, 100% { opacity: 0.18; transform: scale(0.98); }
          50% { opacity: 0.35; transform: scale(1.02); }
        }
      `}</style>
    </div>
  )
}

// ─── Price row ─────────────────────────────────────────────────────────────────

function PriceRow({ label, value, valueClass = 'font-semibold' }: {
  label: string; value: React.ReactNode; valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between text-sm text-neutral-600">
      <span>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}