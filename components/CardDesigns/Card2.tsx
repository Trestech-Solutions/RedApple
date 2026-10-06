'use client'

/**
 * Card2 — Portrait, full-bleed square image top
 * Uppercase name, reserved description slot, price + ADD button row.
 */

import Image from 'next/image'
import { Minus, Plus } from 'lucide-react'
import { useCardLogic, CARD_SHELL, FOCUS_RING, Chip, type ProductCardProps } from './shared'

export function Card2({ product, onOpen }: ProductCardProps) {
  const {
    settings, added, needsSelection,
    displayPriceNum, displayOriginal, displayDiscount, isOrderable,
    cartQty, handleAdd, handleIncrease, handleDecrease, storeClosed,
  } = useCardLogic(product, onOpen)

  const discountBg = settings.discount_background_color
  const discountFg = settings.discount_text_color
  const stackTagBg = settings.stack_tag_background_color
  const stackTagFg = settings.stack_tag_color
  const showStack  = Boolean(settings.show_stack_tag_on_item)
  const btnBg      = settings.item_price_background   || '#d63a2b'
  const btnFg      = settings.item_price_text_color   || '#ffffff'
  const btnBorder  = settings.item_price_border_color || btnBg

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
      {/* Square full-bleed image */}
      <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden bg-neutral-100">
        <Image src={product.image} alt={product.name} fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover" />

        {product.tag && (
          <span className="absolute left-2 top-2">
            <Chip className={showStack ? '' : 'bg-[#f2c14e] text-neutral-900'}
              style={showStack ? { backgroundColor: stackTagBg || '#f2c14e', color: stackTagFg || '#000' } : undefined}>
              {product.tag}
            </Chip>
          </span>
        )}

        {displayDiscount && (
          <span className="absolute bottom-1.5 right-1.5 rounded-lg px-[clamp(0.5rem,1.6vw,0.75rem)] py-[clamp(0.25rem,0.9vw,0.375rem)] text-[clamp(0.688rem,1.7vw,0.875rem)] font-extrabold uppercase leading-none"
            style={{ backgroundColor: discountBg || '#f2c14e', color: discountFg || '#171717' }}>
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

        <p className="mt-[clamp(0.5rem,2.4vw,1.25rem)] line-clamp-2 min-h-[2.8em] text-[clamp(0.688rem,1.6vw,0.938rem)] leading-[1.4] text-neutral-500">
          {product.description || '\u00A0'}
        </p>

        {product.dealMeta?.timeWindow && (
          <span className="mt-1 w-fit max-w-full truncate text-[clamp(0.594rem,1.4vw,0.75rem)] font-medium text-amber-600">
            🕐 {product.dealMeta.timeWindow}
          </span>
        )}

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
            <div onClick={(e) => e.stopPropagation()}
              className="flex h-[clamp(1.875rem,5vw,2.5rem)] flex-shrink-0 items-center gap-1 rounded-lg border px-1"
              style={{ borderColor: btnBorder }}>
              <button type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
                className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-md hover:opacity-70 active:scale-95 ${FOCUS_RING}`}
                style={{ color: btnBg }}>
                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="min-w-[1rem] text-center text-[clamp(0.75rem,1.6vw,0.938rem)] font-bold tabular-nums" style={{ color: btnBg }}>
                {cartQty}
              </span>
              <button type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
                className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-md hover:opacity-90 active:scale-95 ${FOCUS_RING}`}
                style={{ backgroundColor: btnBg, color: btnFg }}>
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          ) : isOrderable ? (
            <button type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
              disabled={storeClosed}
              title={storeClosed ? 'Store is currently closed' : undefined}
              className={`flex-shrink-0 rounded-lg px-[clamp(0.875rem,2.6vw,1.5rem)] py-[clamp(0.5rem,1.5vw,0.75rem)] text-[clamp(0.688rem,1.6vw,0.938rem)] font-extrabold uppercase leading-none tracking-wide transition-transform duration-150 ${FOCUS_RING} ${added ? 'bg-green-600 text-white' : ''} ${storeClosed ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90 active:scale-95'}`}
              style={!added ? { backgroundColor: storeClosed ? '#9ca3af' : btnBg, color: btnFg } : {}}>
              {added ? '✓ Added' : 'Add'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
