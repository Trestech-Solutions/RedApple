'use client'

/**
 * Card1 — Horizontal layout, fully responsive
 * Sizes scale via CSS vars per breakpoint:
 *   base (mobile) → sm (640+) → md (768+)
 * Tweak the values in the `SIZE_VARS` string below.
 */

import { Check, Clock, Minus, Plus } from 'lucide-react'
import { useCardLogic, FOCUS_RING, Chip, type ProductCardProps, ProductImage } from './shared'

const FONT_FAMILY = 'var(--font-poppins), Poppins, ui-sans-serif, system-ui, sans-serif'

// ── SIZE CONTROLS (mobile → sm → md) ──────────
const SIZE_VARS = [
  '[--img:128px] sm:[--img:140px] md:[--img:150px]',   // image side
  '[--pad:14px]  sm:[--pad:16px]  md:[--pad:16px]',    // card padding
  '[--gap:12px]  sm:[--gap:14px]  md:[--gap:16px]',    // text ↔ image gap
  '[--title:15px] sm:[--title:16px] md:[--title:16px]',// title font
  '[--desc:12.5px] sm:[--desc:13px] md:[--desc:13px]', // description font
  '[--price:17px] sm:[--price:18px] md:[--price:18px]', // price font
  '[--btn:28px]  sm:[--btn:30px]  md:[--btn:32px]',    // add button (small "+" on the image corner)
].join(' ')
// ──────────────────────────────────────────────

