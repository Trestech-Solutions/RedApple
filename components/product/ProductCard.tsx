'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Minus, Plus } from 'lucide-react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'

export interface SizeMeta {
  sizeId: number
  sizeFk: number
  sizeName: string
  price: number
  originalPrice?: number
  discountLabel?: string
  hasDiscountTag?: boolean
}

export interface ProductData {
  id: string
  productId: number | null
  name: string
  description: string
  timeDuration?: string
  price: string
  originalPrice?: string
  fromLabel?: boolean
  options: string[]
  tag?: string
  discount?: string
  image: string
  sizes?: SizeMeta[]
  /** Per-item price/button text colour override (hex). Overrides global item_price_text_color. */
  textButtonColor?: string
  /** Cart-row style identifier — drives visual treatment in CartDrawer (e.g. 'highlight', 'compact'). */
  cartStyle?: string
  dealType?: 'fixed_deal' | 'on_spot_deal'
  dealMeta?: {
    dealId: number
    finalPrice: string
    timeWindow?: string | null
    isAvailableNow?: boolean
    includedItems?: { name: string; qty: number; extraCost?: number; availableAddons?: { id: number; name: string; price: string }[] }[]
    groups?: {
      id: number      // OnSpotDealGroup.id — needed for order payload
      name: string
      isRequired: boolean
      selectQty: number
      options: {
        id: number | null
        name: string
        qty: number
        maxQty: number | null
        extraCost?: number   // extra charge when this option is selected
      }[]
    }[]
  }
}

interface ProductCardProps {
  product: ProductData
  onOpen?: (product: ProductData) => void
}

// ─── Shared cart logic hook ───────────────────────────────────────────────────

