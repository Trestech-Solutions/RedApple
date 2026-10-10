'use client'

/**
 * Card1 — Horizontal layout, fully responsive
 * Sizes scale via CSS vars per breakpoint:
 *   base (mobile) → sm (640+) → md (768+)
 * Tweak the values in the `SIZE_VARS` string below.
 */

import Image from 'next/image'
import { Check, Minus, Plus } from 'lucide-react'
import { useCardLogic, FOCUS_RING, Chip, type ProductCardProps } from './shared'

const FONT_FAMILY = 'Poppins, "Poppins Fallback", sans-serif'

// ── SIZE CONTROLS (mobile → sm → md) ──────────
const SIZE_VARS = [
  '[--img:104px] sm:[--img:136px] md:[--img:160px]',   // image side
  '[--pad:10px]  sm:[--pad:14px]  md:[--pad:16px]',    // card padding
  '[--gap:10px]  sm:[--gap:14px]  md:[--gap:16px]',    // text ↔ image gap
  '[--title:14px] sm:[--title:16px] md:[--title:17px]',// title font
  '[--desc:11.5px] sm:[--desc:12.5px] md:[--desc:13px]',// description font
  '[--price:15px] sm:[--price:17px] md:[--price:19px]', // price font
  '[--btn:38px]  sm:[--btn:42px]  md:[--btn:46px]',    // add button
].join(' ')
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
      style={{ fontFamily: FONT_FAMILY, padding: 'var(--pad)', gap: 'var(--gap)' }}
      className={`group relative flex w-full max-w-full items-stretch justify-between rounded-2xl bg-white text-[#0A0A0A] shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_20px_-6px_rgba(0,0,0,0.15)] ${SIZE_VARS} ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      {/* Text column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3
          className="line-clamp-2 break-words font-bold text-[#0A0A0A]"
          style={{ fontSize: 'var(--title)', lineHeight: 1.3 }}
        >
          {product.name}
        </h3>

        {product.description && (
          <p
            className="mt-1.5 line-clamp-2 whitespace-pre-line break-words font-normal text-neutral-400 sm:mt-2 sm:line-clamp-3 md:mt-3"
            style={{ fontSize: 'var(--desc)', lineHeight: 1.5 }}
          >
            {product.description}
          </p>
        )}

        {product.dealMeta?.timeWindow && (
          <p className="mt-1 truncate text-[11px] font-medium text-amber-600 sm:text-xs">
            🕐 {product.dealMeta.timeWindow}
            {product.dealMeta.isAvailableNow === false && (
              <span className="ml-1 text-neutral-300">(not available now)</span>
            )}
          </p>
        )}

        <div className="min-h-2 flex-1" />

        {/* Price + stepper: stacked on mobile, inline on sm+ */}
        <div className="mt-1 flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1.5">
          {(isOrderable || product.dealMeta) && (
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
              {isOrderable && displayOriginal && (
                <span className="font-normal leading-none text-neutral-400 line-through" style={{ fontSize: 'var(--desc)' }}>
                  Rs.{parseInt(displayOriginal, 10).toLocaleString()}
                </span>
              )}
              <span className="whitespace-nowrap font-bold tracking-normal text-[#0A0A0A]" style={{ fontSize: 'var(--price)', lineHeight: 1.5 }}>
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
              className="flex h-7 shrink-0 items-center gap-0.5 rounded-full border px-0.5 sm:h-8 sm:px-1"
              style={{ borderColor: priceBorder || btnColor }}
            >
              <button type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-70 active:scale-95 sm:h-7 sm:w-7 ${FOCUS_RING}`}
                style={{ color: btnColor }}>
                <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
              </button>
              <span className="min-w-[1.1rem] text-center text-xs font-semibold leading-none tabular-nums sm:min-w-[1.25rem] sm:text-sm" style={{ color: btnColor }}>
                {cartQty}
              </span>
              <button type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-90 active:scale-95 sm:h-7 sm:w-7 ${FOCUS_RING}`}
                style={{ backgroundColor: btnColor, color: btnFg }}>
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="relative flex-shrink-0" style={{ width: 'var(--img)', height: 'var(--img)' }}>
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-neutral-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 160px, (min-width: 640px) 136px, 104px"
            quality={80}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
          />
          {!isOrderable && !product.dealMeta && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <Chip className="bg-white/95 text-[10px] text-neutral-700 sm:text-[11px]">Coming soon</Chip>
            </span>
          )}
        </div>

        {displayDiscount && (
          <span className="absolute right-1 top-1 z-10 sm:right-1.5 sm:top-1.5">
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
              width: 'var(--btn)',
              height: 'var(--btn)',
              ...(!added ? { backgroundColor: storeClosed ? '#9ca3af' : btnColor, color: btnFg } : {}),
            }}
          >
            {added
              ? <Check className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={3} />
              : <Plus className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={3} />}
          </button>
        )}
      </div>
    </div>
  )
}