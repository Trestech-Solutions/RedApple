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
  dealType?: 'fixed_deal' | 'on_spot_deal'
  dealMeta?: {
    dealId: number
    finalPrice: string
    timeWindow?: string | null
    isAvailableNow?: boolean
    includedItems?: { name: string; qty: number; extraCost?: number; availableAddons?: { id: number; name: string; price: string }[] }[]
    groups?: {
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

  const cartItem = items.find((i) =>
    hasSizes
      ? i.id === product.id && i.variantId === defaultSize!.sizeId
      : i.id === product.id && (i.selectedOption ?? '') === (defaultOption ?? '')
  )
  const cartQty = cartItem?.quantity ?? 0

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOrderable) return
    if (needsSelection) { onOpen?.(product); return }
    addItem({
      id: product.id, productId: product.productId, name: product.name,
      price: displayPriceNum, image: product.image,
      selectedOption: defaultOption || undefined,
      variantId: defaultSize ? defaultSize.sizeId : undefined,
      sizeFk:    defaultSize ? defaultSize.sizeFk  : undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (cartItem) updateQuantity(cartItem, cartItem.quantity + 1)
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation()
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
// CARD-1 (default) — horizontal: text left, image right
// FIX: image's overflow-hidden was clipping the -bottom-2/-right-2 "+" button.
// Now the outer image slot has NO overflow-hidden (so the button/badges can
// hang over the edge), and only an inner wrapper clips the <Image> itself.
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
      className={`group relative flex h-full items-stretch gap-2 rounded-2xl bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-xl sm:gap-4 sm:p-4 ${onOpen ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900' : ''}`}
    >
      {/* Text */}
      <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
        <div>
          {product.dealType && (
            <span className={`mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:text-[10px] ${product.dealType === 'on_spot_deal' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
              {product.dealType === 'on_spot_deal' ? '⚡ On Spot Deal' : 'Fixed Deal'}
            </span>
          )}
          <h3 className="text-base font-bold text-neutral-900 leading-snug line-clamp-2 sm:text-lg">{product.name}</h3>
          {product.description && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-400 sm:mt-2 sm:text-sm">{product.description}</p>}
          {product.dealMeta?.timeWindow && (
            <p className="mt-1 text-[10px] font-medium text-amber-600 sm:text-xs">
              🕐 {product.dealMeta.timeWindow}
              {product.dealMeta.isAvailableNow === false && <span className="ml-1 text-neutral-400">(not available now)</span>}
            </p>
          )}
        </div>
        {isOrderable && (
          <div className={`mt-2 flex items-baseline gap-1.5 sm:mt-3 sm:gap-2 ${priceRounded ? 'justify-center rounded-2xl px-3 py-2 border' : ''}`}
            style={{ ...(priceRounded && priceBg ? { backgroundColor: priceBg } : {}), ...(priceRounded && priceFg ? { color: priceFg } : {}), ...(priceRounded ? { borderColor: priceBorder || 'rgba(0,0,0,0.08)' } : {}) }}>
            {displayOriginal && <span className="text-xs line-through sm:text-sm text-neutral-400" style={priceFg ? { color: priceFg, opacity: 0.55 } : undefined}>Rs.{parseInt(displayOriginal, 10).toLocaleString()}</span>}
            <span className="text-base font-bold sm:text-lg text-neutral-900" style={priceFg ? { color: priceFg } : undefined}>Rs. {displayPriceNum.toLocaleString()}</span>
          </div>
        )}
        {!isOrderable && product.dealMeta && (
          <div className="mt-2 flex items-baseline gap-1.5 sm:mt-3 sm:gap-2">
            <span className="text-base font-bold text-neutral-900 sm:text-lg">Rs. {Math.round(parseFloat(product.dealMeta.finalPrice)).toLocaleString()}</span>
          </div>
        )}
        {isOrderable && !needsSelection && cartQty > 0 && (
          <div onClick={(e) => e.stopPropagation()} className="mt-2 flex w-fit items-center gap-1.5 rounded-full border-2 border-neutral-900 px-1.5 py-1 sm:gap-2 sm:px-2">
            <button type="button" onClick={handleDecrease} aria-label="Decrease" className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-900/10"><Minus size={13} /></button>
            <span className="w-5 text-center text-xs font-bold text-neutral-900 sm:w-6">{cartQty}</span>
            <button type="button" onClick={handleIncrease} aria-label="Increase" className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-800"><Plus size={13} /></button>
          </div>
        )}
      </div>

      {/* Image slot — NOT overflow-hidden, so badges/button can hang over the edge */}
      <div className="relative h-28 w-28 flex-shrink-0 sm:h-36 sm:w-36 md:h-40 md:w-40">
        {/* Inner clip wrapper — only this clips the <Image> */}
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-neutral-50">
          <Image src={product.image} alt={product.name} fill sizes="(min-width: 768px) 160px, 144px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
          {!isOrderable && !product.dealMeta && <span className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]"><span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-neutral-700 shadow">Coming Soon</span></span>}
        </div>

        {product.tag && showStack
          ? <span className="absolute left-1.5 top-1.5 z-10 rounded px-2 py-0.5 text-[9px] font-bold shadow-sm" style={{ backgroundColor: stackTagBg || '#fff', color: stackTagFg || '#000' }}>{product.tag}</span>
          : product.tag
          ? <span className="absolute left-1.5 top-1.5 z-10 rounded bg-white px-2 py-0.5 text-[9px] font-bold text-neutral-900 shadow-sm">{product.tag}</span>
          : null
        }
        {displayDiscount && <span className="absolute right-1.5 top-1.5 z-10 rounded px-2 py-0.5 text-[9px] font-bold shadow-sm" style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#000' }}>{displayDiscount}</span>}

        {isOrderable && (needsSelection || cartQty === 0) && (
          <button type="button" onClick={handleAdd} aria-label="Add to cart"
            className={`absolute -bottom-2 -right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all sm:h-9 sm:w-9 ${added ? 'bg-green-600 text-white' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}>
            {added ? <Check size={16} /> : <Plus size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD-2 — portrait: large image top, name + description + price, ADD button
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

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl ${onOpen ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900' : ''}`}
    >
      <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
        <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        {product.tag && showStack
          ? <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold shadow" style={{ backgroundColor: stackTagBg || '#f2c14e', color: stackTagFg || '#000' }}>{product.tag}</span>
          : product.tag
          ? <span className="absolute left-3 top-3 rounded-full bg-[#f2c14e] px-3 py-1 text-[10px] font-bold text-neutral-900 shadow">{product.tag}</span>
          : null
        }
        {displayDiscount && <span className="absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold shadow" style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#000' }}>{displayDiscount}</span>}
        {!isOrderable && !product.dealMeta && <span className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]"><span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-neutral-700 shadow">Coming Soon</span></span>}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-900 leading-snug line-clamp-2">{product.name}</h3>
        {product.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-500">{product.description}</p>}
        {product.dealMeta?.timeWindow && (
          <p className="mt-1.5 text-[10px] font-medium text-amber-600">🕐 {product.dealMeta.timeWindow}</p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            {displayOriginal && <span className="text-xs text-neutral-400 line-through">Rs.{parseInt(displayOriginal, 10).toLocaleString()}</span>}
            {(isOrderable || product.dealMeta) && (
              <span className="text-base font-bold text-[#1a6fa0]">
                Rs. {isOrderable ? displayPriceNum.toLocaleString() : Math.round(parseFloat(product.dealMeta!.finalPrice)).toLocaleString()}
              </span>
            )}
          </div>

          {isOrderable && !needsSelection && cartQty > 0 ? (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 rounded-full border-2 border-neutral-900 px-2 py-1">
              <button type="button" onClick={handleDecrease} className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-900/10"><Minus size={11} /></button>
              <span className="w-4 text-center text-xs font-bold text-neutral-900">{cartQty}</span>
              <button type="button" onClick={handleIncrease} className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-800"><Plus size={11} /></button>
            </div>
          ) : isOrderable ? (
            <button
              type="button"
              onClick={handleAdd}
              aria-label="Add to cart"
              className={`flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-bold transition-all ${added ? 'bg-green-600 text-white' : 'bg-[#1a6fa0] text-white hover:bg-[#155a82]'}`}
            >
              {added ? <Check size={14} /> : <Plus size={14} />}
              {added ? 'Added' : 'ADD'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD-3 — portrait: full image background, name/description overlay bottom,
// price + full-width "ADD TO CART" button at bottom
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

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl ${onOpen ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900' : ''}`}
    >
      <div className="relative h-52 w-full overflow-hidden bg-neutral-100">
        <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        {product.tag && showStack
          ? <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold shadow" style={{ backgroundColor: stackTagBg || '#f2c14e', color: stackTagFg || '#000' }}>{product.tag}</span>
          : product.tag
          ? <span className="absolute left-3 top-3 rounded-full bg-[#f2c14e] px-3 py-1 text-[10px] font-bold text-neutral-900 shadow">{product.tag}</span>
          : null
        }
        {displayDiscount && <span className="absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold shadow" style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#000' }}>{displayDiscount}</span>}
        {!isOrderable && !product.dealMeta && <span className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]"><span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-neutral-700 shadow">Coming Soon</span></span>}
      </div>

      <div className="flex flex-col gap-1 px-4 pt-4 pb-3">
        <h3 className="text-sm font-bold text-neutral-900 leading-snug line-clamp-2">{product.name}</h3>
        {product.description && <p className="text-xs leading-relaxed text-neutral-400 line-clamp-2">{product.description}</p>}
        {product.dealMeta?.timeWindow && <p className="text-[10px] font-medium text-amber-600">🕐 {product.dealMeta.timeWindow}</p>}
        <div className="mt-1 flex items-baseline gap-1.5">
          {displayOriginal && <span className="text-xs text-neutral-400 line-through">Rs.{parseInt(displayOriginal, 10).toLocaleString()}</span>}
          {(isOrderable || product.dealMeta) && (
            <span className="text-base font-bold text-neutral-900">
              Rs. {isOrderable ? displayPriceNum.toLocaleString() : Math.round(parseFloat(product.dealMeta!.finalPrice)).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        {isOrderable && !needsSelection && cartQty > 0 ? (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-3 rounded-full border-2 border-neutral-900 py-2">
            <button type="button" onClick={handleDecrease} className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-900/10"><Minus size={14} /></button>
            <span className="min-w-[1.5rem] text-center text-sm font-bold text-neutral-900">{cartQty}</span>
            <button type="button" onClick={handleIncrease} className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-800"><Plus size={14} /></button>
          </div>
        ) : isOrderable ? (
          <button
            type="button"
            onClick={handleAdd}
            aria-label="Add to cart"
            className={`w-full rounded-full py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${added ? 'bg-green-600 text-white' : 'bg-[#c0392b] text-white hover:bg-[#a93226]'}`}
          >
            {added ? '✓ Added' : 'Add to Cart'}
          </button>
        ) : null}
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
  return <Card1 product={product} onOpen={onOpen} />
}