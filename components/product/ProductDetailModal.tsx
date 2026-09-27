'use client'

/**
 * Drop-in replacement for ProductDetailModal — premium visual pass.
 * All logic/props/behavior identical to before. What's new on top of the
 * previous shine/animation pass:
 *
 *  - Image panel: close/share are now floating glass circles sitting ON
 *    the image (top-right), image has a slow continuous Ken Burns zoom,
 *    a soft top vignette was added so the glass buttons stay legible on
 *    bright photos too.
 *  - Right panel: faint vertical gradient background (white → neutral-50)
 *    instead of flat white, custom slim scrollbar, tighter/more
 *    consistent spacing rhythm, section labels now have a small accent
 *    dot instead of being plain uppercase text.
 *  - Price: larger, tighter tracking, gets a subtle shimmer-on-mount so
 *    it feels alive the moment the modal opens.
 *  - Every "card" section (included items, option groups) now sits on a
 *    softer bg with a hairline border and a gentle hover lift — reads as
 *    a stack of premium cards rather than flat lists.
 *  - Footer is now a frosted-glass sticky bar (backdrop-blur) with a
 *    gradient top hairline instead of a flat border.
 *  - Corners are rounder throughout (rounded-2xl/3xl), shadows softer
 *    and more diffused, consistent with a premium storefront.
 */

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

