'use client'

/**
 * Card1 — Horizontal layout
 * Text left, small square image right.
 * Image and controls scale fluidly with card width via clamp().
 * Add button is a small floating circle on the image corner.
 * Qty stepper appears in the text column when item is in cart.
 */

import Image from 'next/image'
import { Check, Minus, Plus } from 'lucide-react'
import { useCardLogic, CARD_SHELL, FOCUS_RING, Chip, type ProductCardProps } from './shared'

export function Card1({ product, onOpen }: ProductCardProps) {
  const {
    settings, added, needsSelection,
    displayPriceNum, displayOriginal, displayDiscount, isOrderable,
    cartQty, handleAdd, handleIncrease, handleDecrease,
    storeClosed,
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
      className={`${CARD_SHELL} flex items-stretch gap-[clamp(0.5rem,2vw,0.875rem)] rounded-2xl p-[clamp(0.625rem,2vw,0.875rem)] hover:ring-black/10 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)] ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      {/* Text column */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[clamp(0.875rem,2.3vw,1.25rem)] font-bold leading-snug tracking-[-0.01em] text-neutral-900">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-[clamp(0.375rem,1.4vw,0.75rem)] line-clamp-2 text-[clamp(0.688rem,1.6vw,0.938rem)] leading-snug text-neutral-500">
              {product.description}
            </p>
          )}
          {product.dealMeta?.timeWindow && (
            <p className="mt-1 truncate text-[clamp(0.594rem,1.4vw,0.75rem)] font-medium leading-snug text-amber-600">
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
                className={`whitespace-nowrap text-[clamp(0.688rem,1.5vw,0.813rem)] line-through ${priceRounded ? 'opacity-70' : 'text-neutral-400'}`}
                style={priceRounded ? { color: priceFg || '#fff' } : undefined}
              >
                Rs.{parseInt(displayOriginal, 10).toLocaleString()}
              </span>
            )}
            <span
              className="whitespace-nowrap text-[clamp(0.875rem,2vw,1rem)] font-bold tracking-[-0.01em]"
              style={priceRounded ? { color: priceFg || '#fff' } : { color: '#171717' }}
            >
              Rs. {isOrderable ? displayPriceNum.toLocaleString() : Math.round(parseFloat(product.dealMeta!.finalPrice)).toLocaleString()}
            </span>
          </div>
        )}

        {/* Qty stepper */}
        {isOrderable && !needsSelection && cartQty > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-2 flex h-[clamp(1.5rem,4.5vw,1.75rem)] w-fit items-center gap-1 rounded-full border px-1"
            style={{ borderColor: priceBorder || priceBg || '#171717' }}
          >
            <button type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
              className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-full transition-opacity hover:opacity-70 active:scale-95 ${FOCUS_RING}`}
              style={{ color: priceBg || '#171717' }}>
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[1rem] text-center text-[clamp(0.688rem,1.6vw,0.813rem)] font-bold tabular-nums" style={{ color: priceBg || '#171717' }}>
              {cartQty}
            </span>
            <button type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
              className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-full transition-opacity hover:opacity-90 active:scale-95 ${FOCUS_RING}`}
              style={{ backgroundColor: priceBg || '#171717', color: priceFg || '#ffffff' }}>
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square w-[clamp(5.25rem,26vw,8.5rem)] flex-shrink-0 self-center">
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-neutral-50">
          <Image src={product.image} alt={product.name} fill
            sizes="(min-width: 1024px) 140px, (min-width: 640px) 120px, 96px"
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
            <Chip className={showStack ? '' : 'bg-white text-neutral-900'}
              style={showStack ? { backgroundColor: stackTagBg || '#fff', color: stackTagFg || '#000' } : undefined}>
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
          <button type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
            disabled={storeClosed}
            title={storeClosed ? 'Store is currently closed' : undefined}
            className={`absolute -bottom-1 -right-1 z-20 flex h-[clamp(1.5rem,5vw,1.875rem)] w-[clamp(1.5rem,5vw,1.875rem)] items-center justify-center rounded-full shadow-md transition-transform duration-150 ${FOCUS_RING} ${added ? 'bg-green-600 text-white' : ''} ${storeClosed ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90 active:scale-90'}`}
            style={!added ? { backgroundColor: storeClosed ? '#9ca3af' : (priceBg || '#171717'), color: priceFg || '#ffffff' } : {}}>
            {added ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
          </button>
        )}
      </div>
    </div>
  )
}
