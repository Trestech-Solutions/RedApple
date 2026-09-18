'use client'

import { useRef, useState } from 'react'
import { X, Plus, Minus, Trash2, ArrowRight, ChevronLeft, ChevronRight, Plus as PlusIcon, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart, DEFAULT_DELIVERY_FEE, useStoreSettings } from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'
import { useGetMenu } from '@/api/client/browse'
import { ProductDetailModal } from '@/components/product/ProductDetailModal'
import type { ProductData } from '@/components/product/ProductCard'
import type { MenuAddonDetail } from '@/api/types'

const PLACEHOLDER  = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop'

/** Resolves a relative /media/... path (as returned by the menu API) to a full
 *  URL. Absolute URLs pass through unchanged. Falls back to PLACEHOLDER when
 *  there's nothing to resolve or the base URL env var isn't configured. */
function resolveMediaUrl(path?: string | null): string {
  if (!path || path.trim() === '') return PLACEHOLDER
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) {
    const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''
    if (!base) return PLACEHOLDER
    const origin = base.replace(/\/+$/, '').replace(/\/api$/i, '')
    return `${origin}${path}`
  }
  return path
}

function fmtDateTimeDelivery() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return { date, time }
}

export function CartDrawer() {
  const {
    isCartOpen, closeCart, items, removeItem, updateQuantity, addItem,
    subtotal, orderType,
  } = useCart()
  const { branchId, areaId } = useStoreLocation()
  const { settings } = useStoreSettings()

  const { data: menuData } = useGetMenu({ branchId, areaId })

  // ── Frequently Bought Together: prefer addon_categories, fall back to menu items ──
  const addonFlatList: MenuAddonDetail[] = (menuData?.addon_categories ?? [])
    .filter((cat) => cat.status !== false)
    .flatMap((cat) => (cat.addons ?? []).filter((a) => a.status !== false))
    .slice(0, 10)

  const menuFallbackItems = addonFlatList.length === 0
    ? (menuData?.menu ?? [])
        .flatMap((cat) => cat.items ?? [])
        .filter((it) => it.status !== false && it.status !== 0)
        .slice(0, 8)
    : []

  const hasFbtItems = addonFlatList.length > 0 || menuFallbackItems.length > 0

  // ── Modal state for addon detail ──
  const [addonModal, setAddonModal] = useState<ProductData | null>(null)

  /** Convert a MenuAddonDetail into a minimal ProductData for the detail modal */
  function addonToProductData(addon: MenuAddonDetail): ProductData {
    const price = Math.round(parseFloat(addon.price || '0'))
    const image = resolveMediaUrl(addon.photo)
    return {
      id:          `addon_${addon.id}`,
      productId:   addon.id,          // use addon.id so addItem stores it
      name:        addon.name,
      description: addon.description || '',
      price:       String(price),
      options:     [],
      image,
    }
  }

  const scrollRef   = useRef<HTMLDivElement>(null)

  // Tax = subtotal × (tax_number / 100). Delivery fee tax mein include nahi hoti.
  // taxPercent sirf display ke liye (0.15 * 100 = 15.000000000000002 se bachne ke liye toFixed(2)).
  const tax         = Math.round(subtotal * settings.taxPercentageRate)
  const taxPercent  = parseFloat((settings.taxPercentageRate * 100).toFixed(2))

  // Delivery fee from settings, fallback to DEFAULT_DELIVERY_FEE
  const deliveryFeeRaw = orderType === 'delivery'
    ? (settings.deliveryFee > 0 ? settings.deliveryFee : DEFAULT_DELIVERY_FEE)
    : 0
  // Free delivery if subtotal meets threshold (settings.freeDeliveryAboveSubtotal maps free_delivery_above_subtotal)
  const deliveryFee =
    orderType === 'delivery' && subtotal >= settings.freeDeliveryAboveSubtotal
      ? 0
      : deliveryFeeRaw

  const grandTotal  = subtotal + tax + deliveryFee
  const { date, time } = fmtDateTimeDelivery()

  const scrollPopular = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' })
  }

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={closeCart} />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-bold text-neutral-900">Your Cart</h2>
          <button onClick={closeCart} aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-secondary)] hover:brightness-90 transition-colors shadow-sm">
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length > 0 ? (
            <div className="px-5 pb-2">
              {items.map((item) => (
                <CartItemRow
                  key={`${item.id}-${item.selectedOption ?? ''}`}
                  item={item}
                  onRemove={() => removeItem(item)}
                  onIncrease={() => updateQuantity(item, item.quantity + 1)}
                  onDecrease={() => updateQuantity(item, item.quantity - 1)}
                />
              ))}
            </div>
          ) : (
            <EmptyCart />
          )}

          {items.length > 0 && hasFbtItems && (
            <div className="px-5 pb-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-bold text-neutral-800">Frequently Bought Together</p>
                  <p className="text-xs text-neutral-500">Tap any item to add to your order</p>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  <button onClick={() => scrollPopular('left')} aria-label="Scroll left"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => scrollPopular('right')} aria-label="Scroll right"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
                {/* Addon items from addon_categories */}
                {addonFlatList.map((addon) => {
                  const price    = Math.round(parseFloat(addon.price || '0'))
                  const imageUrl = resolveMediaUrl(addon.photo)
                  return (
                    <div
                      key={`addon-${addon.id}`}
                      className="shrink-0 w-[110px] cursor-pointer group"
                      onClick={() => setAddonModal(addonToProductData(addon))}
                    >
                      <div className="relative w-[110px] h-[110px] rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50">
                        <Image src={imageUrl} alt={addon.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAddonModal(addonToProductData(addon)) }}
                          aria-label={`View ${addon.name}`}
                          className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-md hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors border border-neutral-200"
                        >
                          <PlusIcon size={14} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-neutral-800">Rs. {price.toLocaleString()}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{addon.name}</p>
                        {addon.description && (
                          <p className="text-[10px] text-neutral-400 truncate">{addon.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Fallback: menu items if no addons configured */}
                {menuFallbackItems.map((prod) => {
                  const price    = Math.round(parseFloat(prod.price_at_branch || prod.front_price || '0'))
                  const imageUrl = resolveMediaUrl(prod.feature_image)
                  return (
                    <div key={prod.id} className="shrink-0 w-[110px]">
                      <div className="relative w-[110px] h-[110px] rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50">
                        <Image src={imageUrl} alt={prod.name} fill className="object-cover" />
                        <button
                          onClick={() => addItem({
                            id:        String(prod.id),
                            productId: prod.id,
                            name:      prod.name,
                            price,
                            image:     imageUrl,
                          })}
                          aria-label={`Add ${prod.name}`}
                          className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-md hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors border border-neutral-200"
                        >
                          <PlusIcon size={14} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-neutral-800">Rs. {price.toLocaleString()}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{prod.name}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Addon detail modal — rendered OUTSIDE the aside to avoid stacking context issues */}

          {items.length > 0 && (
            <div className="px-5 pb-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800">Subtotal</span>
                  <span className="font-semibold text-neutral-800">Rs. {subtotal.toLocaleString()}</span>
                </div>

                {/* Free-delivery progress — only for delivery when a finite threshold is set */}
                {orderType === 'delivery' && settings.freeDeliveryAboveSubtotal < Infinity && (() => {
                  const threshold = settings.freeDeliveryAboveSubtotal
                  const unlocked  = subtotal >= threshold
                  const progress  = unlocked ? 100 : Math.round((subtotal / threshold) * 100)
                  const remaining = Math.max(0, threshold - subtotal)
                  return (
                    <div className="py-1 space-y-1.5">
                      {unlocked ? (
                        <p className="text-[11px] font-semibold text-emerald-600">
                          🎉 You&apos;ve unlocked free delivery!
                        </p>
                      ) : (
                        <p className="text-[11px] text-neutral-500">
                          Add <span className="font-semibold text-neutral-700">Rs. {remaining.toLocaleString()}</span> more for <span className="font-semibold text-emerald-600">FREE delivery</span>
                        </p>
                      )}
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${unlocked ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })()}

                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Tax ({taxPercent}%)</span>
                  <span className="text-neutral-600">Rs. {tax.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Delivery Fee</span>
                  <span className="text-neutral-600">
                    {orderType === 'pickup'
                      ? '—'
                      : deliveryFee === 0
                        ? <span className="font-bold text-emerald-600">FREE</span>
                        : `Rs. ${deliveryFee.toLocaleString()}`}
                  </span>
                </div>

                {/* Total discount savings */}
                {(() => {
                  const totalSavings = items.reduce((sum, item) => {
                    if (item.originalPrice != null && item.originalPrice > item.price) {
                      return sum + (item.originalPrice - item.price) * item.quantity
                    }
                    return sum
                  }, 0)
                  if (totalSavings <= 0) return null
                  return (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 -mx-1">
                      <span className="text-emerald-700 font-semibold text-[12px]">🏷️ Total Savings</span>
                      <span className="text-emerald-700 font-bold text-[12px]">− Rs. {Math.round(totalSavings).toLocaleString()}</span>
                    </div>
                  )
                })()}

                <div className="border-t border-neutral-200 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">Grand Total</span>
                    <span className="font-bold text-neutral-900">Rs. {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-neutral-100 bg-white px-5 pt-4 pb-6 space-y-3">
            <Link
              href="/website/checkout"
              onClick={closeCart}
              className="flex w-full items-center justify-between rounded-xl bg-[var(--color-primary)] px-6 py-3.5 text-sm font-bold text-[var(--color-secondary)] hover:brightness-90 transition-colors shadow-md"
            >
              <span className="pl-2">Checkout</span>
              <ArrowRight size={18} className="text-[var(--color-secondary)]" />
            </Link>

            {orderType === 'delivery' && (
              <div className="rounded-lg bg-sky-50 border border-sky-100 px-4 py-3">
                <p className="text-sm leading-relaxed text-neutral-700">
                  Your order will be delivered approximately in 60 minutes on{' '}
                  <span className="font-bold text-sky-700">{date}</span> at{' '}
                  <span className="font-bold text-sky-700">{time}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Addon detail modal — outside <aside> so it isn't clipped by the drawer's stacking context */}
      {addonModal && (
        <ProductDetailModal
          product={addonModal}
          onClose={() => setAddonModal(null)}
        />
      )}
    </>
  )
}

function EmptyCart() {
  const router = useRouter()
  const { closeCart } = useCart()

  const handleStart = () => {
    closeCart()
    router.push('/')
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center px-6 py-8">
      <ShoppingBag size={100} strokeWidth={1.2} className="text-[var(--color-primary)]" />
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-[var(--color-primary)]">Your Cart is Empty</h3>
        <p className="mx-auto max-w-[260px] text-sm leading-relaxed text-neutral-500">
          Looks like you haven&apos;t added anything yet. Browse the menu to get started!
        </p>
      </div>
      <button
        onClick={handleStart}
        className="mt-2 rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-secondary)] hover:brightness-90 transition-colors shadow-sm"
      >
        Browse Menu
      </button>
    </div>
  )
}

interface CartItemRowProps {
  item: ReturnType<typeof useCart>['items'][number]
  onRemove: () => void
  onIncrease: () => void
  onDecrease: () => void
}

function CartItemRow({ item, onRemove, onIncrease, onDecrease }: CartItemRowProps) {
  const hasAddons = item.selectedAddons && item.selectedAddons.length > 0
  const [addonsOpen, setAddonsOpen] = useState(false)

  // Group the selectedAddons by groupName for clean display
  const groupedAddons = hasAddons
    ? item.selectedAddons!.reduce<{ groupName?: string; entries: { name: string; qty: number; extraCost?: number }[] }[]>(
        (acc, addon) => {
          const last = acc[acc.length - 1]
          if (last && last.groupName === addon.groupName) {
            last.entries.push({ name: addon.name, qty: addon.qty, extraCost: addon.extraCost })
          } else {
            acc.push({ groupName: addon.groupName, entries: [{ name: addon.name, qty: addon.qty, extraCost: addon.extraCost }] })
          }
          return acc
        },
        []
      )
    : []

  // cart_style visual treatment
  const style = item.cartStyle?.toLowerCase().trim() ?? ''
  const isHighlight = style === 'highlight'
  const isCompact   = style === 'compact'

  return (
    <div className={`border-b border-neutral-100 last:border-b-0 ${
      isHighlight
        ? 'border-l-[3px] border-l-amber-400 bg-amber-50/60 px-2 py-2.5 first:pt-2 rounded-r-lg'
        : isCompact
        ? 'py-2 first:pt-1.5'
        : 'py-3 first:pt-2'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`relative shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50 ${
          isCompact ? 'h-12 w-12' : 'h-16 w-16'
        }`}>
          {item.image ? (
            <Image src={item.image} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs">
              No img
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-between gap-2">
          <div className="min-w-0">
            <p className={`font-semibold text-neutral-900 leading-tight truncate ${isCompact ? 'text-xs' : 'text-sm'}`}>
              {item.name}{item.selectedOption ? ` (${item.selectedOption})` : ''}
            </p>
            <p className={`mt-1 font-bold text-neutral-900 ${isCompact ? 'text-xs' : 'text-sm'}`}>
              Rs. {(item.price * item.quantity).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center shrink-0 rounded-md border border-[var(--color-primary)] overflow-hidden">
            <button onClick={onDecrease} aria-label="Decrease or remove"
              className="flex h-7 w-7 items-center justify-center bg-white text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors">
              {item.quantity <= 1 ? <Trash2 size={13} /> : <Minus size={13} strokeWidth={3} />}
            </button>
            <span className="w-7 text-center text-sm font-semibold text-neutral-900 bg-white">
              {item.quantity}
            </span>
            <button onClick={onIncrease} aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center bg-white text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)] transition-colors">
              <Plus size={13} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Add-ons toggle ── */}
      {hasAddons && (
        <div className={`mt-2 ${isCompact ? 'ml-[60px]' : 'ml-[76px]'}`}>
          <button
            type="button"
            onClick={() => setAddonsOpen((v) => !v)}
            className="flex items-center gap-1 text-[12px] font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            {addonsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {addonsOpen ? 'Hide Add-ons' : 'View Add-ons'}
          </button>

          {addonsOpen && (
            <div className="mt-2 space-y-2">
              {groupedAddons.map((group, gi) => (
                <div key={gi}>
                  {group.groupName && (
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide mb-1">
                      ● {group.groupName}
                    </p>
                  )}
                  <div className="space-y-0.5 pl-3 border-l-2 border-neutral-200">
                    {group.entries.map((entry, ei) => (
                      <div key={ei} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-neutral-700">
                          <span className="font-semibold text-neutral-500">{entry.qty}x</span>
                          {'  '}{entry.name}
                        </span>
                        {entry.extraCost != null && entry.extraCost > 0 && (
                          <span className="text-[11px] font-semibold text-amber-600 shrink-0">
                            +Rs.{entry.extraCost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}