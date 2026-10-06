'use client'

/**
 * Card1 — Horizontal layout
 * Size controlled via IMG (image px) and PAD (padding px).
 */

import Image from 'next/image'
import { Check, Minus, Plus } from 'lucide-react'
import { useCardLogic, FOCUS_RING, Chip, type ProductCardProps } from './shared'

const FONT_FAMILY = 'Poppins, "Poppins Fallback", sans-serif'

// ── SIZE CONTROLS ─────────────────────────────
const IMG = 160   // image side (px)  → card height = IMG + PAD*2
const PAD = 16    // card padding (px)
const GAP = 16    // gap between text and image (px)
const TITLE = 17  // title font size (px)
const DESC = 13   // description font size (px)
const PRICE = 19  // price font size (px)
const BTN = 36    // add button size (px)
// ──────────────────────────────────────────────

export function Card1({ product, onOpen }: ProductCardProps) {
  const {
    settings, added, needsSelection,
    displayPriceNum, displayOriginal, displayDiscount, isOrderable,
    cartQty, handleAdd, handleIncrease, handleDecrease, storeClosed,
  } = useCardLogic(product, onOpen)

  const priceBg     = settings.item_price_background
  const priceFg     = settings.item_price_text_color
  const priceBorder = settings.item_price_border_color
  const discountBg  = settings.discount_background_color
  const discountFg  = settings.discount_text_color
  const btnColor    = priceBg || '#000000'
  const btnFg       = priceFg || '#ffffff'

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      style={{ fontFamily: FONT_FAMILY, padding: PAD, gap: GAP }}
      className={`group relative flex items-stretch justify-between rounded-2xl bg-white text-[#0A0A0A] shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_20px_-6px_rgba(0,0,0,0.15)] ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      {/* Text column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3
          className="line-clamp-2 font-bold text-[#0A0A0A]"
          style={{ fontSize: TITLE, lineHeight: 1.3 }}
        >
          {product.name}
        </h3>

        {product.description && (
          <p
            className="mt-4 line-clamp-3 whitespace-pre-line font-normal text-neutral-400"
            style={{ fontSize: DESC, lineHeight: 1.6 }}
          >
            {product.description}
          </p>
        )}

        {product.dealMeta?.timeWindow && (
          <p className="mt-1 truncate text-xs font-medium text-amber-600">
            🕐 {product.dealMeta.timeWindow}
            {product.dealMeta.isAvailableNow === false && (
              <span className="ml-1 text-neutral-300">(not available now)</span>
            )}
          </p>
        )}

        <div className="flex-1" />

        {/* Price + stepper: stacked on mobile, inline on sm+ */}
        <div className="flex flex-col items-start gap-1.5 pl-[5px] sm:flex-row sm:items-center sm:gap-3">
          {(isOrderable || product.dealMeta) && (
            <div className="flex items-baseline gap-1.5">
              {isOrderable && displayOriginal && (
                <span className="font-normal leading-none text-neutral-400 line-through" style={{ fontSize: DESC }}>
                  Rs.{parseInt(displayOriginal, 10).toLocaleString()}
                </span>
              )}
              <span className="font-bold tracking-normal text-[#0A0A0A]" style={{ fontSize: PRICE, lineHeight: 1.5 }}>
                Rs.{' '}
                {isOrderable
                  ? displayPriceNum.toLocaleString()
                  : Math.round(parseFloat(product.dealMeta!.finalPrice)).toLocaleString()}
              </span>
            </div>
          )}

          {isOrderable && !needsSelection && cartQty > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 items-center gap-0.5 rounded-full border px-1"
              style={{ borderColor: priceBorder || btnColor }}
            >
              <button type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-opacity hover:opacity-70 active:scale-95 ${FOCUS_RING}`}
                style={{ color: btnColor }}>
                <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <span className="min-w-[1.25rem] text-center text-sm font-semibold leading-none tabular-nums" style={{ color: btnColor }}>
                {cartQty}
              </span>
              <button type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-opacity hover:opacity-90 active:scale-95 ${FOCUS_RING}`}
                style={{ backgroundColor: btnColor, color: btnFg }}>
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="relative flex-shrink-0" style={{ width: IMG, height: IMG }}>
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-neutral-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes={`${IMG}px`}
            quality={80}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
          />
          {!isOrderable && !product.dealMeta && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <Chip className="bg-white/95 text-[11px] text-neutral-700">Coming soon</Chip>
            </span>
          )}
        </div>

        {displayDiscount && (
          <span className="absolute right-1.5 top-1.5 z-10">
            <Chip style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#000' }}>
              {displayDiscount}
            </Chip>
          </span>
        )}

        {isOrderable && (needsSelection || cartQty === 0) && (
          <button
            type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
            disabled={storeClosed}
            title={storeClosed ? 'Store is currently closed' : undefined}
            className={`absolute -bottom-[6px] -right-[6px] z-20 flex items-center justify-center rounded-full shadow-md transition-transform duration-150 active:scale-90 ${FOCUS_RING} ${added ? 'bg-green-600 text-white' : ''} ${storeClosed ? 'cursor-not-allowed opacity-40' : 'hover:scale-105'}`}
            style={{
              width: BTN,
              height: BTN,
              ...(!added ? { backgroundColor: storeClosed ? '#9ca3af' : btnColor, color: btnFg } : {}),
            }}
          >
            {added
              ? <Check className="h-4 w-4" strokeWidth={3} />
              : <Plus className="h-4 w-4" strokeWidth={3} />}
          </button>
        )}
      </div>
    </div>
  )
}