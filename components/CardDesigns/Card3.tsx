'use client'

/**
 * Card3 — Portrait, 3:2 image, full-width add button
 * 3:2 image with hover scale. Reserved description + time window slots.
 * Full-width pill button at bottom.
 */

import Image from 'next/image'
import { Minus, Plus } from 'lucide-react'
import { useCardLogic, CARD_SHELL, FOCUS_RING, Chip, type ProductCardProps } from './shared'

export function Card3({ product, onOpen }: ProductCardProps) {
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
  const btnBg      = settings.item_price_background   || '#c0392b'
  const btnFg      = settings.item_price_text_color   || '#ffffff'
  const btnBorder  = settings.item_price_border_color || btnBg

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      className={`${CARD_SHELL} flex flex-col overflow-hidden rounded-[clamp(0.75rem,2.2vw,1.125rem)] hover:ring-black/10 hover:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.25)] ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      <div className="relative aspect-[3/2] w-full flex-shrink-0 overflow-hidden bg-neutral-100">
        <Image src={product.image} alt={product.name} fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" />

        {product.tag && (
          <span className="absolute left-2 top-2 sm:left-3 sm:top-3">
            <Chip className={showStack ? '' : 'bg-[#f2c14e] text-neutral-900'}
              style={showStack ? { backgroundColor: stackTagBg || '#f2c14e', color: stackTagFg || '#000' } : undefined}>
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
        <h3 className="line-clamp-2 min-h-[2.6em] text-[clamp(0.781rem,1.9vw,1rem)] font-semibold leading-[1.3] tracking-[-0.01em] text-neutral-900">
          {product.name}
        </h3>
        <p className="mt-[0.3em] line-clamp-2 min-h-[2.8em] text-[clamp(0.656rem,1.5vw,0.875rem)] leading-[1.4] text-neutral-500">
          {product.description || '\u00A0'}
        </p>
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
              Rs.{' '}
              {isOrderable
                ? displayPriceNum.toLocaleString()
                : Math.round(parseFloat(product.dealMeta!.finalPrice)).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="px-[clamp(0.625rem,2vw,1rem)] pb-[clamp(0.625rem,2vw,1rem)]">
        {isOrderable && !needsSelection && cartQty > 0 ? (
          <div onClick={(e) => e.stopPropagation()}
            className="flex h-[clamp(2.125rem,6vw,2.75rem)] items-center justify-center gap-3 rounded-full border-2"
            style={{ borderColor: btnBorder }}>
            <button type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
              className={`flex aspect-square h-[calc(100%-8px)] items-center justify-center rounded-full hover:opacity-70 active:scale-95 ${FOCUS_RING}`}
              style={{ color: btnBg }}>
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[1.5rem] text-center text-[clamp(0.75rem,1.7vw,0.938rem)] font-bold tabular-nums" style={{ color: btnBg }}>{cartQty}</span>
            <button type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
              className={`flex aspect-square h-[calc(100%-8px)] items-center justify-center rounded-full hover:opacity-90 active:scale-95 ${FOCUS_RING}`}
              style={{ backgroundColor: btnBg, color: btnFg }}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : isOrderable ? (
          <button type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
            disabled={storeClosed}
            title={storeClosed ? 'Store is currently closed' : undefined}
            className={`h-[clamp(2.125rem,6vw,2.75rem)] w-full rounded-full border text-[clamp(0.688rem,1.6vw,0.938rem)] font-semibold tracking-[0.01em] transition-transform duration-150 ${FOCUS_RING} ${added ? 'border-transparent bg-green-600 text-white' : ''} ${storeClosed ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90 active:scale-[0.98]'}`}
            style={!added ? { backgroundColor: storeClosed ? '#9ca3af' : btnBg, color: btnFg, borderColor: storeClosed ? '#9ca3af' : btnBorder } : {}}>
            {added ? '✓ Added' : 'Add to cart'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