function useCardLogic(product: ProductData, onOpen?: (p: ProductData) => void) {
  const { addItem, items, updateQuantity, removeItem } = useCart()
  const { settings } = useStoreSettings()
  const [added, setAdded] = useState(false)

  const hasSizes    = !!product.sizes && product.sizes.length > 0
  const defaultSize = hasSizes ? product.sizes![0]! : undefined
  const defaultOption = product.options[0] ?? ''

  const needsSelection =
    !!product.dealMeta ||
    (hasSizes && product.sizes!.length > 1) ||
    (!hasSizes && product.options.length > 1)

  const displayPriceNum = defaultSize
    ? defaultSize.price
    : product.dealMeta
    ? (Math.round(parseFloat(product.dealMeta.finalPrice)) || 0)
    : (parseInt(product.price, 10) || 0)
  const displayPriceStr = String(displayPriceNum)
  const displayOriginal = defaultSize
    ? (defaultSize.originalPrice != null ? String(defaultSize.originalPrice) : undefined)
    : product.originalPrice
  const displayDiscount = defaultSize
    ? (defaultSize.hasDiscountTag ? defaultSize.discountLabel : undefined)
    : product.discount

  const hasPrice    = displayPriceStr !== '' && displayPriceNum > 0
  const isOrderable = hasPrice && (
    product.dealMeta
      ? product.dealMeta.dealId != null
      : product.productId !== null && product.productId !== undefined
  )

  // All cart lines that belong to this product, across every chosen
  // size/option/deal-group combo. A product with multiple sizes can have
  // several distinct cart lines (Large qty 2, Medium qty 1, etc) — we sum
  // them so the card always reflects the true total, no matter which
  // variant was actually added via the modal.
  const productCartItems = items.filter((i) => i.id === product.id)
  const cartQty = productCartItems.reduce((sum, i) => sum + i.quantity, 0)

  // Only meaningful for direct +/- when there's a single, unambiguous
  // variant (no sizes/options/deal to choose from).
  const cartItem = !needsSelection
    ? items.find((i) =>
        hasSizes
          ? i.id === product.id && i.variantId === defaultSize!.sizeId
          : i.id === product.id && (i.selectedOption ?? '') === (defaultOption ?? '')
      )
    : undefined

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOrderable) return
    if (needsSelection) { onOpen?.(product); return }
    addItem({
      id: product.id, productId: product.productId, name: product.name,
      price: displayPriceNum, image: product.image,
      originalPrice: (() => {
        const orig = displayOriginal ? parseInt(displayOriginal, 10) : undefined
        return orig != null && !isNaN(orig) && orig > displayPriceNum ? orig : undefined
      })(),
      selectedOption: defaultOption || undefined,
      variantId: defaultSize ? defaultSize.sizeId : undefined,
      sizeFk:    defaultSize ? defaultSize.sizeFk  : undefined,
      cartStyle: product.cartStyle || undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Which variant to bump is ambiguous when sizes/options/deal-groups
    // exist — send the person to the modal instead of guessing.
    if (needsSelection) { onOpen?.(product); return }
    if (cartItem) updateQuantity(cartItem, cartItem.quantity + 1)
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (needsSelection) { onOpen?.(product); return }
    if (!cartItem) return
    if (cartItem.quantity <= 1) removeItem(cartItem)
    else updateQuantity(cartItem, cartItem.quantity - 1)
  }

  return {
    settings, added, hasSizes, defaultSize, defaultOption, needsSelection,
    displayPriceNum, displayOriginal, displayDiscount, hasPrice, isOrderable,
    cartItem, cartQty, handleAdd, handleIncrease, handleDecrease,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE STRATEGY (applies to all 3 designs)
// ─────────────────────────────────────────────────────────────────────────────
// 1. Type and spacing are FLUID (clamp) instead of stepping at breakpoints, so
//    a card looks right at 320px, at 390px, and on a 27" monitor — no jumps.
// 2. Reserved slots for optional content (deal badge, description, time
//    window) are sized in `em`, not px. They now grow WITH the text they hold,
//    so the slot can never clip or leave a gap as the font scales.
// 3. Touch targets are >= 36px on mobile and grow from there; icons are sized
//    with classes so a single element covers every breakpoint.
// 4. `h-full` + `min-w-0` everywhere so cards stretch evenly in a grid and
//    long names truncate instead of pushing the layout sideways.
// 5. Motion is user-triggered only, and `motion-reduce` opts out of it.
// ─────────────────────────────────────────────────────────────────────────────

const CARD_SHELL =
  'group relative h-full bg-white ring-1 ring-black/[0.06] transition-[box-shadow,transform,border-color] duration-200 motion-reduce:transition-none'

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2'

/** Small rounded chip used for stack tags / discounts / status pills. */
function Chip({
  children, className = '', style,
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-[0.5em] py-[0.25em] text-[clamp(0.5rem,1.6vw,0.688rem)] font-semibold leading-none shadow-sm ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD-1 (default) — horizontal: text left, SMALL image right (matches
// not stretched to full card height; price is plain bold text, no pill,
// unless the store explicitly turns price_rounder_center on).
// ─────────────────────────────────────────────────────────────────────────────

function Card1({ product, onOpen }: ProductCardProps) {
  const {
    settings, added, needsSelection,
    displayPriceNum, displayOriginal, displayDiscount, isOrderable,
    cartQty, handleAdd, handleIncrease, handleDecrease,
  } = useCardLogic(product, onOpen)

  const priceBg      = settings.item_price_background
  const priceFg      = settings.item_price_text_color
  const priceBorder  = settings.item_price_border_color
  const discountBg   = settings.discount_background_color
  const discountFg   = settings.discount_text_color
  const stackTagBg   = settings.stack_tag_background_color
  const stackTagFg   = settings.stack_tag_color
  const priceRounded = Boolean(settings.price_rounder_center)
  const showStack    = Boolean(settings.show_stack_tag_on_item)

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      className={`${CARD_SHELL} flex items-stretch gap-3 rounded-2xl p-3 hover:ring-black/10 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)] ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      {/* Text column */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          {/* Deal badge — only takes space when present */}
          {/* {product.dealType && (
            <div className="mb-1">
              <Chip className={product.dealType === 'on_spot_deal' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'}>
                {product.dealType === 'on_spot_deal' ? '⚡ On spot deal' : 'Fixed deal'}
              </Chip>
            </div>
          )} */}

          {/* Title */}
          <h3 className="line-clamp-2  sm:text-[20px] font-bold leading-snug tracking-[-0.01em] text-neutral-900 sm:text-base">
            {product.name}
          </h3>

          {/* Description — only takes space when present */}
          {product.description && (
            <p className="mt-3 line-clamp-2 text-[14.5px] leading-snug text-neutral-500 sm:text-[15px]">
              {product.description}
            </p>
          )}

          {/* Time window — only takes space when present */}
          {product.dealMeta?.timeWindow && (
            <p className="mt-1 truncate text-[11px] font-medium leading-snug text-amber-600 sm:text-xs">
              🕐 {product.dealMeta.timeWindow}
              {product.dealMeta.isAvailableNow === false && <span className="ml-1 text-neutral-400">(not available now)</span>}
            </p>
          )}
        </div>

        {/* Price row */}
        {(isOrderable || product.dealMeta) && (
          <div
            className={`mt-2 flex items-baseline gap-x-1.5 ${
              priceRounded ? 'w-fit rounded-xl border px-2.5 py-1' : 'flex-wrap gap-y-0.5'
            }`}
            style={{
              ...(priceRounded && priceBg ? { backgroundColor: priceBg } : {}),
              ...(priceRounded ? { borderColor: priceBorder || 'rgba(0,0,0,0.08)' } : {}),
            }}
          >
            {isOrderable && displayOriginal && (
              <span
                className={`whitespace-nowrap text-[12px] line-through sm:text-[13px] ${
                  priceRounded ? 'opacity-70' : 'text-neutral-400'
                }`}
                style={priceRounded ? { color: priceFg || '#fff' } : undefined}
              >
                Rs.{parseInt(displayOriginal, 10).toLocaleString()}
              </span>
            )}
            <span
              className="whitespace-nowrap text-[15px] font-bold tracking-[-0.01em] sm:text-base"
              style={priceRounded ? { color: priceFg || '#fff' } : { color: '#171717' }}
            >
              Rs. {isOrderable ? displayPriceNum.toLocaleString() : Math.round(parseFloat(product.dealMeta!.finalPrice)).toLocaleString()}
            </span>
          </div>
        )}

        {/* Qty stepper — only takes space when item is already in cart */}
        {isOrderable && !needsSelection && cartQty > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-2 flex h-7 w-fit items-center gap-1 rounded-full border px-1"
            style={{ borderColor: priceBorder || priceBg || '#171717' }}
          >
            <button
              type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
              className={`flex h-5 w-5 items-center justify-center rounded-full transition-opacity hover:opacity-70 active:scale-95 ${FOCUS_RING}`}
              style={{ color: priceBg || '#171717' }}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[1rem] text-center text-[13px] font-bold tabular-nums" style={{ color: priceBg || '#171717' }}>
              {cartQty}
            </span>
            <button
              type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
              className={`flex h-5 w-5 items-center justify-center rounded-full transition-opacity hover:opacity-90 active:scale-95 ${FOCUS_RING}`}
              style={{ backgroundColor: priceBg || '#171717', color: priceFg || '#ffffff' }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Image — small, fixed, self-centered */}
      <div className="relative aspect-square w-34 flex-shrink-0 self-center sm:w-42">
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-neutral-50">
          <Image
            src={product.image} alt={product.name} fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          {!isOrderable && !product.dealMeta && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
              <Chip className="bg-white/95 text-neutral-700">Coming soon</Chip>
            </span>
          )}
        </div>

        {product.tag && (
          <span className="absolute left-1 top-1 z-10">
            <Chip
              className={showStack ? '' : 'bg-white text-neutral-900'}
              style={showStack ? { backgroundColor: stackTagBg || '#fff', color: stackTagFg || '#000' } : undefined}
            >
              {product.tag}
            </Chip>
          </span>
        )}
        {displayDiscount && (
          <span className="absolute right-1 top-1 z-10">
            <Chip style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#000' }}>{displayDiscount}</Chip>
          </span>
        )}

        {isOrderable && (needsSelection || cartQty === 0) && (
          <button
            type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
            className={`absolute -bottom-1 -right-1 z-20 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-transform duration-150 hover:opacity-90 active:scale-90 ${FOCUS_RING} ${added ? 'bg-green-600 text-white' : ''}`}
            style={!added ? {
              backgroundColor: priceBg || '#171717',
              color:           priceFg || '#ffffff',
            } : {}}
          >
            {added
              ? <Check className="h-3.5 w-3.5" strokeWidth={3} />
              : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD-2 — portrait: 4:3 image top, name + description, price and action inline
// ─────────────────────────────────────────────────────────────────────────────

function Card2({ product, onOpen }: ProductCardProps) {
  const {
    settings, added, needsSelection,
    displayPriceNum, displayOriginal, displayDiscount, isOrderable,
    cartQty, handleAdd, handleIncrease, handleDecrease,
  } = useCardLogic(product, onOpen)

  const discountBg = settings.discount_background_color
  const discountFg = settings.discount_text_color
  const stackTagBg = settings.stack_tag_background_color
  const stackTagFg = settings.stack_tag_color
  const showStack  = Boolean(settings.show_stack_tag_on_item)
  const btnBg     = settings.item_price_background  || '#d63a2b'
  const btnFg     = settings.item_price_text_color  || '#ffffff'
  const btnBorder = settings.item_price_border_color || btnBg

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  const priceLabel = isOrderable
    ? displayPriceNum.toLocaleString()
    : product.dealMeta
    ? Math.round(parseFloat(product.dealMeta.finalPrice)).toLocaleString()
    : ''

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      className={`${CARD_SHELL} flex flex-col overflow-hidden rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.25)] ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      {/* Square image, full-bleed */}
      <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden bg-neutral-100">
        <Image
          src={product.image} alt={product.name} fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover"
        />

        {product.tag && (
          <span className="absolute left-2 top-2">
            <Chip
              className={showStack ? '' : 'bg-[#f2c14e] text-neutral-900'}
              style={showStack ? { backgroundColor: stackTagBg || '#f2c14e', color: stackTagFg || '#000' } : undefined}
            >
              {product.tag}
            </Chip>
          </span>
        )}

        {/* Discount tag — bottom-right, rounded rectangle (not a pill) */}
        {displayDiscount && (
          <span
            className="absolute bottom-1.5 right-1.5 rounded-lg px-[clamp(0.5rem,1.6vw,0.75rem)] py-[clamp(0.25rem,0.9vw,0.375rem)] text-[clamp(0.688rem,1.7vw,0.875rem)] font-extrabold uppercase leading-none"
            style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#171717' }}
          >
            {displayDiscount}
          </span>
        )}

        {!isOrderable && !product.dealMeta && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <Chip className="bg-white/95 text-neutral-700">Coming soon</Chip>
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-[clamp(0.625rem,2vw,1.25rem)] pb-[clamp(0.75rem,2.2vw,1.25rem)] pt-[clamp(0.625rem,2vw,1.125rem)]">
        <h3 className="line-clamp-1 text-[clamp(0.813rem,2vw,1.125rem)] font-extrabold uppercase leading-tight tracking-[-0.005em] text-neutral-900">
          {product.name}
        </h3>

        {/* Two-line description slot, reserved so cards stay level */}
        <p className="mt-[clamp(0.5rem,2.4vw,1.25rem)] line-clamp-2 min-h-[2.8em] text-[clamp(0.688rem,1.6vw,0.938rem)] leading-[1.4] text-neutral-500">
          {product.description || '\u00A0'}
        </p>

        {product.dealMeta?.timeWindow && (
          <span className="mt-1 w-fit max-w-full truncate text-[clamp(0.594rem,1.4vw,0.75rem)] font-medium text-amber-600">
            🕐 {product.dealMeta.timeWindow}
          </span>
        )}

        {/* Price left, ADD right */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-[clamp(0.625rem,2.2vw,1.25rem)]">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {isOrderable && displayOriginal && (
              <span className="whitespace-nowrap text-[clamp(0.688rem,1.6vw,0.938rem)] text-neutral-400 line-through">
                Rs.{parseInt(displayOriginal, 10).toLocaleString()}
              </span>
            )}
            {(isOrderable || product.dealMeta) && (
              <span className="whitespace-nowrap text-[clamp(0.875rem,2.1vw,1.25rem)] font-extrabold tracking-[-0.01em] text-neutral-900">
                Rs. {priceLabel}
              </span>
            )}
          </div>

          {isOrderable && !needsSelection && cartQty > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex h-[clamp(1.875rem,5vw,2.5rem)] flex-shrink-0 items-center gap-1 rounded-lg border px-1"
              style={{ borderColor: btnBorder }}
            >
              <button
                type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
                className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-md hover:opacity-70 active:scale-95 motion-reduce:active:scale-100 ${FOCUS_RING}`}
                style={{ color: btnBg }}
              >
                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="min-w-[1rem] text-center text-[clamp(0.75rem,1.6vw,0.938rem)] font-bold tabular-nums" style={{ color: btnBg }}>
                {cartQty}
              </span>
              <button
                type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
                className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-md hover:opacity-90 active:scale-95 motion-reduce:active:scale-100 ${FOCUS_RING}`}
                style={{ backgroundColor: btnBg, color: btnFg }}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          ) : isOrderable ? (
            <button
              type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
              className={`flex-shrink-0 rounded-lg px-[clamp(0.875rem,2.6vw,1.5rem)] py-[clamp(0.5rem,1.5vw,0.75rem)] text-[clamp(0.688rem,1.6vw,0.938rem)] font-extrabold uppercase leading-none tracking-wide transition-transform duration-150 hover:opacity-90 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${FOCUS_RING} ${added ? 'bg-green-600 text-white' : ''}`}
              style={!added ? { backgroundColor: btnBg, color: btnFg } : {}}
            >
              {added ? '✓ Added' : 'Add'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD-3 — portrait: tall image, name/description below, full-width add button
// ─────────────────────────────────────────────────────────────────────────────

function Card3({ product, onOpen }: ProductCardProps) {
  const {
    settings, added, needsSelection,
    displayPriceNum, displayOriginal, displayDiscount, isOrderable,
    cartQty, handleAdd, handleIncrease, handleDecrease,
  } = useCardLogic(product, onOpen)

  const discountBg = settings.discount_background_color
  const discountFg = settings.discount_text_color
  const stackTagBg = settings.stack_tag_background_color
  const stackTagFg = settings.stack_tag_color
  const showStack  = Boolean(settings.show_stack_tag_on_item)
  const btnBg     = settings.item_price_background  || '#c0392b'
  const btnFg     = settings.item_price_text_color  || '#ffffff'
  const btnBorder = settings.item_price_border_color || btnBg

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      className={`${CARD_SHELL} flex flex-col overflow-hidden rounded-[clamp(0.75rem,2.2vw,1.125rem)] hover:ring-black/10 hover:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.25)] ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      {/* 3:2 image keeps the same silhouette from a 2-up phone grid to a 5-up desktop grid */}
      <div className="relative aspect-[3/2] w-full flex-shrink-0 overflow-hidden bg-neutral-100">
        <Image
          src={product.image} alt={product.name} fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {product.tag && (
          <span className="absolute left-2 top-2 sm:left-3 sm:top-3">
            <Chip
              className={showStack ? '' : 'bg-[#f2c14e] text-neutral-900'}
              style={showStack ? { backgroundColor: stackTagBg || '#f2c14e', color: stackTagFg || '#000' } : undefined}
            >
              {product.tag}
            </Chip>
          </span>
        )}
        {displayDiscount && (
          <span className="absolute right-2 top-2 sm:right-3 sm:top-3">
            <Chip style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#000' }}>{displayDiscount}</Chip>
          </span>
        )}
        {!isOrderable && !product.dealMeta && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
            <Chip className="bg-white/95 text-neutral-700">Coming soon</Chip>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-[clamp(0.625rem,2vw,1rem)] pb-[clamp(0.375rem,1.2vw,0.625rem)] pt-[clamp(0.625rem,1.8vw,1rem)]">
        {/* Two-line title slot that scales with the font */}
        <h3 className="line-clamp-2 min-h-[2.6em] text-[clamp(0.781rem,1.9vw,1rem)] font-semibold leading-[1.3] tracking-[-0.01em] text-neutral-900">
          {product.name}
        </h3>

        {/* Two-line description slot — reserved even when empty */}
        <p className="mt-[0.3em] line-clamp-2 min-h-[2.8em] text-[clamp(0.656rem,1.5vw,0.875rem)] leading-[1.4] text-neutral-500">
          {product.description || '\u00A0'}
        </p>

        {/* Reserved slot for deal time window */}
        <div className="mt-[0.3em] h-[1.4em] text-[clamp(0.563rem,1.4vw,0.75rem)]">
          {product.dealMeta?.timeWindow && (
            <p className="truncate font-medium leading-[1.4] text-amber-600">🕐 {product.dealMeta.timeWindow}</p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pt-[clamp(0.25rem,1vw,0.5rem)]">
          {isOrderable && displayOriginal && (
            <span className="text-[clamp(0.656rem,1.5vw,0.813rem)] text-neutral-400 line-through">
              Rs.{parseInt(displayOriginal, 10).toLocaleString()}
            </span>
          )}
          {(isOrderable || product.dealMeta) && (
            <span className="text-[clamp(0.875rem,2vw,1.125rem)] font-bold tracking-[-0.01em] text-neutral-900">
              Rs. {isOrderable ? displayPriceNum.toLocaleString() : Math.round(parseFloat(product.dealMeta!.finalPrice)).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="px-[clamp(0.625rem,2vw,1rem)] pb-[clamp(0.625rem,2vw,1rem)]">
        {isOrderable && !needsSelection && cartQty > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[clamp(2.125rem,6vw,2.75rem)] items-center justify-center gap-3 rounded-full border-2"
            style={{ borderColor: btnBorder }}
          >
            <button
              type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
              className={`flex aspect-square h-[calc(100%-8px)] items-center justify-center rounded-full hover:opacity-70 active:scale-95 motion-reduce:active:scale-100 ${FOCUS_RING}`}
              style={{ color: btnBg }}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[1.5rem] text-center text-[clamp(0.75rem,1.7vw,0.938rem)] font-bold tabular-nums" style={{ color: btnBg }}>{cartQty}</span>
            <button
              type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
              className={`flex aspect-square h-[calc(100%-8px)] items-center justify-center rounded-full hover:opacity-90 active:scale-95 motion-reduce:active:scale-100 ${FOCUS_RING}`}
              style={{ backgroundColor: btnBg, color: btnFg }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : isOrderable ? (
          <button
            type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
            className={`h-[clamp(2.125rem,6vw,2.75rem)] w-full rounded-full border text-[clamp(0.688rem,1.6vw,0.938rem)] font-semibold tracking-[0.01em] transition-transform duration-150 hover:opacity-90 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${FOCUS_RING} ${added ? 'border-transparent bg-green-600 text-white' : ''}`}
            style={!added ? { backgroundColor: btnBg, color: btnFg, borderColor: btnBorder } : {}}
          >
            {added ? '✓ Added' : 'Add to cart'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
function Card4({ product, onOpen }: ProductCardProps) {
  const {
    settings, added, needsSelection, hasSizes,
    displayPriceNum, displayOriginal, displayDiscount, isOrderable,
    cartQty, handleAdd, handleIncrease, handleDecrease,
  } = useCardLogic(product, onOpen)

  const discountBg = settings.discount_background_color
  const discountFg = settings.discount_text_color
  const stackTagBg = settings.stack_tag_background_color
  const stackTagFg = settings.stack_tag_color
  const showStack  = Boolean(settings.show_stack_tag_on_item)
  const btnBg     = settings.item_price_background  || '#e8352a'
  const btnFg     = settings.item_price_text_color  || '#ffffff'
  const btnBorder = settings.item_price_border_color || btnBg
  const priceColor = '#3d8b37' // green price, matches screenshot

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  const priceLabel = isOrderable
    ? displayPriceNum.toLocaleString()
    : product.dealMeta
    ? Math.round(parseFloat(product.dealMeta.finalPrice)).toLocaleString()
    : ''

  // "FROM" label shows when the product has multiple sizes/options
  const showFrom = product.fromLabel || (hasSizes && product.sizes!.length > 1)

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      className={`group relative flex h-full flex-col rounded-[clamp(1rem,3vw,1.75rem)] border-2 border-neutral-200 bg-white p-[clamp(0.5rem,1.4vw,0.75rem)] transition-shadow duration-200 hover:shadow-[0_14px_32px_-14px_rgba(0,0,0,0.3)] motion-reduce:transition-none ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      {/* Inset square image with its own rounded corners */}
      <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-[clamp(0.5rem,1.2vw,0.75rem)] bg-neutral-100">
        <Image
          src={product.image} alt={product.name} fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />

        {product.tag && (
          <span className="absolute left-2 top-2">
            <Chip
              className={showStack ? '' : 'bg-[#f2c14e] text-neutral-900'}
              style={showStack ? { backgroundColor: stackTagBg || '#f2c14e', color: stackTagFg || '#000' } : undefined}
            >
              {product.tag}
            </Chip>
          </span>
        )}
        {displayDiscount && (
          <span className="absolute right-2 top-2">
            <Chip style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#000' }}>{displayDiscount}</Chip>
          </span>
        )}
        {!isOrderable && !product.dealMeta && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <Chip className="bg-white/95 text-neutral-700">Coming soon</Chip>
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-[clamp(0.375rem,1.2vw,0.75rem)] pb-[clamp(0.25rem,0.8vw,0.5rem)] pt-[clamp(0.625rem,2vw,1.25rem)]">
        <h3 className="line-clamp-2 text-[clamp(0.875rem,2.2vw,1.5rem)] font-extrabold uppercase leading-[1.1] tracking-[-0.005em] text-neutral-900">
          {product.name}
        </h3>

        {product.description && (
          <p className="mt-1.5 line-clamp-2 text-[clamp(0.688rem,1.5vw,0.875rem)] leading-[1.4] text-neutral-500">
            {product.description}
          </p>
        )}

        {product.dealMeta?.timeWindow && (
          <p className="mt-1 truncate text-[clamp(0.594rem,1.4vw,0.75rem)] font-medium text-amber-600">
            🕐 {product.dealMeta.timeWindow}
          </p>
        )}

        {/* Price left, round + button right */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-[clamp(1.5rem,5vw,3.5rem)]">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-[0.4em] gap-y-0.5 pb-[0.15em]">
            {showFrom && (
              <span className="text-[clamp(0.563rem,1.3vw,0.813rem)] font-extrabold uppercase tracking-wide" style={{ color: priceColor }}>
                From
              </span>
            )}
            {isOrderable && displayOriginal && (
              <span className="whitespace-nowrap text-[clamp(0.625rem,1.4vw,0.813rem)] text-neutral-400 line-through">
                Rs.{parseInt(displayOriginal, 10).toLocaleString()}
              </span>
            )}
            {(isOrderable || product.dealMeta) && (
              <span className="whitespace-nowrap text-[clamp(1rem,2.8vw,1.875rem)] font-extrabold uppercase leading-none tracking-[-0.01em]" style={{ color: priceColor }}>
                Rs. {priceLabel}
              </span>
            )}
          </div>

          {isOrderable && !needsSelection && cartQty > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex h-[clamp(2.25rem,6vw,3.25rem)] flex-shrink-0 items-center gap-1 rounded-full border-2 px-1"
              style={{ borderColor: btnBorder }}
            >
              <button
                type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
                className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-full hover:opacity-70 active:scale-95 motion-reduce:active:scale-100 ${FOCUS_RING}`}
                style={{ color: btnBg }}
              >
                <Minus className="h-4 w-4" strokeWidth={3} />
              </button>
              <span className="min-w-[1.25rem] text-center text-[clamp(0.813rem,1.8vw,1.063rem)] font-extrabold tabular-nums" style={{ color: btnBg }}>
                {cartQty}
              </span>
              <button
                type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
                className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-full hover:opacity-90 active:scale-95 motion-reduce:active:scale-100 ${FOCUS_RING}`}
                style={{ backgroundColor: btnBg, color: btnFg }}
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          ) : isOrderable ? (
            <button
              type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
              className={`flex h-[clamp(2.25rem,6.5vw,3.5rem)] w-[clamp(2.25rem,6.5vw,3.5rem)] flex-shrink-0 items-center justify-center rounded-full shadow-sm transition-transform duration-150 hover:opacity-90 active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100 ${FOCUS_RING} ${added ? 'bg-green-600 text-white' : ''}`}
              style={!added ? { backgroundColor: btnBg, color: btnFg } : {}}
            >
              {added
                ? <Check className="h-[55%] w-[55%]" strokeWidth={3} />
                : <Plus className="h-[60%] w-[60%]" strokeWidth={3} />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const { settings } = useStoreSettings()
  const design = (settings.product_card_design as string | undefined) ?? 'card-1'

  if (design === 'card-2') return <Card2 product={product} onOpen={onOpen} />
  if (design === 'card-3') return <Card3 product={product} onOpen={onOpen} />
  if (design === 'card-4') return <Card4 product={product} onOpen={onOpen} />
  return <Card1 product={product} onOpen={onOpen} />
}