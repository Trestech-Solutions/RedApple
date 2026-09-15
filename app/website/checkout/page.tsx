'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CheckCircle, Circle, Plus, Bike, ArrowLeft, Navigation, Loader2 } from 'lucide-react'
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
  'w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000] placeholder:text-neutral-400'
const labelClass = 'mb-2 block text-sm font-semibold text-neutral-700'

const TITLE_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']

/** Safe numeric parser for min/max purchase, used when settings contain ''/null/number/string-number. */
function toNullableNum(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
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

  // Delivery fee from settings, fallback to DEFAULT_DELIVERY_FEE
  const deliveryFeeRaw = orderType === 'delivery'
    ? (settings.deliveryFee > 0 ? settings.deliveryFee : DEFAULT_DELIVERY_FEE)
    : 0

  // Free delivery if subtotal meets threshold
  const effectiveDeliveryFee =
    orderType === 'delivery' && subtotal >= settings.freeDeliveryAboveSubtotal
      ? 0
      : deliveryFeeRaw

  const packagingFeeBase = settings.packagingCharge
  const packagingFee = settings.packaging_incremental ? packagingFeeBase * items.length : packagingFeeBase
  const convenience  = settings.convenienceFee

  // ─── derived ──────────────────────────────────────────────────────────────
  // Tax logic:
  //   — If do_not_apply_tax_to_delivery_charges === TRUE (default behavior):
  //     tax is calculated on subtotal only.
  //   — If FALSE: delivery charges are included in the taxable base.
  const taxableBase =
    settings.do_not_apply_tax_to_delivery_charges === false
      ? subtotal + effectiveDeliveryFee
      : subtotal
  const tax        = Math.round(taxableBase * settings.taxPercentageRate)
  const grandTotal = subtotal + tax + effectiveDeliveryFee + packagingFee + convenience
  const checkoutNote = settings.checkout_note
  const orderTypeStr = orderType as string

  // ── Global per-order-type min/max purchase amounts (numeric parsers) ──────
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

  // ── Estimated time: prefer branch-level (regular order) per-type, fallback to global ──
  const estMins: number | null = (() => {
    if (orderTypeStr === 'pickup') {
      return settings.deliveryPickupTimeMinutes ?? settings.pickupTimeMinutes
    }
    if (orderTypeStr === 'dinein') {
      return settings.deliveryDineinTimeMinutes ?? settings.dineinTimeMinutes
    }
    return settings.deliveryDeliveryTimeMinutes ?? settings.deliveryTimeMinutes
  })()

  // ── Per-type message: prefer branch-level (regular order), fallback to global ──
  const typeMessage: string | undefined = (() => {
    if (orderTypeStr === 'pickup') {
      return settings.delivery_message_for_pickup ?? settings.message_for_pickup
    }
    if (orderTypeStr === 'dinein') {
      return settings.delivery_message_for_dinein ?? settings.message_for_dinein
    }
    return settings.delivery_message_for_delivery ?? settings.message_for_delivery
  })()

  // ── Additional instruction message (regular order) ──
  const instructionMessage = settings.delivery_message_instruction

  // ── Minimum order validation:
  //    Branch-level deliveryMinimumOrder takes precedence for delivery;
  //    fallback to global per-order-type minimum.
  //    sum_discount_in_minimum_order_amount = TRUE means compare subtotal
  //    (discounts already netted into per-item prices, so comparison stays same).
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

    // Build the minimal payload the backend expects
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
    })

    checkoutMutation.checkout(payload)
  }

  // ─── receipt ──────────────────────────────────────────────────────────────
  // After successful checkout the user is redirected to /website/checkout/confirmation?id=<orderId>

  // ─── branch info (prefer Redux/combine-menu data, fall back to static list ──
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
    <div className="min-h-screen font-sans text-neutral-800">
      <main className="mx-auto max-w-[1200px] px-4 pt-16 pb-10 md:px-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]"
        >
          {/* ── LEFT ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6 md:p-8">

            {user && (
              <p className="text-sm text-neutral-600">
                Hello, <span className="font-bold text-[#000000] uppercase">{user.name}</span>
              </p>
            )}

            {/* Order type banner */}
            {orderType === 'pickup' ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-1.5">
                <p className="text-sm font-bold text-neutral-900 uppercase">Takeaway Order 📦</p>
                <p className="text-sm text-neutral-600">
                  Collect from <span className="font-semibold">{displayBranchName}</span>
                </p>
                {displayBranchAddr && (
                  <p className="text-xs text-neutral-500">{displayBranchAddr}</p>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <a href={displayMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                    <Navigation size={11} /> View on Maps
                  </a>
                  <a href={`tel:${displayPhone.replace(/\D/g, '')}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    📞 {displayPhone}
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>
                <p className="mt-1 text-sm text-neutral-500 flex items-center gap-1">
                  <Bike size={13} /> Delivery Order 🛵
                </p>
              </div>
            )}

            <hr className="border-neutral-100" />

            {settings.close_store && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-bold">Store is currently closed</p>
                {settings.close_message && (
                  <p className="mt-1 text-red-700">{settings.close_message}</p>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            {/* Checkout note from admin */}
            {checkoutNote && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                <p className="font-semibold text-neutral-900 mb-0.5">Note</p>
                <p>{checkoutNote}</p>
              </div>
            )}

            {/* Minimum order not met */}
            {!meetsMinOrder && minimumOrder != null && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-bold text-amber-900">Minimum order amount not reached</p>
                <p className="mt-0.5">
                  Please add Rs. {Math.max(0, minimumOrder - subtotal).toLocaleString()} more to place your order.
                  Subtotal: Rs. {subtotal.toLocaleString()} · Minimum: Rs. {minimumOrder.toLocaleString()}
                </p>
              </div>
            )}

            {/* Maximum order exceeded */}
            {!meetsMaxOrder && maximumOrder != null && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <p className="font-bold text-rose-900">Maximum order amount exceeded</p>
                <p className="mt-0.5">
                  Please remove items to bring subtotal down by Rs. {(subtotal - maximumOrder).toLocaleString()}.
                  Subtotal: Rs. {subtotal.toLocaleString()} · Maximum: Rs. {maximumOrder.toLocaleString()}
                </p>
              </div>
            )}

            {/* Per-order-type message + estimated time + instruction */}
            {(typeMessage || estMins || instructionMessage) && (
              <div className="rounded-lg border border-neutral-200 bg-black/[0.02] px-4 py-3 text-sm text-neutral-700 space-y-1">
                {estMins && (
                  <p className="font-bold text-black mb-0.5">
                    Estimated{' '}
                    {orderTypeStr === 'pickup' ? 'pickup' : orderTypeStr === 'dinein' ? 'prep' : 'delivery'}{' '}
                    time: {estMins} min
                  </p>
                )}
                {typeMessage && <p>{typeMessage}</p>}
                {instructionMessage && (
                  <p className="pt-1 border-t border-black/5 mt-1 text-neutral-600">
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
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-neutral-700">Full Name</label>
                      <span className="text-xs font-bold text-[#000000]">*Required</span>
                    </div>
                    <input {...register('guestFullName')} placeholder="Full Name" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-neutral-700">Mobile</label>
                      <span className="text-xs font-bold text-[#000000]">*Required</span>
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
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-neutral-700">Delivery Address</label>
                        <span className="text-xs font-bold text-[#000000]">*Required</span>
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
                      <p className="text-sm font-semibold text-neutral-700">Select Delivery Address</p>
                      {!showAddrForm && (
                        <button type="button" onClick={() => setShowAddrForm(true)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-[#000000] hover:text-red-700">
                          <Plus size={14} /> Add New
                        </button>
                      )}
                    </div>

                    {loadingAddresses && (
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Loader2 size={13} className="animate-spin text-[#000000]" /> Loading addresses…
                      </div>
                    )}

                    <div className="space-y-2">
                      {apiAddresses.map((addr) => {
                        const sel = formValues.selectedAddressId === String(addr.id)
                        return (
                          <button key={addr.id} type="button"
                            onClick={() => setValue('selectedAddressId', String(addr.id))}
                            className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                              sel ? 'border-black bg-neutral-50 text-black'
                                  : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                            }`}>
                            <div>
                              <span className="font-medium">{addr.address}</span>
                              {addr.city && <span className="text-neutral-400">, {addr.city}</span>}
                            </div>
                            {sel
                              ? <CheckCircle size={18} className="shrink-0 text-black" />
                              : <Circle size={18} className="shrink-0 text-neutral-300" />}
                          </button>
                        )
                      })}
                      {!loadingAddresses && apiAddresses.length === 0 && !showAddrForm && (
                        <p className="text-sm text-neutral-400 py-2">No saved addresses. Add one below.</p>
                      )}
                    </div>

                    {showAddrForm && (
                      <div className="space-y-2 rounded-lg border border-dashed border-neutral-300 p-4">
                        <input {...register('newAddrLine')} placeholder="Street address, area, landmark"
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000]" />
                        {settings.enable_city_on_checkout && (
                          <select {...register('newAddrCity')}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000]">
                            {['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad'].map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        )}
                        <div className="flex gap-2">
                          <button type="button" onClick={handleAddAddress} disabled={apiAddrAdder.isPending}
                            className="flex-1 rounded-lg bg-black py-2 text-xs font-bold text-[#ffffff] hover:bg-red-700 disabled:opacity-50">
                            {apiAddrAdder.isPending ? 'Saving…' : 'Save Address'}
                          </button>
                          <button type="button" onClick={() => setShowAddrForm(false)}
                            className="flex-1 rounded-lg border border-neutral-300 py-2 text-xs font-semibold text-neutral-600">
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
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm divide-y divide-neutral-100">
              <h2 className="pb-3 font-bold text-neutral-800">Your Items</h2>
              {items.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">Your cart is empty</p>
              ) : (
                items.map((item) => (
                  <div key={`${item.id}-${item.selectedOption}-${JSON.stringify(item.selectedAddons)}`}
                    className="py-3 text-sm">
                    {/* Item name + price row */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-neutral-700 leading-snug">
                        {item.quantity} × {item.name}
                        {item.selectedOption ? ` (${item.selectedOption})` : ''}
                      </span>
                      <span className="font-semibold shrink-0">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>

                    {/* Selected add-ons / group options */}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (() => {
                      // Group by groupName for clean rendering
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
                        <div className="mt-1.5 ml-4 space-y-1.5">
                          {grouped.map((group, gi) => (
                            <div key={gi}>
                              {group.groupName && (
                                <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-0.5">
                                  ● {group.groupName}
                                </p>
                              )}
                              <div className="space-y-0.5 pl-3 border-l-2 border-neutral-100">
                                {group.entries.map((entry, ei) => (
                                  <div key={ei} className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-neutral-500">
                                      <span className="font-semibold">{entry.qty}×</span> {entry.name}
                                    </span>
                                    {entry.extraCost != null && entry.extraCost > 0 && (
                                      <span className="text-[11px] font-semibold text-amber-600 shrink-0">
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
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3">
              <h2 className="font-bold text-neutral-800">Order Summary</h2>
              <PriceRow label="Subtotal"  value={`Rs. ${subtotal.toLocaleString()}`} />

              {/* Free-delivery progress bar — delivery mode + finite threshold */}
              {orderType === 'delivery' && settings.freeDeliveryAboveSubtotal < Infinity && (() => {
                const threshold = settings.freeDeliveryAboveSubtotal
                const unlocked  = subtotal >= threshold
                const progress  = unlocked ? 100 : Math.round((subtotal / threshold) * 100)
                const remaining = Math.max(0, threshold - subtotal)
                return (
                  <div className="space-y-1.5 py-0.5">
                    {unlocked ? (
                      <p className="text-[11px] font-semibold text-emerald-600">
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
                        className={`h-full rounded-full transition-all duration-500 ${unlocked ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )
              })()}

              <PriceRow label="Tax 18%"   value={`Rs. ${tax.toLocaleString()}`} />
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
              <div className="border-t border-neutral-200 pt-3 flex items-center justify-between font-bold text-neutral-900 text-sm">
                <span>Grand Total</span>
                <span>Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button type="submit" disabled={!canPlace || isPlacing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#000000] py-4 text-sm font-bold text-[#ffffff] shadow-md transition-all hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-50">
              {isPlacing
                ? <><Loader2 size={16} className="animate-spin" />Placing Order…</>
                : 'Place Order'}
            </button>

            <Link href="/" className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-semibold">
              <ArrowLeft size={14} /> Back to menu
            </Link>
          </div>
        </form>
      </main>
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


