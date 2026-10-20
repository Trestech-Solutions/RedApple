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

import { Fragment, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, Share2, Minus, Plus, Trash2, ArrowRight, Clock, Check, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'
import { useBusinessHours } from '@/lib/hooks/useBusinessHours'
import { useCartAnimation } from '@/lib/context/CartAnimationContext'
import type { ProductData } from '../product/ProductCard'
import type { SelectedAddon, CartGroupSelection, CartItemAddon } from '@/redux/slices/cartSlice'

interface ProductDetailModalProps {
  product: ProductData
  onClose: () => void
}

// Shared with ProductGrid, which warms this exact optimised URL on card hover/touch.
// Mobile is capped at 640px so the file stays small (was 100vw → up to ~1280px wide).
export const MODAL_IMAGE_SIZES = '(min-width: 768px) 470px, (min-width: 640px) 42vw, 640px'

/**
 * Hero image with a safety net: if the optimised /_next/image request fails or
 * times out (slow/broken upstream), retry once straight from the source URL,
 * then fall back to a soft placeholder instead of showing broken-image alt text.
 */
function ModalHeroImage({ src, alt }: { src: string; alt: string }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0)
  if (!src || stage === 2) {
    return <span role="img" aria-label={alt} className="absolute inset-0 bg-neutral-200" />
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={MODAL_IMAGE_SIZES}
      className="object-cover"
      loading="eager"
      unoptimized={stage === 1}
      onError={() => setStage((s) => (s === 0 ? 1 : 2))}
    />
  )
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
  // start > end → same-day window between end and start (matches utils/dealTime.ts + backend)
  return nowMin >= end && nowMin <= start
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

/**
 * Rendered into <body> via a portal. The menu's category sections use
 * `content-visibility: auto` (which implies CSS containment), and a contained
 * ancestor becomes the containing block for `position: fixed` — without the
 * portal the overlay was trapped inside the section instead of covering the screen.
 */
export function ProductDetailModal(props: ProductDetailModalProps) {
  if (typeof document === 'undefined') return null
  return createPortal(<ProductDetailModalContent {...props} />, document.body)
}

function ProductDetailModalContent({ product, onClose }: ProductDetailModalProps) {
  const { addItem } = useCart()
  const { triggerFly } = useCartAnimation()
  const imageRef = useRef<HTMLDivElement>(null)
  const { settings } = useStoreSettings()
  const { isOpen: storeOpen, closedMessage, isHoliday, holidayMessage } = useBusinessHours()

  const btnBg     = settings.item_price_background  || '#171717'
  const btnFg     = settings.item_price_text_color  || '#ffffff'
  const btnBorder = settings.item_price_border_color || btnBg

  const [selectedOption, setSelectedOption] = useState(product.options[0] ?? '')
  const [qty, setQty]                       = useState(1)
  const [instructions, setInstructions]     = useState('')
  const [sharing, setSharing]               = useState(false)
  const [added, setAdded]                   = useState(false)

  const [groupSelections, setGroupSelections] = useState<Record<string, number>>({})

  // Regular-item add-ons: addonId → quantity (per unit of the line)
  const [addonQtys, setAddonQtys] = useState<Record<number, number>>({})
  const addonGroups = !product.dealType ? (product.addonGroups ?? []) : []
  const setAddonQty = (id: number, qty: number) =>
    setAddonQtys((prev) => ({ ...prev, [id]: Math.max(0, Math.min(10, qty)) }))
  // Follow-up choices: parent addonId → picked sub-addon ids (repeat an id to pick it twice)
  const [subPicks, setSubPicks] = useState<Record<number, number[]>>({})
  const setAddonQtyAndSubs = (id: number, qty: number) => {
    setAddonQty(id, qty)
    if (qty <= 0) setSubPicks((prev) => { const { [id]: _drop, ...rest } = prev; return rest })
  }
  const pickSub = (addonId: number, subId: number, max: number) =>
    setSubPicks((prev) => {
      const cur = prev[addonId] ?? []
      if (max === 1) return { ...prev, [addonId]: cur[0] === subId ? [] : [subId] }   // single choice: tap again to clear
      return cur.length >= max ? prev : { ...prev, [addonId]: [...cur, subId] }
    })
  const unpickSub = (addonId: number, subId: number) =>
    setSubPicks((prev) => {
      const cur = [...(prev[addonId] ?? [])]
      const i = cur.lastIndexOf(subId)
      if (i >= 0) cur.splice(i, 1)
      return { ...prev, [addonId]: cur }
    })
  const subPrice = (a: (typeof addonGroups)[number]['addons'][number]) =>
    (subPicks[a.id] ?? []).reduce((s, id) => s + (a.subOptions?.options.find((o) => o.id === id)?.price ?? 0), 0)
  // required sub choice → exactly N picks; optional → at most N (enforced by pickSub)
  const subFilled = (a: (typeof addonGroups)[number]['addons'][number]) =>
    !a.subOptions || !a.subOptions.isRequired || (subPicks[a.id] ?? []).length === a.subOptions.selectQuantity
  const addonsTotal = addonGroups.reduce(
    (sum, g) => sum + g.addons.reduce((s, a) => s + (a.price + subPrice(a)) * (addonQtys[a.id] ?? 0), 0), 0)
  const requiredAddonsFilled =
    addonGroups.every((g) => !g.isRequired || g.addons.some((a) => (addonQtys[a.id] ?? 0) > 0)) &&
    addonGroups.every((g) => g.addons.every((a) => (addonQtys[a.id] ?? 0) === 0 || subFilled(a)))

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
      if (selectQty === 1) {
        // single-choice group: picking a new option replaces the previous one
        const next = { ...prev }
        Object.keys(next).forEach((k) => { if (k.startsWith(`${gi}-`)) next[k] = 0 })
        next[optKey] = 1
        return next
      }
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

  const itemOutsideHours = !isDeal && product.itemAvailableNow === false

  const isOrderable =
    hasPrice &&
    !itemOutsideHours &&
    requiredAddonsFilled &&
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

  const total = (unitPrice + extraCostTotal + groupExtraCostTotal + addonsTotal) * qty

  const handleAdd = () => {
    if (!isOrderable) return
    if (!storeOpen) return   // store closed — button should not be clickable, but guard here too

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

    const itemAddons: CartItemAddon[] = addonGroups.flatMap((g) =>
      g.addons
        .filter((a) => (addonQtys[a.id] ?? 0) > 0)
        .map((a) => ({
          addon: a.id,
          quantity: addonQtys[a.id],
          ...((subPicks[a.id] ?? []).length > 0 ? { sub_addons: subPicks[a.id] } : {}),
        }))
    )
    const itemAddonRows: SelectedAddon[] = addonGroups.flatMap((g) =>
      g.addons
        .filter((a) => (addonQtys[a.id] ?? 0) > 0)
        .flatMap((a) => {
          const q = addonQtys[a.id]
          const subs = new Map<number, number>()
          ;(subPicks[a.id] ?? []).forEach((id) => subs.set(id, (subs.get(id) ?? 0) + 1))
          return [
            { groupName: g.name, name: a.name, qty: q, extraCost: a.price > 0 ? a.price * q : undefined },
            ...[...subs].map(([id, n]) => {
              const o = a.subOptions?.options.find((x) => x.id === id)
              return { groupName: a.name, name: o?.name ?? `Option ${id}`, qty: n * q, extraCost: o && o.price > 0 ? o.price * n * q : undefined }
            }),
          ]
        })
    )

    const selectedAddons = [...includedRows, ...groupRows, ...itemAddonRows]

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
      price: unitPrice + extraCostTotal + groupExtraCostTotal + addonsTotal,
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
      itemAddons:          itemAddons.length > 0 ? itemAddons : undefined,
      cartStyle:           product.cartStyle || undefined,
    })
    // Close the modal right away and let the product fly from where its image
    // was into the cart, so the user sees it land. triggerFly measures the
    // image synchronously, before the modal unmounts.
    if (imageRef.current) triggerFly(imageRef.current, product.image, { size: 120 })
    else { setAdded(true) }
    onClose()
  }

  return (
    <div
      className="modal-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-1.5 backdrop-blur-md sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-panel-in relative flex w-full max-w-[1020px] flex-col overflow-y-auto overflow-x-hidden rounded-2xl sm:overflow-hidden bg-white shadow-[0_40px_100px_-24px_rgba(0,0,0,0.5)] ring-1 ring-black/5 max-h-[94dvh] sm:h-[85vh] sm:max-h-[720px] sm:flex-row sm:rounded-[28px] md:h-[75vh] lg:h-[70vh]">

        {/* ── LEFT — image ────────────────────────────────────────── */}
        <div ref={imageRef} className="relative aspect-square max-h-[62dvh] w-full shrink-0 overflow-hidden sm:aspect-auto sm:max-h-none sm:h-full sm:w-[42%] md:w-[46%]">
          <div className="ken-burns absolute inset-0">
            <ModalHeroImage key={product.image} src={product.image} alt={product.name} />
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
              className="share-pulse flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-md transition-all hover:scale-105 hover:bg-white/30 disabled:opacity-50 max-sm:h-10 max-sm:w-10 max-sm:bg-red-600 max-sm:ring-0 max-sm:backdrop-blur-none sm:h-10 sm:w-10">
              <Share2 size={14} className="sm:hidden" />
              <Share2 size={16} className="hidden sm:block" />
            </button>
            <button onClick={onClose} aria-label="Close"
              className="close-spin flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-md transition-all hover:bg-white/30 max-sm:h-10 max-sm:w-10 max-sm:bg-red-600 max-sm:ring-0 max-sm:backdrop-blur-none sm:h-10 sm:w-10">
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
        <div className="premium-scroll flex flex-none flex-col bg-neutral-50 sm:min-h-0 sm:flex-1 sm:overflow-y-auto">

          <div className="flex items-start justify-between gap-2 px-3 pt-4 pb-3 sm:gap-3 sm:px-5 sm:pt-6 sm:pb-4 md:px-6 md:pt-7 lg:px-7">
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
            <div className="mx-3 mb-3 flex items-center gap-2 rounded-2xl border border-neutral-100 bg-white px-3.5 py-2.5 text-[11px] font-medium text-neutral-600 shadow-sm sm:mx-6 sm:mb-4 sm:px-4 sm:py-3 sm:text-xs md:mx-10">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                <Clock size={12} className="text-neutral-500" />
              </span>
              <span>Ready in <span className="font-semibold text-neutral-800">{product.timeDuration}</span></span>
            </div>
          )}

          {itemOutsideHours && product.itemWindow && (
            <div className="mx-3 mb-3 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[11px] font-medium text-red-700 shadow-sm sm:mx-6 sm:mb-4 sm:px-4 sm:py-3 sm:text-xs md:mx-10">
              <Clock size={14} className="shrink-0" />
              <span>
                Available: <span className="font-semibold">{product.itemWindow}</span>
                <span className="ml-1.5 font-normal opacity-70">· not available right now</span>
              </span>
            </div>
          )}

          {isOnSpot && dealMeta?.timeWindow && (
            <div className={`mx-3 mb-3 flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-[11px] font-medium shadow-sm sm:mx-6 sm:mb-4 sm:px-4 sm:py-3 sm:text-xs md:mx-10 ${
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
            <div className="px-3 pb-3 sm:px-5 sm:pb-4 md:px-6 lg:px-7">
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
            <div className="px-3 pb-3 sm:px-5 sm:pb-4 md:px-6 lg:px-7">
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
            const total  = groupTotal(gi)
            const isFull = total >= group.selectQty
            return (
              <div key={gi} className="px-3 pb-3 sm:px-5 sm:pb-4 md:px-6 lg:px-7">
                {/* Group header card — turns green once a required group is complete */}
                {(() => {
                  const done = group.isRequired && isFull
                  return (
                    <div className={`mb-2.5 flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 shadow-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 ${
                      done ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-white' : 'border-neutral-200 bg-white'
                    }`}>
                      <div className="min-w-0">
                        <p className={`truncate text-[14px] font-extrabold sm:text-base ${group.isRequired ? 'text-red-700' : 'text-neutral-900'}`}>{group.name}</p>
                        {group.isRequired && !done && (
                          <p className="mt-0.5 text-[11px] text-neutral-400">Select {group.selectQty - total} more</p>
                        )}
                      </div>
                      {done ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white sm:px-3 sm:py-1 sm:text-[12px]">
                          <CheckCircle2 size={13} strokeWidth={2.5} /> Done
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 sm:px-3 sm:py-1 sm:text-[12px]">
                          {group.isRequired && <AlertCircle size={12} strokeWidth={2.5} />}
                          {group.isRequired ? 'Required' : 'Optional'}
                        </span>
                      )}
                    </div>
                  )
                })()}

                {/* Selected chips — tap the red minus to remove */}
                {group.options.some((o) => (groupSelections[`${gi}-${o.id ?? o.name}`] ?? 0) > 0 && (o.maxQty ?? 0) <= 1) && (
                  <div className="mb-2.5 flex flex-wrap gap-2.5">
                    {group.options.map((o) => {
                      const k = `${gi}-${o.id ?? o.name}`
                      if ((groupSelections[k] ?? 0) <= 0 || (o.maxQty ?? 0) > 1) return null
                      return (
                        <div key={k} className="relative">
                          {o.image ? (
                            <span className="relative block h-12 w-12 overflow-hidden sm:h-[60px] sm:w-[60px] rounded-xl bg-neutral-100 shadow-md ring-2 ring-white">
                              <Image src={o.image} alt={o.name} fill sizes="60px" className="object-cover" />
                            </span>
                          ) : (
                            <span className="block rounded-xl bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-md ring-1 ring-neutral-200">{o.name}</span>
                          )}
                          <button type="button" aria-label={`Remove ${o.name}`}
                            onClick={() => toggleOption(gi, k, group.selectQty)}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow ring-2 ring-white">
                            <Minus size={11} strokeWidth={3} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Option cards */}
                <div className="space-y-2">
                  {group.options.map((opt) => {
                    const optKey     = `${gi}-${opt.id ?? opt.name}`
                    const selQty     = groupSelections[optKey] ?? 0
                    const isSelected = selQty > 0
                    const useCounter = (opt.maxQty ?? 0) > 1
                    const canAdd     = groupTotal(gi) < group.selectQty
                    const canToggle  = isSelected || canAdd || group.selectQty === 1

                    const rowBase = `flex w-full items-center gap-2.5 rounded-xl border bg-white px-2.5 py-2 text-left sm:gap-3 sm:px-3 sm:py-2.5 shadow-sm transition-colors ${
                      isSelected ? 'border-red-400 bg-white' : 'border-neutral-200'
                    }`

                    const thumb = opt.image ? (
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-11 sm:w-11">
                        <Image src={opt.image} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                    ) : null

                    const price = opt.extraCost != null && opt.extraCost > 0 ? (
                      <span className="whitespace-nowrap text-[13px] font-bold text-neutral-900">
                        Rs. {(opt.extraCost * (useCounter && selQty > 0 ? selQty : 1)).toLocaleString()}
                      </span>
                    ) : null

                    const pcs = opt.qty > 1 ? (
                      <span className="whitespace-nowrap text-[10px] font-medium text-neutral-400">× {opt.qty} pcs</span>
                    ) : null

                    if (useCounter) {
                      return (
                        <div key={optKey} className={rowBase}>
                          {thumb}
                          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-800 sm:text-sm">{opt.name}</span>
                          {price}{pcs}
                          <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-0.5">
                            <button type="button" disabled={selQty <= 0}
                              onClick={() => adjustOptionQty(gi, optKey, -1, opt.maxQty!)} aria-label="Decrease"
                              className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-30">
                              <Minus size={11} />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-neutral-800">{selQty}</span>
                            <button type="button" disabled={selQty >= opt.maxQty!}
                              onClick={() => adjustOptionQty(gi, optKey, +1, opt.maxQty!)} aria-label="Increase"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-30">
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <button key={optKey} type="button" disabled={!canToggle}
                        onClick={() => toggleOption(gi, optKey, group.selectQty)}
                        className={`${rowBase} ${canToggle ? 'active:scale-[0.99]' : 'cursor-not-allowed opacity-50'}`}>
                        <span className={`option-check flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                          isSelected ? 'border-red-600 bg-red-600' : 'border-neutral-300 bg-white'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                        </span>
                        {thumb}
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-neutral-800 sm:text-sm">{opt.name}</span>
                        {price}{pcs}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {!isDeal && hasSizes && (
            <div className="px-3 pb-3 sm:px-5 sm:pb-4 md:px-6 lg:px-7">
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
            <div className="px-3 pb-3 sm:px-5 sm:pb-4 md:px-6 lg:px-7">
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

          {addonGroups.map((g) => (
            <div key={g.id} className="px-3 pb-3 sm:px-5 sm:pb-4 md:px-6 lg:px-7">
              <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
                <p className="min-w-0 truncate text-[15px] font-bold text-neutral-900">{g.name}</p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                  {g.isRequired && <AlertCircle size={11} strokeWidth={2.5} />}
                  {g.isRequired ? 'Required' : 'Optional'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {g.addons.map((a) => {
                  const q = addonQtys[a.id] ?? 0
                  const sub = a.subOptions
                  const picks = subPicks[a.id] ?? []
                  // Add-on display design (set in the dashboard): design-1 text-only pill, design-2 row + thumbnail, design-3 photo card
                  const design = a.cartStyle === 'design-3' || a.cartStyle === 'design-1' ? a.cartStyle : 'design-2'
                  const stepper = q > 0 && (
                    <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-0.5">
                      <button type="button" onClick={() => setAddonQtyAndSubs(a.id, q - 1)} aria-label={`Remove one ${a.name}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100">
                        <Minus size={10} />
                      </button>
                      <span className="w-4 text-center text-xs font-bold text-neutral-800">{q}</span>
                      <button type="button" onClick={() => setAddonQty(a.id, q + 1)} aria-label={`Add one ${a.name}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-black">
                        <Plus size={10} />
                      </button>
                    </div>
                  )
                  const priceTag = a.price > 0 && (
                    <span className="text-[13px] font-bold text-neutral-900">Rs. {a.price.toLocaleString()}</span>
                  )
                  return (
                    <Fragment key={a.id}>
                    <div className={design === 'design-3' ? '' : 'col-span-2'}>
                    {design === 'design-3' ? (
                      <div className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors ${q > 0 ? 'border-red-400 ring-1 ring-red-300' : 'border-neutral-200'}`}>
                        <button type="button" onClick={() => setAddonQtyAndSubs(a.id, q > 0 ? 0 : 1)} aria-pressed={q > 0} className="block w-full text-left">
                          <span className="relative block aspect-[4/3] w-full bg-neutral-100">
                            {a.image && <Image src={a.image} alt="" fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" />}
                            <span className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 ${q > 0 ? 'border-red-600 bg-red-600 text-white' : 'border-neutral-300 bg-white/90'}`}>
                              {q > 0 && <Check size={14} strokeWidth={3} />}
                            </span>
                          </span>
                          <span className="block px-3 pb-2 pt-2.5">
                            <span className="block truncate text-[13px] font-medium text-neutral-800 sm:text-sm">{a.name}</span>
                            {a.price > 0 && <span className="block text-[12px] font-bold text-neutral-900">Rs. {a.price.toLocaleString()}</span>}
                          </span>
                        </button>
                        {q > 0 && <div className="flex justify-end px-3 pb-2.5">{stepper}</div>}
                      </div>
                    ) : design === 'design-1' ? (
                      <div className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-3 transition-colors ${q > 0 ? 'border-red-300 bg-gradient-to-r from-red-50 to-white' : 'border-neutral-200 bg-white'}`}>
                        <button type="button" onClick={() => setAddonQtyAndSubs(a.id, q > 0 ? 0 : 1)} aria-pressed={q > 0}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${q > 0 ? 'bg-red-600' : 'border-2 border-neutral-300'}`}>
                            {q > 0 && <span className="h-2 w-2 rounded-full bg-white" />}
                          </span>
                          <span className="truncate text-[13px] font-medium text-neutral-800 sm:text-sm">{a.name}</span>
                        </button>
                        <div className="flex shrink-0 items-center gap-2">{priceTag}{stepper}</div>
                      </div>
                    ) : (
                      <div className={`flex items-center justify-between gap-2 rounded-2xl border bg-white px-3 py-2.5 transition-colors ${q > 0 ? 'border-red-300 bg-red-50/40' : 'border-neutral-200'}`}>
                        <button type="button" onClick={() => setAddonQtyAndSubs(a.id, q > 0 ? 0 : 1)} aria-pressed={q > 0}
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${q > 0 ? 'border-red-600 bg-red-600 text-white' : 'border-neutral-300'}`}>
                            {q > 0 && <Check size={12} strokeWidth={3} />}
                          </span>
                          {a.image && (
                            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                              <Image src={a.image} alt="" fill sizes="44px" className="object-cover" />
                            </span>
                          )}
                          <span className="truncate text-[13px] font-medium text-neutral-800 sm:text-sm">{a.name}</span>
                        </button>
                        <div className="flex shrink-0 items-center gap-2">{priceTag}{stepper}</div>
                      </div>
                    )}
                    </div>
                    {q > 0 && sub && (
                      <div className="col-span-2 ml-4 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-[13px] font-semibold text-neutral-900">{sub.name}</p>
                          <span className="shrink-0 text-[11px] font-semibold text-neutral-500">
                            {sub.isRequired ? 'Required' : 'Optional'} · {picks.length}/{sub.selectQuantity}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {sub.options.map((o) => {
                            const n = picks.filter((id) => id === o.id).length
                            return (
                              <div key={o.id} className={`flex items-center justify-between gap-2 rounded-lg border bg-white px-2.5 py-2 ${n > 0 ? 'border-red-300 bg-red-50/40' : 'border-neutral-200'}`}>
                                <button type="button" onClick={() => pickSub(a.id, o.id, sub.selectQuantity)} aria-pressed={n > 0}
                                  className="flex min-w-0 flex-1 items-center gap-2 text-left">
                                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 ${sub.selectQuantity === 1 ? 'rounded-full' : 'rounded-md'} ${n > 0 ? 'border-red-600 bg-red-600 text-white' : 'border-neutral-300'}`}>
                                    {n > 0 && <Check size={10} strokeWidth={3} />}
                                  </span>
                                  <span className="truncate text-[13px] font-medium text-neutral-800">{o.name}</span>
                                </button>
                                <div className="flex shrink-0 items-center gap-2">
                                  {o.price > 0 && <span className="text-xs font-bold text-neutral-900">+ Rs. {o.price.toLocaleString()}</span>}
                                  {sub.selectQuantity > 1 && n > 0 && (
                                    <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1 py-0.5">
                                      <button type="button" onClick={() => unpickSub(a.id, o.id)} aria-label={`Remove one ${o.name}`}
                                        className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"><Minus size={10} /></button>
                                      <span className="w-4 text-center text-xs font-bold text-neutral-800">{n}</span>
                                      <button type="button" onClick={() => pickSub(a.id, o.id, sub.selectQuantity)} aria-label={`Add one ${o.name}`}
                                        className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-black"><Plus size={10} /></button>
                                    </div>
                                  )}
                                  {o.image && (
                                    <button type="button" onClick={() => pickSub(a.id, o.id, sub.selectQuantity)} tabIndex={-1} aria-hidden
                                      className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                                      <Image src={o.image} alt="" fill sizes="44px" className="object-cover" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {sub.isRequired && picks.length !== sub.selectQuantity && (
                          <p className="mt-1.5 text-[10px] font-medium text-amber-600 sm:text-[11px]">
                            Choose {sub.selectQuantity} option{sub.selectQuantity > 1 ? 's' : ''} to continue
                          </p>
                        )}
                      </div>
                    )}
                    </Fragment>
                  )
                })}
              </div>
              {g.isRequired && !g.addons.some((a) => (addonQtys[a.id] ?? 0) > 0) && (
                <p className="mt-1.5 text-[10px] font-medium text-amber-600 sm:text-[11px]">Select at least one to continue</p>
              )}
            </div>
          ))}

          <div className="px-3 pb-3 sm:px-5 sm:pb-4 md:px-6 lg:px-7">
            <SectionLabel>Special instructions</SectionLabel>
            <textarea value={instructions}
              onChange={(e) => { if (e.target.value.length <= 500) setInstructions(e.target.value) }}
              placeholder="Please enter instructions about this item"
              rows={4}
              className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[13px] text-neutral-700 shadow-sm outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-900 focus:shadow-md focus:ring-1 focus:ring-neutral-900 sm:px-4 sm:py-3 sm:text-sm md:rows-5" />
            <p className="mt-1 text-right text-[10px] text-neutral-400 sm:text-[11px]">{instructions.length}/500</p>
          </div>

          {/* ── FOOTER — frosted glass ───────────────────────────── */}
          {!storeOpen ? (
            /* ── Store closed / holiday banner ── */
            <div className={`footer-glass sticky bottom-0 mt-auto bg-white/85 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4 md:px-6 lg:px-7`}>
              <div className={`flex items-center justify-center gap-2 rounded-full px-5 py-3 text-center text-[13px] font-bold text-white sm:px-8 sm:py-3.5 sm:text-sm ${isHoliday ? 'bg-amber-500' : 'bg-red-600'}`}>
                <span>{isHoliday ? '🎌' : '🔴'}</span>
                <span>
                  {isHoliday
                    ? (holidayMessage ? `Holiday: ${holidayMessage}` : 'Closed for holiday')
                    : (closedMessage ?? 'Store is currently closed')}
                </span>
              </div>
            </div>

          ) : hasPrice && isOrderable ? (
            <div className="footer-glass sticky bottom-0 mt-auto flex items-center gap-2 bg-white/85 px-3 py-3 backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-4 md:px-6 lg:px-7">
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
                <button onClick={handleAdd}
                  className={`relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-full border px-5 py-3 text-[13px] font-bold transition-all sm:gap-2 sm:px-8 sm:py-3.5 sm:text-sm ${
                    added ? 'border-transparent bg-green-600 text-white' : 'shadow-md hover:opacity-95 active:scale-[0.99]'
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
                    </>
                  )}
                </button>
              </div>
            </div>

          ) : hasPrice && isOnSpot && isAvailableNow && !requiredGroupsFilled ? (
            <div className="footer-glass sticky bottom-0 mt-auto bg-white/85 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4 md:px-6 lg:px-7">
              <div className="rounded-2xl bg-amber-50 px-3.5 py-2.5 text-center text-[13px] font-semibold text-amber-700 sm:px-4 sm:py-3 sm:text-sm">
                Please select all required options to continue
              </div>
            </div>

          ) : hasPrice && itemOutsideHours ? (
            <div className="footer-glass sticky bottom-0 mt-auto flex items-center gap-2 bg-white/85 px-3 py-3 backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-4 md:px-6 lg:px-7">
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-full bg-red-600 px-5 py-3 text-center text-[12px] font-bold text-white xs:flex-row xs:gap-2 sm:px-8 sm:py-3.5 sm:text-sm">
                <span>Rs. {unitPrice.toLocaleString()}</span>
                <span className="hidden text-white/40 xs:inline">|</span>
                <span>Available {product.itemWindow ?? 'at specific hours'}</span>
              </div>
            </div>

          ) : hasPrice && isDeal && !isAvailableNow ? (
            <div className="footer-glass sticky bottom-0 mt-auto flex items-center gap-2 bg-white/85 px-3 py-3 backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-4 md:px-6 lg:px-7">
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-full bg-red-600 px-5 py-3 text-center text-[12px] font-bold text-white xs:flex-row xs:gap-2 sm:px-8 sm:py-3.5 sm:text-sm">
                <span>Rs. {unitPrice.toLocaleString()}</span>
                <span className="hidden text-white/40 xs:inline">|</span>
                <span>Available {dealMeta?.timeWindow ?? 'at specific hours'}</span>
              </div>
            </div>

          ) : (
            <div className="footer-glass sticky bottom-0 mt-auto bg-white/85 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4 md:px-6 lg:px-7">
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