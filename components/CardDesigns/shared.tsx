'use client'

import { useState } from 'react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'
import { useBusinessHours } from '@/lib/hooks/useBusinessHours'
import { useCartAnimation } from '@/lib/context/CartAnimationContext'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  textButtonColor?: string
  cartStyle?: string
  dealType?: 'fixed_deal' | 'on_spot_deal'
  dealMeta?: {
    dealId: number
    finalPrice: string
    timeWindow?: string | null
    isAvailableNow?: boolean
    includedItems?: {
      name: string
      qty: number
      extraCost?: number
      availableAddons?: { id: number; name: string; price: string }[]
    }[]
    groups?: {
      id: number
      name: string
      isRequired: boolean
      selectQty: number
      options: {
        id: number | null
        name: string
        qty: number
        maxQty: number | null
        extraCost?: number
      }[]
    }[]
  }
}

export interface ProductCardProps {
  product: ProductData
  onOpen?: (product: ProductData) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CARD_SHELL =
  'group relative h-full bg-white ring-1 ring-black/[0.06] transition-[box-shadow,transform,border-color] duration-200 motion-reduce:transition-none'

export const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2'

// ─── Chip ─────────────────────────────────────────────────────────────────────

export function Chip({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-[0.5em] py-[0.25em] text-[clamp(0.5rem,1.6vw,0.688rem)] font-semibold leading-none shadow-sm ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}

// ─── useCardLogic ─────────────────────────────────────────────────────────────

export function useCardLogic(product: ProductData, onOpen?: (p: ProductData) => void) {
  const { addItem, items, updateQuantity, removeItem } = useCart()
  const { settings } = useStoreSettings()
  const { isOpen: storeOpen, closedMessage } = useBusinessHours()
  const { triggerFly } = useCartAnimation()
  const [added, setAdded] = useState(false)

  const hasSizes      = !!product.sizes && product.sizes.length > 0
  const defaultSize   = hasSizes ? product.sizes![0]! : undefined
  const defaultOption = product.options[0] ?? ''

  const needsSelection =
    !!product.dealMeta ||
    (hasSizes && product.sizes!.length > 1) ||
    (!hasSizes && product.options.length > 1)

  const displayPriceNum = defaultSize
    ? defaultSize.price
    : product.dealMeta
    ? Math.round(parseFloat(product.dealMeta.finalPrice)) || 0
    : parseInt(product.price, 10) || 0

  const displayOriginal = defaultSize
    ? defaultSize.originalPrice != null ? String(defaultSize.originalPrice) : undefined
    : product.originalPrice

  const displayDiscount = defaultSize
    ? defaultSize.hasDiscountTag ? defaultSize.discountLabel : undefined
    : product.discount

  const hasPrice    = displayPriceNum > 0
  const isOrderable = hasPrice && (
    product.dealMeta
      ? product.dealMeta.dealId != null
      : product.productId !== null && product.productId !== undefined
  )

  const productCartItems = items.filter((i) => i.id === product.id)
  const cartQty          = productCartItems.reduce((sum, i) => sum + i.quantity, 0)

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
    if (!storeOpen) {
      import('sonner').then(({ toast }) => toast.error(closedMessage ?? 'Store is currently closed'))
      return
    }
    if (needsSelection) { onOpen?.(product); return }
    addItem({
      id: product.id,
      productId: product.productId,
      name: product.name,
      price: displayPriceNum,
      image: product.image,
      originalPrice: (() => {
        const orig = displayOriginal ? parseInt(displayOriginal, 10) : undefined
        return orig != null && !isNaN(orig) && orig > displayPriceNum ? orig : undefined
      })(),
      selectedOption: defaultOption || undefined,
      variantId: defaultSize?.sizeId,
      sizeFk:    defaultSize?.sizeFk,
      cartStyle: product.cartStyle || undefined,
    })
    triggerFly(e.currentTarget as HTMLElement, product.image)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!storeOpen) return
    if (needsSelection) { onOpen?.(product); return }
    if (cartItem) updateQuantity(cartItem, cartItem.quantity + 1)
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!storeOpen) return
    if (needsSelection) { onOpen?.(product); return }
    if (!cartItem) return
    if (cartItem.quantity <= 1) removeItem(cartItem)
    else updateQuantity(cartItem, cartItem.quantity - 1)
  }

  return {
    settings,
    added,
    hasSizes,
    defaultSize,
    defaultOption,
    needsSelection,
    displayPriceNum,
    displayOriginal,
    displayDiscount,
    hasPrice,
    isOrderable,
    cartItem,
    cartQty,
    handleAdd,
    handleIncrease,
    handleDecrease,
    storeClosed: !storeOpen,
    closedMessage,
  }
}