// Small reusable section-label with accent dot
function SectionLabel({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'amber' }) {
  return (
    <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 sm:mb-3 sm:text-xs">
      <span className={`h-1.5 w-1.5 rounded-full ${tone === 'amber' ? 'bg-amber-500' : 'bg-neutral-900'}`} />
      {children}
    </p>
  )
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addItem } = useCart()
  const { settings } = useStoreSettings()

  const btnBg     = settings.item_price_background  || '#171717'
  const btnFg     = settings.item_price_text_color  || '#ffffff'
  const btnBorder = settings.item_price_border_color || btnBg

  const [selectedOption, setSelectedOption] = useState(product.options[0] ?? '')
  const [qty, setQty]                       = useState(1)
  const [instructions, setInstructions]     = useState('')
  const [sharing, setSharing]               = useState(false)
  const [added, setAdded]                   = useState(false)

  const [groupSelections, setGroupSelections] = useState<Record<string, number>>({})

  const [itemQtys, setItemQtys] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {}
    ;(product.dealMeta?.includedItems ?? []).forEach((_, i) => { init[i] = 1 })
    return init
  })

  const isDeal   = !!product.dealType
  const isFixed  = product.dealType === 'fixed_deal'
  const isOnSpot = product.dealType === 'on_spot_deal'
  const dealMeta = product.dealMeta

  const groupTotal = (gi: number): number => {
    const g = dealMeta?.groups?.[gi]
    if (!g) return 0
    return g.options.reduce((sum, opt) => {
      const key = `${gi}-${opt.id ?? opt.name}`
      return sum + (groupSelections[key] ?? 0)
    }, 0)
  }

  const toggleOption = (gi: number, optKey: string, selectQty: number) => {
    setGroupSelections((prev) => {
      const curQty = prev[optKey] ?? 0
      if (curQty > 0) return { ...prev, [optKey]: 0 }
      if (groupTotal(gi) >= selectQty) return prev
      return { ...prev, [optKey]: 1 }
    })
  }

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

  const extraCostTotal = isDeal
    ? (dealMeta?.includedItems ?? []).reduce((sum, item, i) => {
        if (!item.extraCost || item.extraCost <= 0) return sum
        return sum + item.extraCost * (itemQtys[i] ?? 1)
      }, 0)
    : 0

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

    const payloadGroupSelections: CartGroupSelection[] =
      isOnSpot
        ? (dealMeta?.groups ?? []).reduce(
            (acc, group, gi) => {
              const selectedOptionIds = group.options
                .filter((opt) => (groupSelections[`${gi}-${opt.id ?? opt.name}`] ?? 0) > 0)
                .flatMap((opt) => {
                  const selQty = groupSelections[`${gi}-${opt.id ?? opt.name}`] ?? 1
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
      className="modal-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-0 backdrop-blur-md sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-panel-in relative flex h-full w-full max-w-[1020px] flex-col overflow-hidden bg-white shadow-[0_40px_100px_-24px_rgba(0,0,0,0.5)] ring-1 ring-black/5 sm:h-[85vh] sm:max-h-[720px] sm:flex-row sm:rounded-[28px] md:h-[75vh] lg:h-[70vh]">

        {/* ── LEFT — image ────────────────────────────────────────── */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden xs:h-56 sm:h-full sm:w-[42%] md:w-[46%]">
          <div className="ken-burns absolute inset-0">
            <Image src={product.image} alt={product.name} fill className="object-cover" priority />
          </div>

          {/* top vignette so glass controls always read well */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />

          {displayDiscount && (
            <span className="badge-pop absolute left-2.5 top-2.5 rounded-full bg-[#f2c14e] px-2.5 py-0.5 text-[10px] font-bold text-neutral-900 shadow-lg sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
              {displayDiscount}
            </span>
          )}
          {!isDeal && product.tag && (
            <span className={`badge-pop absolute top-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-neutral-900 shadow-lg backdrop-blur-sm sm:top-3 sm:px-3 sm:py-1 sm:text-[11px] ${displayDiscount ? 'left-2.5 sm:left-3 mt-6 sm:mt-7' : 'left-2.5 sm:left-3'}`}>
              {product.tag}
            </span>
          )}

          {/* Floating glass controls — over the image, top-right */}
          <div className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
            <button onClick={handleShare} disabled={sharing} aria-label="Share"
              className="share-pulse flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-md transition-all hover:scale-105 hover:bg-white/30 disabled:opacity-50 sm:h-10 sm:w-10">
              <Share2 size={14} className="sm:hidden" />
              <Share2 size={16} className="hidden sm:block" />
            </button>
            <button onClick={onClose} aria-label="Close"
              className="close-spin flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-md transition-all hover:bg-white/30 sm:h-10 sm:w-10">
              <X size={16} className="sm:hidden" />
              <X size={18} className="hidden sm:block" />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-6 sm:pt-24 md:px-8 md:pb-8 md:pt-32">
            <h2 className="text-lg font-bold leading-snug tracking-tight text-white xs:text-xl sm:text-2xl md:text-[28px]">
              {product.name}
            </h2>
            {product.description && (
              <p className="mt-1 text-xs leading-relaxed text-white/75 line-clamp-2 sm:mt-1.5 sm:text-sm">{product.description}</p>
            )}
          </div>
        </div>

        {/* ── RIGHT — details ──────────────────────────────────────── */}
        <div className="premium-scroll flex min-h-0 flex-1 flex-col overflow-y-auto bg-gradient-to-b from-white to-neutral-50/60">

          <div className="flex items-start justify-between gap-2 px-4 pt-5 pb-3 sm:gap-3 sm:px-6 sm:pt-7 sm:pb-4 md:px-10 md:pt-9">
            {hasPrice ? (
              <div className="price-in flex flex-wrap items-baseline gap-2 sm:gap-3">
                <span className="text-[28px] font-extrabold tracking-tight text-neutral-900 xs:text-[32px] sm:text-4xl md:text-[40px]">
                  Rs. {(unitPrice + extraCostTotal + groupExtraCostTotal).toLocaleString()}
                </span>
                {displayOriginal != null && displayOriginal > unitPrice && (
                  <span className="text-sm text-neutral-400 line-through sm:text-base md:text-lg">
                    Rs. {displayOriginal.toLocaleString()}
                  </span>
                )}
                {isDeal && (extraCostTotal + groupExtraCostTotal) > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600 sm:text-sm">
                    +Rs.{(extraCostTotal + groupExtraCostTotal).toLocaleString()} extras
                  </span>
                )}
              </div>
            ) : <div />}
          </div>

          {/* Prep / Cook time */}
          {!isDeal && product.timeDuration && (
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-3.5 py-2.5 text-[11px] font-medium text-neutral-600 shadow-sm sm:mx-6 sm:mb-4 sm:px-4 sm:py-3 sm:text-xs md:mx-10">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                <Clock size={12} className="text-neutral-500" />
              </span>
              <span>Ready in <span className="font-semibold text-neutral-800">{product.timeDuration}</span></span>
            </div>
          )}

          {isOnSpot && dealMeta?.timeWindow && (
            <div className={`mx-4 mb-3 flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-[11px] font-medium shadow-sm sm:mx-6 sm:mb-4 sm:px-4 sm:py-3 sm:text-xs md:mx-10 ${
              !isAvailableNow ? 'border-red-100 bg-red-50 text-red-700' : 'border-amber-100 bg-amber-50 text-amber-700'
            }`}>
              <Clock size={14} className="shrink-0" />
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
              <SectionLabel>Included in this deal</SectionLabel>
              <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
                {dealMeta.includedItems.map((item, i) => (
                  <div key={i} className="px-3.5 py-2.5 transition-colors hover:bg-neutral-50/70 sm:px-4 sm:py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex-1 text-[13px] font-medium text-neutral-800 sm:text-sm">{item.name}</span>
                      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        {item.extraCost != null && item.extraCost > 0 ? (
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <span className="text-[11px] font-semibold text-amber-600 sm:text-xs">
                              +Rs.{(item.extraCost * (itemQtys[i] ?? 1)).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-0.5">
                              <button
                                type="button"
                                onClick={() => setItemQtys((prev) => ({ ...prev, [i]: Math.max(0, (prev[i] ?? 1) - 1) }))}
                                aria-label="Decrease"
                                className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-4 text-center text-xs font-bold text-neutral-800">{itemQtys[i] ?? 1}</span>
                              <button
                                type="button"
                                onClick={() => setItemQtys((prev) => ({ ...prev, [i]: (prev[i] ?? 1) + 1 }))}
                                aria-label="Increase"
                                className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-black"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 sm:px-2.5 sm:text-xs">
                            × {item.qty}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.availableAddons && item.availableAddons.length > 0 && (
                      <div className="ml-2 mt-1.5 space-y-0.5">
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
              <SectionLabel>Always included</SectionLabel>
              <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
                {dealMeta.includedItems.map((item, i) => (
                  <div key={i} className="px-3.5 py-2.5 transition-colors hover:bg-neutral-50/70 sm:px-4 sm:py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex-1 text-[13px] font-medium text-neutral-800 sm:text-sm">{item.name}</span>
                      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        {item.extraCost != null && item.extraCost > 0 ? (
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <span className="text-[11px] font-semibold text-amber-600 sm:text-xs">
                              +Rs.{(item.extraCost * (itemQtys[i] ?? 1)).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-0.5">
                              <button
                                type="button"
                                onClick={() => setItemQtys((prev) => ({ ...prev, [i]: Math.max(0, (prev[i] ?? 1) - 1) }))}
                                aria-label="Decrease"
                                className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-4 text-center text-xs font-bold text-neutral-800">{itemQtys[i] ?? 1}</span>
                              <button
                                type="button"
                                onClick={() => setItemQtys((prev) => ({ ...prev, [i]: (prev[i] ?? 1) + 1 }))}
                                aria-label="Increase"
                                className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-black"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 sm:px-2.5 sm:text-xs">
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
                <div className="mb-2.5 flex items-center justify-between sm:mb-3">
                  <p className="flex items-center gap-1.5 text-[13px] font-bold text-neutral-900 sm:text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {group.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {group.isRequired && (
                      <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-500 sm:px-2.5 sm:text-[10px]">
                        Required
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors sm:px-2.5 sm:text-[10px] ${
                      isFull ? 'bg-amber-400 text-neutral-900' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {total}/{group.selectQty}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  {group.options.map((opt) => {
                    const optKey    = `${gi}-${opt.id ?? opt.name}`
                    const selQty    = groupSelections[optKey] ?? 0
                    const isSelected = selQty > 0
                    const useCounter = (opt.maxQty ?? 0) > 1
                    const canAdd    = groupTotal(gi) < group.selectQty

                    if (useCounter) {
                      return (
                        <div
                          key={optKey}
                          className={`flex w-full items-center gap-2 px-3.5 py-2.5 transition-colors sm:gap-3 sm:px-4 sm:py-3 ${
                            isSelected ? 'bg-amber-50/70' : 'bg-white hover:bg-neutral-50/70'
                          }`}
                        >
                          <span className="flex-1 text-[13px] font-medium text-neutral-800 sm:text-sm">{opt.name}</span>

                          {opt.extraCost != null && opt.extraCost > 0 && (
                            <span className={`whitespace-nowrap text-[11px] font-semibold sm:text-xs ${isSelected ? 'text-amber-600' : 'text-neutral-400'}`}>
                              {selQty > 0 ? `+Rs.${(opt.extraCost * selQty).toLocaleString()}` : `+Rs.${opt.extraCost.toLocaleString()} each`}
                            </span>
                          )}

                          {opt.qty > 1 && selQty === 0 && (
                            <span className="whitespace-nowrap text-[9px] font-semibold text-neutral-400 sm:text-[10px]">× {opt.qty} pcs</span>
                          )}

                          <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-0.5">
                            <button
                              type="button"
                              disabled={selQty <= 0}
                              onClick={() => adjustOptionQty(gi, optKey, -1, opt.maxQty!)}
                              aria-label="Decrease"
                              className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-30"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-neutral-800">{selQty}</span>
                            <button
                              type="button"
                              disabled={selQty >= opt.maxQty!}
                              onClick={() => adjustOptionQty(gi, optKey, +1, opt.maxQty!)}
                              aria-label="Increase"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white transition-colors hover:bg-black disabled:opacity-30"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      )
                    }

                    const canToggle = isSelected || canAdd
                    return (
                      <button
                        key={optKey}
                        type="button"
                        disabled={!canToggle}
                        onClick={() => toggleOption(gi, optKey, group.selectQty)}
                        className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-all sm:gap-3 sm:px-4 sm:py-3 ${
                          isSelected ? 'bg-amber-50/70' : canToggle ? 'bg-white hover:bg-neutral-50/70' : 'cursor-not-allowed bg-white opacity-50'
                        }`}
                      >
                        <div className={`option-check flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-all sm:h-5 sm:w-5 ${
                          isSelected ? 'scale-110 border-amber-500 bg-amber-500' : 'border-neutral-300'
                        }`}>
                          {isSelected && <Check size={11} className="text-white sm:hidden" strokeWidth={3} />}
                          {isSelected && <Check size={12} className="hidden text-white sm:block" strokeWidth={3} />}
                        </div>

                        <span className="flex-1 text-[13px] font-medium text-neutral-800 sm:text-sm">{opt.name}</span>

                        {opt.extraCost != null && opt.extraCost > 0 && (
                          <span className={`whitespace-nowrap text-[11px] font-semibold sm:text-xs ${isSelected ? 'text-amber-600' : 'text-neutral-400'}`}>
                            +Rs.{opt.extraCost.toLocaleString()}
                          </span>
                        )}

                        {opt.qty > 1 && (
                          <span className="whitespace-nowrap text-[9px] font-semibold text-neutral-400 sm:text-[10px]">
                            × {opt.qty} pcs
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <p className={`mt-1.5 text-[10px] sm:text-[11px] ${isFull ? 'font-medium text-amber-600' : 'text-neutral-400'}`}>
                  {isFull
                    ? `✓ ${group.selectQty} selected`
                    : `Select ${group.selectQty - total} more`}
                </p>
              </div>
            )
          })}

          {!isDeal && hasSizes && (
            <div className="px-4 pb-3 sm:px-6 sm:pb-4 md:px-10">
              <SectionLabel>Choose an option</SectionLabel>
              <div className="grid grid-cols-1 gap-2.5 xs:grid-cols-2 sm:gap-3">
                {product.sizes!.map((s) => {
                  const isSelected = selectedOption === s.sizeName
                  return (
                    <button
                      key={s.sizeName}
                      onClick={() => setSelectedOption(s.sizeName)}
                      className={`flex items-start gap-2.5 rounded-2xl border-2 px-3.5 py-3 text-left transition-all sm:gap-3 sm:px-4 sm:py-3.5 ${
                        isSelected
                          ? 'scale-[1.01] border-neutral-900 bg-neutral-900/[0.04] shadow-md'
                          : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all sm:h-4 sm:w-4 ${
                        isSelected ? 'scale-110 border-neutral-900' : 'border-neutral-300'
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
              <SectionLabel>Select size</SectionLabel>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {product.options.map((opt) => (
                  <button key={opt} onClick={() => setSelectedOption(opt)}
                    className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-all sm:px-4 sm:text-xs ${
                      selectedOption === opt
                        ? 'scale-105 border-neutral-900 bg-neutral-900 text-white shadow-sm'
                        : 'border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 pb-3 sm:px-6 sm:pb-4 md:px-10">
            <SectionLabel>Special instructions</SectionLabel>
            <textarea value={instructions}
              onChange={(e) => { if (e.target.value.length <= 500) setInstructions(e.target.value) }}
              placeholder="Please enter instructions about this item"
              rows={4}
              className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[13px] text-neutral-700 shadow-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:shadow-md focus:ring-1 focus:ring-neutral-900 sm:px-4 sm:py-3 sm:text-sm md:rows-5" />
            <p className="mt-1 text-right text-[10px] text-neutral-400 sm:text-[11px]">{instructions.length}/500</p>
          </div>

          {/* ── FOOTER — frosted glass ───────────────────────────── */}
          {hasPrice && isOrderable ? (
            <div className="footer-glass sticky bottom-0 mt-auto flex items-center gap-2 bg-white/85 px-4 py-4 backdrop-blur-xl sm:gap-3 sm:px-6 sm:py-5 md:px-10">
              <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-1 py-1 shadow-sm sm:gap-2 sm:px-1.5 sm:py-1.5">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={qty <= 1 ? 'Remove' : 'Decrease'}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all sm:h-9 sm:w-9 ${
                    qty <= 1 ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'text-neutral-600 hover:bg-neutral-100'
                  }`}>
                  {qty <= 1 ? <Trash2 size={14} className="sm:hidden" /> : <Minus size={14} className="sm:hidden" />}
                  {qty <= 1 ? <Trash2 size={15} className="hidden sm:block" /> : <Minus size={15} className="hidden sm:block" />}
                </button>
                <span className="w-5 text-center text-sm font-bold text-neutral-900">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Increase"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-105 hover:opacity-90 sm:h-9 sm:w-9"
                  style={{ backgroundColor: btnBg, color: btnFg }}>
                  <Plus size={14} className="sm:hidden" />
                  <Plus size={15} className="hidden sm:block" />
                </button>
              </div>

              <div className="relative flex-1">
                {!added && <span className="cta-glow pointer-events-none absolute -inset-1 rounded-full" style={{ background: btnBg }} />}
                <button onClick={handleAdd}
                  className={`cta-shine relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-full border px-5 py-3 text-[13px] font-bold transition-all sm:gap-2 sm:px-8 sm:py-3.5 sm:text-sm ${
                    added ? 'border-transparent bg-green-600 text-white' : 'hover:-translate-y-0.5 hover:shadow-xl'
                  }`}
                  style={!added ? { backgroundColor: btnBg, color: btnFg, borderColor: btnBorder } : {}}>
                  <span className="relative z-10">
                    {added
                      ? 'Added!'
                      : isDeal
                        ? (unitPrice === 0 ? 'FREE' : `Rs. ${total.toLocaleString()}`)
                        : `Rs. ${total.toLocaleString()}`
                    }
                  </span>
                  {!added && (
                    <>
                      <span className="relative z-10 opacity-40">|</span>
                      <span className="relative z-10 hidden xs:inline">Add to Cart</span>
                      <span className="relative z-10 xs:hidden">Add</span>
                      <ArrowRight size={14} className="relative z-10 sm:hidden" />
                      <ArrowRight size={16} className="relative z-10 hidden sm:block" />
                      <span className="shine-sweep pointer-events-none absolute inset-0" />
                    </>
                  )}
                </button>
              </div>
            </div>

          ) : hasPrice && isOnSpot && isAvailableNow && !requiredGroupsFilled ? (
            <div className="footer-glass sticky bottom-0 mt-auto bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 md:px-10">
              <div className="rounded-2xl bg-amber-50 px-3.5 py-2.5 text-center text-[13px] font-semibold text-amber-700 sm:px-4 sm:py-3 sm:text-sm">
                Please select all required options to continue
              </div>
            </div>

          ) : hasPrice && isDeal && !isAvailableNow ? (
            <div className="footer-glass sticky bottom-0 mt-auto flex items-center gap-2 bg-white/85 px-4 py-4 backdrop-blur-xl sm:gap-3 sm:px-6 sm:py-5 md:px-10">
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-full bg-red-600 px-5 py-3 text-center text-[12px] font-bold text-white xs:flex-row xs:gap-2 sm:px-8 sm:py-3.5 sm:text-sm">
                <span>Rs. {unitPrice.toLocaleString()}</span>
                <span className="hidden text-white/40 xs:inline">|</span>
                <span>Available {dealMeta?.timeWindow ?? 'at specific hours'}</span>
              </div>
            </div>

          ) : (
            <div className="footer-glass sticky bottom-0 mt-auto bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 md:px-10">
              <div className="rounded-2xl bg-neutral-100 px-3.5 py-2.5 text-center text-[13px] font-semibold text-neutral-600 sm:px-4 sm:py-3 sm:text-sm">
                Coming Soon — This item is not available for ordering yet.
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes backdrop-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-backdrop-in { animation: backdrop-fade-in 220ms ease-out; }

        @keyframes panel-in {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-panel-in { animation: panel-in 320ms cubic-bezier(0.16, 1, 0.3, 1); }

        @keyframes ken-burns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        .ken-burns { animation: ken-burns 12s ease-out forwards; }

        @keyframes badge-pop {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .badge-pop { animation: badge-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) 150ms both; }

        .close-spin:hover { transform: rotate(90deg); }

        @keyframes share-ring-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.35); }
          70% { box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        .share-pulse { animation: share-ring-pulse 2.2s ease-out 2; }

        .option-check {
          transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 180ms, border-color 180ms;
        }

        @keyframes price-shimmer-in {
          0% { opacity: 0; transform: translateY(4px); filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .price-in { animation: price-shimmer-in 480ms ease-out 100ms both; }

        .shine-sweep {
          background: linear-gradient(
            115deg,
            transparent 20%,
            rgba(255, 255, 255, 0.32) 42%,
            rgba(255, 255, 255, 0.55) 50%,
            rgba(255, 255, 255, 0.32) 58%,
            transparent 80%
          );
          transform: translateX(-120%);
          animation: shine-sweep-move 3.2s ease-in-out infinite;
          mix-blend-mode: overlay;
        }
        .cta-shine:hover .shine-sweep { animation-duration: 1s; }
        @keyframes shine-sweep-move {
          0% { transform: translateX(-120%); }
          35% { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }

        .cta-glow {
          filter: blur(14px);
          opacity: 0.35;
          animation: cta-glow-breathe 2.6s ease-in-out infinite;
          z-index: 0;
        }
        @keyframes cta-glow-breathe {
          0%, 100% { opacity: 0.22; transform: scale(0.98); }
          50% { opacity: 0.4; transform: scale(1.02); }
        }

        .footer-glass {
          position: relative;
        }
        .footer-glass::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.12) 20%, rgba(0,0,0,0.12) 80%, transparent);
        }

        .premium-scroll::-webkit-scrollbar { width: 6px; }
        .premium-scroll::-webkit-scrollbar-track { background: transparent; }
        .premium-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 999px;
        }
        .premium-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.25); }
        .premium-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
      `}</style>
    </div>
  )
}