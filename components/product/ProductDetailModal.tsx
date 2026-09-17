'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Share2, Minus, Plus, Trash2, ArrowRight, Clock, Check } from 'lucide-react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'
import type { ProductData } from '../product/ProductCard'
import type { SelectedAddon, CartGroupSelection } from '@/redux/slices/cartSlice'

interface ProductDetailModalProps {
  product: ProductData
  onClose: () => void
}

// ── PKT time-window check ─────────────────────────────────────────────────
function getPKTNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
}

function toMinutes(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (!m) return null
  let h = parseInt(m[1], 10)
  const min = m[2] ? parseInt(m[2], 10) : 0
  const ap = m[3]?.toLowerCase()
  if (ap === 'pm' && h !== 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

function isWindowActiveNow(timeWindow?: string): boolean | null {
  if (!timeWindow) return null
  const parts = timeWindow.split(/-|to/i).map((p) => p.trim())
  if (parts.length !== 2) return null
  const start = toMinutes(parts[0])
  const end = toMinutes(parts[1])
  if (start === null || end === null) return null

  const now = getPKTNow()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  if (start <= end) return nowMin >= start && nowMin <= end
  return nowMin >= start || nowMin <= end
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addItem } = useCart()
  const { settings } = useStoreSettings()

  // Button colours from global settings (same source as ProductCard)
  const btnBg     = settings.item_price_background  || '#171717'
  const btnFg     = settings.item_price_text_color  || '#ffffff'
  const btnBorder = settings.item_price_border_color || btnBg

  const [selectedOption, setSelectedOption] = useState(product.options[0] ?? '')
  const [qty, setQty]                       = useState(1)
  const [instructions, setInstructions]     = useState('')
  const [sharing, setSharing]               = useState(false)
  const [added, setAdded]                   = useState(false)

  // groupSelections: option key → selected quantity (0 = not selected, ≥1 = selected with qty)
  const [groupSelections, setGroupSelections] = useState<Record<string, number>>({})

  // itemQtys: per included-item quantity for extra_cost calculation (key = index)
  const [itemQtys, setItemQtys] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {}
    ;(product.dealMeta?.includedItems ?? []).forEach((_, i) => { init[i] = 1 })
    return init
  })

  const isDeal   = !!product.dealType
  const isFixed  = product.dealType === 'fixed_deal'
  const isOnSpot = product.dealType === 'on_spot_deal'
  const dealMeta = product.dealMeta

  // Total selected count for a group (sum of quantities)
  const groupTotal = (gi: number): number => {
    const g = dealMeta?.groups?.[gi]
    if (!g) return 0
    return g.options.reduce((sum, opt) => {
      const key = `${gi}-${opt.id ?? opt.name}`
      return sum + (groupSelections[key] ?? 0)
    }, 0)
  }

  // Checkbox toggle (maxQty === null or ≤ 1): select/deselect as qty=1
  const toggleOption = (gi: number, optKey: string, selectQty: number) => {
    setGroupSelections((prev) => {
      const curQty = prev[optKey] ?? 0
      if (curQty > 0) return { ...prev, [optKey]: 0 }           // deselect
      if (groupTotal(gi) >= selectQty) return prev              // group cap reached
      return { ...prev, [optKey]: 1 }                           // select
    })
  }

  // Counter adjust (maxQty > 1): +1 / -1 within [0, maxQty] only.
  // Counter-type options are capped purely by their own maxQty (e.g. 4 for
  // Mix Kabab Rice), NOT by the group's selectQty — that cap is only
  // meaningful for checkbox-type (single-select-per-slot) options.
  const adjustOptionQty = (gi: number, optKey: string, delta: number, maxQty: number) => {
    setGroupSelections((prev) => {
      const cur  = prev[optKey] ?? 0
      const next = cur + delta
      if (next < 0 || next > maxQty) return prev
      return { ...prev, [optKey]: next }
    })
  }

  const hasSizes    = !!product.sizes && product.sizes.length > 0
  const selectedSize = hasSizes
    ? product.sizes!.find((s) => s.sizeName === selectedOption) ?? product.sizes![0]!
    : undefined

  const unitPrice = isDeal
    ? (Math.round(parseFloat(dealMeta?.finalPrice ?? product.price)) || 0)
    : (selectedSize ? selectedSize.price : (parseInt(product.price, 10) || 0))

  // Sum of extra costs across included items (each multiplied by their per-item qty)
  const extraCostTotal = isDeal
    ? (dealMeta?.includedItems ?? []).reduce((sum, item, i) => {
        if (!item.extraCost || item.extraCost <= 0) return sum
        return sum + item.extraCost * (itemQtys[i] ?? 1)
      }, 0)
    : 0

  // Sum of extra costs from selected group options — qty-aware (on-spot deals)
  const groupExtraCostTotal = isOnSpot
    ? (dealMeta?.groups ?? []).reduce((groupSum, group, gi) => {
        return groupSum + group.options.reduce((optSum, opt) => {
          if (!opt.extraCost || opt.extraCost <= 0) return optSum
          const key = `${gi}-${opt.id ?? opt.name}`
          const selQty = groupSelections[key] ?? 0
          return optSum + opt.extraCost * selQty
        }, 0)
      }, 0)
    : 0

  const displayOriginal = isDeal
    ? (parseFloat(product.price) > unitPrice ? parseInt(product.price, 10) : undefined)
    : (selectedSize
        ? (selectedSize.originalPrice != null ? selectedSize.originalPrice : undefined)
        : (product.originalPrice ? parseInt(product.originalPrice, 10) : undefined))

  const displayDiscount = isDeal
    ? product.discount
    : (selectedSize
        ? (selectedSize.hasDiscountTag ? selectedSize.discountLabel : undefined)
        : product.discount)

  const hasPrice = isDeal
    ? (Number.isFinite(unitPrice) && parseFloat(dealMeta?.finalPrice ?? '0') >= 0 &&
       parseFloat(product.price) > 0)
    : (Number.isFinite(unitPrice) && unitPrice > 0)

  const computedAvailable = isOnSpot ? isWindowActiveNow(dealMeta?.timeWindow ?? undefined) : null
  const isAvailableNow = isOnSpot
    ? (computedAvailable !== null ? computedAvailable : dealMeta?.isAvailableNow !== false)
    : true

  const requiredGroupsFilled = isOnSpot
    ? (dealMeta?.groups ?? []).every((g, gi) => !g.isRequired || groupTotal(gi) >= g.selectQty)
    : true

  const isOrderable =
    hasPrice &&
    (isDeal
      ? isAvailableNow && requiredGroupsFilled
      : (product.productId !== null && product.productId !== undefined &&
         Number.isFinite(Number(product.productId)) && Number(product.productId) > 0))

  const handleShare = async () => {
    if (sharing || !navigator.share) return
    setSharing(true)
    try {
      await navigator.share({ title: product.name, url: window.location.href })
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') console.error(e)
    } finally {
      setSharing(false)
    }
  }

  const total = (unitPrice + extraCostTotal + groupExtraCostTotal) * qty

  const handleAdd = () => {
    if (!isOrderable) return

    // ── Build selectedAddons for display ──────────────────────────────────────
    // Section 1: included items (fixed_deal & on_spot_deal)
    const includedRows: SelectedAddon[] =
      isDeal
        ? (dealMeta?.includedItems ?? []).map((item, i) => ({
            name:      item.name,
            qty:       itemQtys[i] ?? item.qty,
            extraCost: item.extraCost && item.extraCost > 0
              ? item.extraCost * (itemQtys[i] ?? 1)
              : undefined,
          }))
        : []

    // Section 2: on_spot_deal group selections
    const groupRows: SelectedAddon[] = isOnSpot
      ? (dealMeta?.groups ?? []).flatMap((group, gi) =>
          group.options
            .filter((opt) => (groupSelections[`${gi}-${opt.id ?? opt.name}`] ?? 0) > 0)
            .map((opt) => {
              const selQty = groupSelections[`${gi}-${opt.id ?? opt.name}`] ?? 1
              return {
                groupName: group.name,
                name:      opt.name,
                qty:       selQty,
                extraCost: opt.extraCost && opt.extraCost > 0
                  ? opt.extraCost * selQty
                  : undefined,
              }
            })
        )
      : []

    const selectedAddons = [...includedRows, ...groupRows]

    // ── Build groupSelections for on_spot_deal order payload ──────────────────
    const payloadGroupSelections: CartGroupSelection[] =
      isOnSpot
        ? (dealMeta?.groups ?? []).reduce(
            (acc, group, gi) => {
              const selectedOptionIds = group.options
                .filter((opt) => (groupSelections[`${gi}-${opt.id ?? opt.name}`] ?? 0) > 0)
                .flatMap((opt) => {
                  const selQty = groupSelections[`${gi}-${opt.id ?? opt.name}`] ?? 1
                  // Repeat the option ID by its quantity for counter-type options
                  return opt.id != null
                    ? Array.from({ length: selQty }, () => opt.id as number)
                    : []
                })
              if (selectedOptionIds.length > 0) {
                acc.push({ group: group.id, options: selectedOptionIds })
              }
              return acc
            },
            [] as CartGroupSelection[]
          )
        : []

    addItem({
      id: product.id,
      productId: product.productId,
      name: product.name,
      price: unitPrice + extraCostTotal + groupExtraCostTotal,
      originalPrice: (() => {
        // Only meaningful for regular (non-deal) items that have a higher original price
        if (isDeal) return undefined
        const orig = displayOriginal
        if (orig != null && orig > unitPrice) return orig
        return undefined
      })(),
      image: product.image,
      selectedOption:      selectedOption || undefined,
      variantId:           selectedSize ? selectedSize.sizeId : undefined,
      sizeFk:              selectedSize ? selectedSize.sizeFk : undefined,
      specialInstructions: instructions || undefined,
      quantity:            qty,
      selectedAddons:      selectedAddons.length > 0 ? selectedAddons : undefined,
      groupSelections:     payloadGroupSelections.length > 0 ? payloadGroupSelections : undefined,
      cartStyle:           product.cartStyle || undefined,
    })
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose() }, 900)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative flex h-full w-full max-w-[1000px] flex-col overflow-hidden bg-white shadow-2xl sm:h-[85vh] sm:max-h-[720px] sm:flex-row sm:rounded-2xl md:h-[75vh] lg:h-[70vh]">
        {/* ── LEFT — image ────────────────────────────────────────── */}
        <div className="relative h-48 w-full shrink-0 xs:h-56 sm:h-full sm:w-[42%] md:w-[46%]">
          <Image src={product.image} alt={product.name} fill className="object-cover" priority />

          {displayDiscount && (
            <span className="absolute right-2.5 top-2.5 rounded bg-[#f2c14e] px-2 py-0.5 text-[10px] font-bold text-neutral-900 sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
              {displayDiscount}
            </span>
          )}
          {!isDeal && product.tag && (
            <span className="absolute left-2.5 top-2.5 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-900 sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
              {product.tag}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-6 sm:pt-24 md:px-8 md:pb-8 md:pt-32">
            <h2 className="text-lg font-bold leading-snug text-white xs:text-xl sm:text-2xl md:text-3xl">
              {product.name}
            </h2>
            {product.description && (
              <p className="mt-1 text-xs text-white/80 line-clamp-2 sm:mt-1.5 sm:text-sm">{product.description}</p>
            )}
          </div>
        </div>

        {/* ── RIGHT — details ──────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">

          <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 sm:gap-3 sm:px-6 sm:pt-6 sm:pb-4 md:px-10 md:pt-8">
            {hasPrice ? (
              <div className="flex items-baseline gap-2 flex-wrap sm:gap-3">
                <span className="text-2xl font-extrabold text-neutral-900 xs:text-3xl sm:text-3xl md:text-4xl">
                  Rs. {(unitPrice + extraCostTotal + groupExtraCostTotal).toLocaleString()}
                </span>
                {displayOriginal != null && displayOriginal > unitPrice && (
                  <span className="text-sm text-neutral-400 line-through sm:text-base md:text-lg">
                    Rs. {displayOriginal.toLocaleString()}
                  </span>
                )}
                {isDeal && (extraCostTotal + groupExtraCostTotal) > 0 && (
                  <span className="text-xs text-amber-600 font-semibold sm:text-sm">
                    (incl. +Rs.{(extraCostTotal + groupExtraCostTotal).toLocaleString()} extras)
                  </span>
                )}
              </div>
            ) : <div />}

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button onClick={handleShare} disabled={sharing} aria-label="Share"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors disabled:opacity-50 sm:h-10 sm:w-10">
                <Share2 size={14} className="sm:hidden" />
                <Share2 size={16} className="hidden sm:block" />
              </button>
              <button onClick={onClose} aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:opacity-80 sm:h-10 sm:w-10"
                style={{ backgroundColor: btnBg, color: btnFg }}>
                <X size={16} className="sm:hidden" />
                <X size={18} className="hidden sm:block" />
              </button>
            </div>
          </div>

          {/* Prep / Cook time */}
          {!isDeal && product.timeDuration && (
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl bg-neutral-50 px-3.5 py-2 text-[11px] font-medium text-neutral-600 sm:mx-6 sm:mb-4 sm:px-4 sm:py-2.5 sm:text-xs md:mx-10">
              <Clock size={13} className="shrink-0 text-neutral-400 sm:hidden" />
              <Clock size={14} className="shrink-0 text-neutral-400 hidden sm:block" />
              <span>Ready in <span className="font-semibold text-neutral-800">{product.timeDuration}</span></span>
            </div>
          )}

          {isOnSpot && dealMeta?.timeWindow && (
            <div className={`mx-4 mb-3 flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-medium sm:mx-6 sm:mb-4 sm:px-4 sm:py-2.5 sm:text-xs md:mx-10 ${
              !isAvailableNow ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
            }`}>
              <Clock size={13} className="shrink-0 sm:hidden" />
              <Clock size={14} className="shrink-0 hidden sm:block" />
              <span>
                Available: <span className="font-semibold">{dealMeta.timeWindow}</span>
                {!isAvailableNow && (
                  <span className="ml-1.5 font-normal opacity-70">· not available right now (PKT)</span>
                )}
              </span>
            </div>
          )}

          {isFixed && dealMeta?.includedItems && dealMeta.includedItems.length > 0 && (
            <div className="px-4 pb-3 sm:px-6 sm:pb-4 md:px-10">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 sm:text-[11px]">
                Included in this deal
              </p>
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 overflow-hidden divide-y divide-neutral-100">
                {dealMeta.includedItems.map((item, i) => (
                  <div key={i} className="px-3 py-2 sm:px-4 sm:py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-neutral-800 font-medium flex-1 sm:text-sm">{item.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
                        {item.extraCost != null && item.extraCost > 0 ? (
                          // Show +/- counter when item has extra cost
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <span className="text-[11px] text-amber-600 font-semibold sm:text-xs">
                              +Rs.{(item.extraCost * (itemQtys[i] ?? 1)).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-0.5">
                              <button
                                type="button"
                                onClick={() => setItemQtys((prev) => ({ ...prev, [i]: Math.max(0, (prev[i] ?? 1) - 1) }))}
                                aria-label="Decrease"
                                className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-4 text-center text-xs font-bold text-neutral-800">{itemQtys[i] ?? 1}</span>
                              <button
                                type="button"
                                onClick={() => setItemQtys((prev) => ({ ...prev, [i]: (prev[i] ?? 1) + 1 }))}
                                aria-label="Increase"
                                className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-black transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 sm:px-2.5 sm:text-xs">
                            × {item.qty}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.availableAddons && item.availableAddons.length > 0 && (
                      <div className="mt-1.5 ml-2 space-y-0.5">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400 sm:text-[10px]">Add-ons available</p>
                        {item.availableAddons.map((addon) => (
                          <div key={addon.id} className="flex items-center justify-between text-[11px] text-neutral-500 sm:text-xs">
                            <span>+ {addon.name}</span>
                            {parseFloat(addon.price) > 0 && (
                              <span className="font-medium text-neutral-700">Rs.{Math.round(parseFloat(addon.price))}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOnSpot && dealMeta?.includedItems && dealMeta.includedItems.length > 0 && (
            <div className="px-4 pb-3 sm:px-6 sm:pb-4 md:px-10">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 sm:text-[11px]">
                Always included
              </p>
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 overflow-hidden divide-y divide-neutral-100">
                {dealMeta.includedItems.map((item, i) => (
                  <div key={i} className="px-3 py-2 sm:px-4 sm:py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-neutral-800 font-medium flex-1 sm:text-sm">{item.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
                        {item.extraCost != null && item.extraCost > 0 ? (
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <span className="text-[11px] text-amber-600 font-semibold sm:text-xs">
                              +Rs.{(item.extraCost * (itemQtys[i] ?? 1)).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-0.5">
                              <button
                                type="button"
                                onClick={() => setItemQtys((prev) => ({ ...prev, [i]: Math.max(0, (prev[i] ?? 1) - 1) }))}
                                aria-label="Decrease"
                                className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-4 text-center text-xs font-bold text-neutral-800">{itemQtys[i] ?? 1}</span>
                              <button
                                type="button"
                                onClick={() => setItemQtys((prev) => ({ ...prev, [i]: (prev[i] ?? 1) + 1 }))}
                                aria-label="Increase"
                                className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-black transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 sm:px-2.5 sm:text-xs">
                            × {item.qty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOnSpot && dealMeta?.groups && dealMeta.groups.map((group, gi) => {
            const total    = groupTotal(gi)
            const isFull   = total >= group.selectQty
            return (
              <div key={gi} className="px-4 pb-3 sm:px-6 sm:pb-4 md:px-10">
                <div className="mb-2 flex items-center justify-between sm:mb-2.5">
                  <p className="text-[13px] font-bold text-neutral-900 sm:text-sm">{group.name}</p>
                  <div className="flex items-center gap-1.5">
                    {group.isRequired && (
                      <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-[9px] font-semibold text-neutral-500 uppercase tracking-wide sm:px-2.5 sm:text-[10px]">
                        Required
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:px-2.5 sm:text-[10px] ${
                      isFull ? 'bg-amber-400 text-neutral-900' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {total}/{group.selectQty}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                  {group.options.map((opt) => {
                    const optKey    = `${gi}-${opt.id ?? opt.name}`
                    const selQty    = groupSelections[optKey] ?? 0
                    const isSelected = selQty > 0
                    const useCounter = (opt.maxQty ?? 0) > 1   // counter mode when maxQty > 1
                    const canAdd    = groupTotal(gi) < group.selectQty

                    if (useCounter) {
                      // ── Counter mode ──────────────────────────────────────
                      // Bounded only by this option's own maxQty (e.g. 4),
                      // independent of the group's selectQty.
                      return (
                        <div
                          key={optKey}
                          className={`flex w-full items-center gap-2 px-3 py-2.5 transition-colors sm:gap-3 sm:px-4 sm:py-3 ${
                            isSelected ? 'bg-amber-50' : 'bg-white'
                          }`}
                        >
                          <span className="flex-1 text-[13px] font-medium text-neutral-800 sm:text-sm">{opt.name}</span>

                          {opt.extraCost != null && opt.extraCost > 0 && (
                            <span className={`text-[11px] font-semibold whitespace-nowrap sm:text-xs ${isSelected ? 'text-amber-600' : 'text-neutral-400'}`}>
                              {selQty > 0 ? `+Rs.${(opt.extraCost * selQty).toLocaleString()}` : `+Rs.${opt.extraCost.toLocaleString()} each`}
                            </span>
                          )}

                          {opt.qty > 1 && selQty === 0 && (
                            <span className="text-[9px] font-semibold text-neutral-400 whitespace-nowrap sm:text-[10px]">× {opt.qty} pcs</span>
                          )}

                          {/* +/- counter */}
                          <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-0.5">
                            <button
                              type="button"
                              disabled={selQty <= 0}
                              onClick={() => adjustOptionQty(gi, optKey, -1, opt.maxQty!)}
                              aria-label="Decrease"
                              className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 transition-colors"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-neutral-800">{selQty}</span>
                            <button
                              type="button"
                              disabled={selQty >= opt.maxQty!}
                              onClick={() => adjustOptionQty(gi, optKey, +1, opt.maxQty!)}
                              aria-label="Increase"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-black disabled:opacity-30 transition-colors"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      )
                    }

                    // ── Checkbox mode (maxQty null or ≤ 1) ──────────────────
                    const canToggle = isSelected || canAdd
                    return (
                      <button
                        key={optKey}
                        type="button"
                        disabled={!canToggle}
                        onClick={() => toggleOption(gi, optKey, group.selectQty)}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors sm:gap-3 sm:px-4 sm:py-3 ${
                          isSelected ? 'bg-amber-50' : canToggle ? 'bg-white hover:bg-neutral-50' : 'bg-white opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:h-5 sm:w-5 ${
                          isSelected ? 'border-amber-500 bg-amber-500' : 'border-neutral-300'
                        }`}>
                          {isSelected && <Check size={11} className="text-white sm:hidden" strokeWidth={3} />}
                          {isSelected && <Check size={12} className="text-white hidden sm:block" strokeWidth={3} />}
                        </div>

                        <span className="flex-1 text-[13px] font-medium text-neutral-800 sm:text-sm">{opt.name}</span>

                        {opt.extraCost != null && opt.extraCost > 0 && (
                          <span className={`text-[11px] font-semibold whitespace-nowrap sm:text-xs ${isSelected ? 'text-amber-600' : 'text-neutral-400'}`}>
                            +Rs.{opt.extraCost.toLocaleString()}
                          </span>
                        )}

                        {opt.qty > 1 && (
                          <span className="text-[9px] font-semibold text-neutral-400 whitespace-nowrap sm:text-[10px]">
                            × {opt.qty} pcs
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <p className={`mt-1.5 text-[10px] sm:text-[11px] ${isFull ? 'text-amber-600 font-medium' : 'text-neutral-400'}`}>
                  {isFull
                    ? `✓ ${group.selectQty} selected`
                    : `Select ${group.selectQty - total} more`}
                </p>
              </div>
            )
          })}

          {!isDeal && hasSizes && (
            <div className="px-4 pb-3 sm:px-6 sm:pb-4 md:px-10">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 sm:mb-3 sm:text-xs">
                Choose an Option
              </p>
              <div className="grid grid-cols-1 gap-2.5 xs:grid-cols-2 sm:gap-3">
                {product.sizes!.map((s) => {
                  const isSelected = selectedOption === s.sizeName
                  return (
                    <button
                      key={s.sizeName}
                      onClick={() => setSelectedOption(s.sizeName)}
                      className={`flex items-start gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left transition-colors sm:gap-3 sm:px-4 sm:py-3.5 ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-100'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 sm:h-4 sm:w-4 ${
                        isSelected ? 'border-neutral-900' : 'border-neutral-300'
                      }`}>
                        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 sm:h-2 sm:w-2" />}
                      </span>
                      <span>
                        <span className="block text-[13px] font-semibold text-neutral-900 sm:text-sm">{s.sizeName}</span>
                        <span className="block text-[13px] font-bold text-neutral-900 sm:text-sm">
                          Rs. {s.price.toLocaleString()}
                        </span>
                        {s.originalPrice != null && s.originalPrice > s.price && (
                          <span className="block text-[11px] text-neutral-400 line-through sm:text-xs">
                            Rs. {s.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {!isDeal && !hasSizes && product.options.length > 0 && (
            <div className="px-4 pb-3 sm:px-6 sm:pb-4 md:px-10">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 sm:text-xs">Select Size</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {product.options.map((opt) => (
                  <button key={opt} onClick={() => setSelectedOption(opt)}
                    className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-colors sm:px-4 sm:text-xs ${
                      selectedOption === opt
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 pb-3 sm:px-6 sm:pb-4 md:px-10">
            <label className="mb-1.5 block text-[13px] font-semibold text-neutral-900 sm:mb-2 sm:text-sm">Special Instructions</label>
            <textarea value={instructions}
              onChange={(e) => { if (e.target.value.length <= 500) setInstructions(e.target.value) }}
              placeholder="Please enter instructions about this item"
              rows={4}
              className="w-full resize-none rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[13px] text-neutral-700 placeholder:text-neutral-400 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors sm:px-4 sm:py-3 sm:text-sm md:rows-5" />
            <p className="mt-1 text-right text-[10px] text-neutral-400 sm:text-[11px]">{instructions.length}/500</p>
          </div>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          {hasPrice && isOrderable ? (
            <div className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-neutral-100 bg-white px-4 py-4 sm:gap-3 sm:px-6 sm:py-5 md:px-10">
              <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-1 py-1 sm:gap-2 sm:px-1.5 sm:py-1.5">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={qty <= 1 ? 'Remove' : 'Decrease'}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9 ${
                    qty <= 1 ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'text-neutral-600 hover:bg-neutral-100'
                  }`}>
                  {qty <= 1 ? <Trash2 size={14} className="sm:hidden" /> : <Minus size={14} className="sm:hidden" />}
                  {qty <= 1 ? <Trash2 size={15} className="hidden sm:block" /> : <Minus size={15} className="hidden sm:block" />}
                </button>
                <span className="w-5 text-center text-sm font-bold text-neutral-900">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Increase"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:opacity-80 sm:h-9 sm:w-9"
                  style={{ backgroundColor: btnBg, color: btnFg }}>
                  <Plus size={14} className="sm:hidden" />
                  <Plus size={15} className="hidden sm:block" />
                </button>
              </div>
              <button onClick={handleAdd}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-5 py-3 text-[13px] font-bold transition-all sm:gap-2 sm:px-8 sm:py-3.5 sm:text-sm ${
                  added ? 'bg-green-600 text-white border-transparent' : 'hover:opacity-90'
                }`}
                style={!added ? { backgroundColor: btnBg, color: btnFg, borderColor: btnBorder } : {}}>
                <span>
                  {added
                    ? 'Added!'
                    : isDeal
                      ? (unitPrice === 0 ? 'FREE' : `Rs. ${total.toLocaleString()}`)
                      : `Rs. ${total.toLocaleString()}`
                  }
                </span>
                {!added && (
                  <>
                    <span className="opacity-40">|</span>
                    <span className="hidden xs:inline">Add to Cart</span>
                    <span className="xs:hidden">Add</span>
                    <ArrowRight size={14} className="sm:hidden" />
                    <ArrowRight size={16} className="hidden sm:block" />
                  </>
                )}
              </button>
            </div>

          ) : hasPrice && isOnSpot && isAvailableNow && !requiredGroupsFilled ? (
            <div className="sticky bottom-0 mt-auto border-t border-neutral-100 bg-white px-4 py-4 sm:px-6 sm:py-5 md:px-10">
              <div className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-center text-[13px] font-semibold text-amber-700 sm:px-4 sm:py-3 sm:text-sm">
                Please select all required options to continue
              </div>
            </div>

          ) : hasPrice && isDeal && !isAvailableNow ? (
            <div className="sticky bottom-0 mt-auto flex items-center gap-2 border-t border-neutral-100 bg-white px-4 py-4 sm:gap-3 sm:px-6 sm:py-5 md:px-10">
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-full bg-red-600 px-5 py-3 text-center text-[12px] font-bold text-white xs:flex-row xs:gap-2 sm:px-8 sm:py-3.5 sm:text-sm">
                <span>Rs. {unitPrice.toLocaleString()}</span>
                <span className="hidden text-white/40 xs:inline">|</span>
                <span>Available {dealMeta?.timeWindow ?? 'at specific hours'}</span>
              </div>
            </div>

          ) : (
            <div className="sticky bottom-0 mt-auto border-t border-neutral-100 bg-white px-4 py-4 sm:px-6 sm:py-5 md:px-10">
              <div className="rounded-xl bg-neutral-100 px-3.5 py-2.5 text-center text-[13px] font-semibold text-neutral-600 sm:px-4 sm:py-3 sm:text-sm">
                Coming Soon — This item is not available for ordering yet.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}