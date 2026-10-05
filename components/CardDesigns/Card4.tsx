'use client'

/**
 * Card4 — Bordered card, inset square image, big price + round add button
 * border-2 outer shell. Square inset image with own rounded corners inside padding.
 * Large price display with optional "From" label. Round add/stepper button bottom-right.
 */

import Image from 'next/image'
import { Check, Minus, Plus } from 'lucide-react'
import { useCardLogic, FOCUS_RING, Chip, type ProductCardProps } from './shared'

export function Card4({ product, onOpen }: ProductCardProps) {
  const {
    settings, added, needsSelection, hasSizes,
    displayPriceNum, displayOriginal, displayDiscount, isOrderable,
    cartQty, handleAdd, handleIncrease, handleDecrease, storeClosed,
  } = useCardLogic(product, onOpen)

  const discountBg  = settings.discount_background_color
  const discountFg  = settings.discount_text_color
  const stackTagBg  = settings.stack_tag_background_color
  const stackTagFg  = settings.stack_tag_color
  const showStack   = Boolean(settings.show_stack_tag_on_item)
  const btnBg      = settings.item_price_background  || '#e8352a'
  const btnFg      = settings.item_price_text_color  || '#ffffff'
  const btnBorder  = settings.item_price_border_color || btnBg
  const priceColor = settings.item_price_border_color || '#3d8b37'

  if (!product.productId && !product.dealMeta && settings.if_item_not_available === 'hide') return null

  const priceLabel = isOrderable
    ? displayPriceNum.toLocaleString()
    : product.dealMeta
    ? Math.round(parseFloat(product.dealMeta.finalPrice)).toLocaleString()
    : ''

  const showFrom = product.fromLabel || (hasSizes && product.sizes!.length > 1)

  return (
    <div
      onClick={() => onOpen?.(product)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(product) } }}
      className={`group relative flex h-full flex-col rounded-[clamp(1rem,3vw,1.75rem)] border-2 border-neutral-200 bg-white p-[clamp(0.5rem,1.4vw,0.75rem)] transition-shadow duration-200 hover:shadow-[0_14px_32px_-14px_rgba(0,0,0,0.3)] ${onOpen ? `cursor-pointer ${FOCUS_RING}` : ''}`}
    >
      {/* Inset square image */}
      <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-[clamp(0.5rem,1.2vw,0.75rem)] bg-neutral-100">
        <Image src={product.image} alt={product.name} fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {product.tag && (
          <span className="absolute left-2 top-2">
            <Chip className={showStack ? '' : 'bg-[#f2c14e] text-neutral-900'}
              style={showStack ? { backgroundColor: stackTagBg || '#f2c14e', color: stackTagFg || '#000' } : undefined}>
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
        <h3 className="line-clamp-2 text-[clamp(0.875rem,2.2vw,1.5rem)] font-bold leading-[1.1] tracking-[-0.005em] text-neutral-900">
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

        {/* Price + round add button */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-[clamp(1.5rem,5vw,3.5rem)]">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-[0.4em] gap-y-0.5 pb-[0.15em]">
            {showFrom && (
              <span className="text-[clamp(0.563rem,1.3vw,0.813rem)] font-extrabold tracking-wide" style={{ color: priceColor }}>
                From
              </span>
            )}
            {isOrderable && displayOriginal && (
              <span className="whitespace-nowrap text-[clamp(0.625rem,1.4vw,0.813rem)] text-neutral-400 line-through">
                Rs.{parseInt(displayOriginal, 10).toLocaleString()}
              </span>
            )}
            {(isOrderable || product.dealMeta) && (
              <span className="whitespace-nowrap text-[clamp(1rem,2.8vw,1.875rem)] font-bold leading-none tracking-[-0.01em]" style={{ color: priceColor }}>
                Rs. {priceLabel}
              </span>
            )}
          </div>

          {isOrderable && !needsSelection && cartQty > 0 ? (
            <div onClick={(e) => e.stopPropagation()}
              className="flex h-[clamp(2.25rem,6vw,3.25rem)] flex-shrink-0 items-center gap-1 rounded-full border-2 px-1"
              style={{ borderColor: btnBorder }}>
              <button type="button" onClick={handleDecrease} aria-label={`Remove one ${product.name}`}
                className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-full hover:opacity-70 active:scale-95 ${FOCUS_RING}`}
                style={{ color: btnBg }}>
                <Minus className="h-4 w-4" strokeWidth={3} />
              </button>
              <span className="min-w-[1.25rem] text-center text-[clamp(0.813rem,1.8vw,1.063rem)] font-extrabold tabular-nums" style={{ color: btnBg }}>
                {cartQty}
              </span>
              <button type="button" onClick={handleIncrease} aria-label={`Add one ${product.name}`}
                className={`flex aspect-square h-[calc(100%-6px)] items-center justify-center rounded-full hover:opacity-90 active:scale-95 ${FOCUS_RING}`}
                style={{ backgroundColor: btnBg, color: btnFg }}>
                <Plus className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          ) : isOrderable ? (
            <button type="button" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}
              disabled={storeClosed}
              title={storeClosed ? 'Store is currently closed' : undefined}
              className={`flex h-[clamp(2.25rem,6.5vw,3.5rem)] w-[clamp(2.25rem,6.5vw,3.5rem)] flex-shrink-0 items-center justify-center rounded-full shadow-sm transition-transform duration-150 ${FOCUS_RING} ${added ? 'bg-green-600 text-white' : ''} ${storeClosed ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90 active:scale-90'}`}
              style={!added ? { backgroundColor: storeClosed ? '#9ca3af' : btnBg, color: btnFg } : {}}>
              {added ? <Check className="h-[55%] w-[55%]" strokeWidth={3} /> : <Plus className="h-[60%] w-[60%]" strokeWidth={3} />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