export function Card1({ product, onOpen }: ProductCardProps) {
  const {
    settings, added, needsSelection,
    displayPriceNum, displayOriginal, displayDiscount, isOrderable,
    cartQty, handleAdd, handleIncrease, handleDecrease, storeClosed, unavailableTitle, outsideHours,
  } = useCardLogic(product, onOpen)

  const priceBg     = settings.item_price_background
  const priceFg     = settings.item_price_text_color
  const priceBorder = settings.item_price_border_color
  const discountBg  = settings.discount_background_color
  const discountFg  = settings.discount_text_color
  const btnColor    = priceBg || '#000000'
  const btnFg       = priceFg || '#ffffff'

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  const priceText = isOrderable
    ? displayPriceNum.toLocaleString()
    : product.dealMeta ? Math.round(parseFloat(product.dealMeta.finalPrice)).toLocaleString() : ''
  const showPrice = (isOrderable || !!product.dealMeta) && !product.hidePrice
  const tagText = product.tag

  const hasAvailabilityBadge =
    (outsideHours && !!product.itemWindow) || !!product.dealMeta?.timeWindow

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      style={{ fontFamily: FONT_FAMILY, padding: 'var(--pad)', gap: 'var(--gap)' }}
      className={`group relative flex h-full w-full max-w-full items-stretch justify-between overflow-visible rounded-2xl bg-white text-neutral-900 ring-1 ring-black/[0.05] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_18px_-10px_rgba(16,24,40,0.14)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(16,24,40,0.04),0_18px_36px_-16px_rgba(16,24,40,0.3)] hover:ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] motion-reduce:transform-none ${SIZE_VARS} ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      {/* ── Text column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {tagText && (
          <span className="mb-2 inline-flex w-fit max-w-full items-center truncate rounded-full bg-[color-mix(in_srgb,var(--color-primary)_9%,white)] px-2 py-0.5 text-[10.5px] font-semibold leading-4 text-[var(--color-primary)]">
            {tagText}
          </span>
        )}

        <h3
          className={`line-clamp-2 break-words font-semibold tracking-[-0.01em] text-neutral-900 ${product.hideTitle ? 'sr-only' : ''}`}
          style={{ fontSize: 'var(--title)', lineHeight: 1.35 }}
        >
          {product.name}
        </h3>

        {/* Hide the description while an availability badge is shown, to keep the card compact */}
        {product.description && !hasAvailabilityBadge && (
          <p
            className="mt-1.5 line-clamp-2 whitespace-pre-line break-words font-normal text-neutral-500 sm:mt-2 md:line-clamp-3"
            style={{ fontSize: 'var(--desc)', lineHeight: 1.55 }}
          >
            {product.description}
          </p>
        )}

        {outsideHours && product.itemWindow && (
          <span className="mt-2.5 inline-flex w-fit max-w-full items-center gap-1 truncate rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-semibold text-red-600 sm:text-[11px]">
            <Clock className="h-3 w-3 shrink-0" strokeWidth={2.4} />
            <span className="truncate">Available {product.itemWindow}</span>
          </span>
        )}

        {product.dealMeta?.timeWindow && (
          <span
            className={`mt-2.5 inline-flex w-fit max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10.5px] font-medium sm:text-[11px] ${
              product.dealMeta.isAvailableNow === false ? 'bg-neutral-100 text-neutral-500' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <Clock className="h-3 w-3 shrink-0" strokeWidth={2.4} />
            <span className="truncate">
              {product.dealMeta.timeWindow}
              {product.dealMeta.isAvailableNow === false && ' · not available now'}
            </span>
          </span>
        )}

        <div className="min-h-3 flex-1" />

        {/* Price + stepper */}
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
          {showPrice && (
            <div className="min-w-0 leading-none">
              {isOrderable && displayOriginal && (
                <span className="mb-1 block text-[11.5px] font-medium text-neutral-400 line-through decoration-neutral-400/70 sm:text-xs">
                  Rs. {parseInt(displayOriginal, 10).toLocaleString()}
                </span>
              )}
              <span className="flex items-baseline gap-1 whitespace-nowrap font-bold tracking-tight text-neutral-900" style={{ fontSize: 'var(--price)' }}>
                {product.fromLabel && <span className="mr-1 text-[0.62em] font-medium text-neutral-500">from</span>}
                <span className="text-[0.66em] font-semibold text-neutral-500">Rs.</span>
                {priceText}
              </span>
            </div>
          )}

          {isOrderable && !needsSelection && cartQty > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white p-0.5 ring-1 shadow-sm"
              style={{ ['--tw-ring-color' as string]: priceBorder || `color-mix(in srgb, ${btnColor} 35%, transparent)` }}
            >
              <button type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 active:scale-95 ${FOCUS_RING}`}
                style={{ color: btnColor }}>
                <Minus className="h-3.5 w-3.5" strokeWidth={2.6} />
              </button>
              <span className="min-w-[1.25rem] text-center text-sm font-bold leading-none tabular-nums" style={{ color: btnColor }}>
                {cartQty}
              </span>
              <button type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-opacity hover:opacity-90 active:scale-95 ${FOCUS_RING}`}
                style={{ backgroundColor: btnColor, color: btnFg }}>
                <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Image ── */}
      <div className="relative flex-shrink-0" style={{ width: 'var(--img)', height: 'var(--img)' }}>
        <div className={`absolute inset-0 overflow-hidden bg-neutral-100 ring-1 ring-black/[0.06] ${product.circleImage ? 'rounded-full' : 'rounded-xl'}`}>
          <ProductImage
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 150px, (min-width: 640px) 140px, 128px"
            quality={80}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
          />
          {/* soft bottom shade for depth */}
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
          {!isOrderable && !product.dealMeta && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <Chip className="bg-white/95 text-[10px] text-neutral-700 sm:text-[11px]">Coming soon</Chip>
            </span>
          )}
        </div>

        {displayDiscount && (
          <span
            className="absolute left-1.5 top-1.5 z-10 rounded-md px-1.5 py-[3px] text-[10px] font-bold uppercase leading-none tracking-wide shadow-[0_2px_6px_rgba(0,0,0,0.25)] sm:text-[10.5px]"
            style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#000' }}
          >
            {displayDiscount}
          </span>
        )}

        {isOrderable && (needsSelection || cartQty === 0) && (
          <button
            type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
            disabled={storeClosed}
            title={storeClosed ? unavailableTitle : undefined}
            className={`absolute -bottom-[7px] -right-[7px] z-20 flex items-center justify-center rounded-full shadow-[0_6px_14px_-4px_rgba(0,0,0,0.4)] ring-[3px] ring-white transition-transform duration-200 active:scale-90 ${FOCUS_RING} ${added ? 'bg-green-600 text-white' : ''} ${storeClosed ? 'cursor-not-allowed opacity-40' : 'hover:scale-110 hover:rotate-90'}`}
            style={{
              width: 'var(--btn)',
              height: 'var(--btn)',
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