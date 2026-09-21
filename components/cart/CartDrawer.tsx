'use client'

import { useRef, useState } from 'react'
import { X, Plus, Minus, Trash2, ArrowRight, ChevronLeft, ChevronRight, Plus as PlusIcon, ShoppingBag, ChevronDown, Sparkles, Clock3 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart, DEFAULT_DELIVERY_FEE, useStoreSettings } from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'
import { useGetMenu } from '@/api/client/browse'
import { ProductDetailModal } from '@/components/product/ProductDetailModal'
import type { ProductData } from '@/components/product/ProductCard'
import type { MenuAddonDetail } from '@/api/types'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop'

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

// ── Shared motion presets ──────────────────────────────────────────────
const drawerSpring = { type: 'spring', stiffness: 340, damping: 34, mass: 0.9 } as const
const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
}
const rowVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: 24, height: 0, marginBottom: 0, transition: { duration: 0.22, ease: 'easeIn' } },
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

  const scrollRef = useRef<HTMLDivElement>(null)

  // Tax = subtotal × (tax_number / 100). Delivery fee tax mein include nahi hoti.
  // taxPercent sirf display ke liye (0.15 * 100 = 15.000000000000002 se bachne ke liye toFixed(2)).
  const tax        = Math.round(subtotal * settings.taxPercentageRate)
  const taxPercent = parseFloat((settings.taxPercentageRate * 100).toFixed(2))

  // Delivery fee from settings, fallback to DEFAULT_DELIVERY_FEE
  const deliveryFeeRaw = orderType === 'delivery'
    ? (settings.deliveryFee > 0 ? settings.deliveryFee : DEFAULT_DELIVERY_FEE)
    : 0
  // Free delivery if subtotal meets threshold (settings.freeDeliveryAboveSubtotal maps free_delivery_above_subtotal)
  const deliveryFee =
    orderType === 'delivery' && subtotal >= settings.freeDeliveryAboveSubtotal
      ? 0
      : deliveryFeeRaw

  const grandTotal = subtotal + tax + deliveryFee
  const { date, time } = fmtDateTimeDelivery()

  const scrollPopular = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' })
  }

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-neutral-900/60 backdrop-blur-[2px]"
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col overflow-hidden rounded-l-[28px] bg-white shadow-[0_0_60px_rgba(0,0,0,0.25)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={drawerSpring}
          >
            {/* ── Header ── */}
            <div className="relative flex items-center justify-between px-6 pt-6 pb-4">
              <div>
                <h2 className="text-[22px] font-bold tracking-tight text-neutral-900">Your Cart</h2>
                {items.length > 0 && (
                  <motion.p
                    key={items.length}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium text-neutral-400"
                  >
                    {items.length} {items.length === 1 ? 'item' : 'items'} ready to order
                  </motion.p>
                )}
              </div>
              <motion.button
                onClick={closeCart}
                aria-label="Close cart"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.9, rotate: 90 }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)]"
              >
                <X size={17} strokeWidth={2.5} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length > 0 ? (
                <motion.div variants={listStagger} initial="hidden" animate="show">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <CartItemRow
                        key={`${item.id}-${item.selectedOption ?? ''}`}
                        item={item}
                        onRemove={() => removeItem(item)}
                        onIncrease={() => updateQuantity(item, item.quantity + 1)}
                        onDecrease={() => updateQuantity(item, item.quantity - 1)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <EmptyCart />
              )}

              {items.length > 0 && hasFbtItems && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="mb-6 mt-1"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[var(--color-primary)]" />
                      <div>
                        <p className="text-[13px] font-bold text-neutral-800">Goes great with this</p>
                        <p className="text-[11px] text-neutral-400">Tap to add to your order</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 pt-0.5">
                      <button onClick={() => scrollPopular('left')} aria-label="Scroll left"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                        <ChevronLeft size={13} />
                      </button>
                      <button onClick={() => scrollPopular('right')} aria-label="Scroll right"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>

                  <div ref={scrollRef} className="scrollbar-hide -mx-6 flex gap-3 overflow-x-auto px-6 pb-2">
                    {/* Addon items from addon_categories */}
                    {addonFlatList.map((addon, i) => {
                      const price    = Math.round(parseFloat(addon.price || '0'))
                      const imageUrl = resolveMediaUrl(addon.photo)
                      return (
                        <motion.div
                          key={`addon-${addon.id}`}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.18 + i * 0.03, duration: 0.25 }}
                          whileHover={{ y: -3 }}
                          className="group w-[112px] shrink-0 cursor-pointer"
                          onClick={() => setAddonModal(addonToProductData(addon))}
                        >
                          <div className="relative h-[112px] w-[112px] overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm">
                            <Image src={imageUrl} alt={addon.name} fill className="object-cover transition-transform duration-300 group-hover:scale-110" />
                            <motion.button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setAddonModal(addonToProductData(addon)) }}
                              aria-label={`View ${addon.name}`}
                              whileTap={{ scale: 0.85 }}
                              className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-md ring-1 ring-black/5 transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)]"
                            >
                              <PlusIcon size={14} strokeWidth={3} />
                            </motion.button>
                          </div>
                          <div className="mt-2">
                            <p className="text-[13px] font-bold text-neutral-900">Rs. {price.toLocaleString()}</p>
                            <p className="truncate text-[11px] text-neutral-500">{addon.name}</p>
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Fallback: menu items if no addons configured */}
                    {menuFallbackItems.map((prod, i) => {
                      const price    = Math.round(parseFloat(prod.price_at_branch || prod.front_price || '0'))
                      const imageUrl = resolveMediaUrl(prod.feature_image)
                      return (
                        <motion.div
                          key={prod.id}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.18 + i * 0.03, duration: 0.25 }}
                          whileHover={{ y: -3 }}
                          className="w-[112px] shrink-0"
                        >
                          <div className="relative h-[112px] w-[112px] overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm">
                            <Image src={imageUrl} alt={prod.name} fill className="object-cover" />
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => addItem({
                                id:        String(prod.id),
                                productId: prod.id,
                                name:      prod.name,
                                price,
                                image:     imageUrl,
                              })}
                              aria-label={`Add ${prod.name}`}
                              className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-md ring-1 ring-black/5 transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)]"
                            >
                              <PlusIcon size={14} strokeWidth={3} />
                            </motion.button>
                          </div>
                          <div className="mt-2">
                            <p className="text-[13px] font-bold text-neutral-900">Rs. {price.toLocaleString()}</p>
                            <p className="truncate text-[11px] text-neutral-500">{prod.name}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {items.length > 0 && (
                <div className="mb-4 rounded-2xl bg-neutral-50 px-4 py-4">
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Subtotal</span>
                      <span className="font-semibold text-neutral-800">Rs. {subtotal.toLocaleString()}</span>
                    </div>

                    {/* Free-delivery progress — only for delivery when a finite threshold is set */}
                    {orderType === 'delivery' && settings.freeDeliveryAboveSubtotal < Infinity && (() => {
                      const threshold = settings.freeDeliveryAboveSubtotal
                      const unlocked  = subtotal >= threshold
                      const progress  = unlocked ? 100 : Math.round((subtotal / threshold) * 100)
                      const remaining = Math.max(0, threshold - subtotal)
                      return (
                        <div className="space-y-1.5 py-1">
                          <AnimatePresence mode="wait">
                            {unlocked ? (
                              <motion.p
                                key="unlocked"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-[11px] font-bold text-emerald-600"
                              >
                                🎉 Free delivery unlocked!
                              </motion.p>
                            ) : (
                              <motion.p key="locked" className="text-[11px] text-neutral-500">
                                Add <span className="font-semibold text-neutral-700">Rs. {remaining.toLocaleString()}</span> more for{' '}
                                <span className="font-semibold text-emerald-600">free delivery</span>
                              </motion.p>
                            )}
                          </AnimatePresence>
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                            <motion.div
                              className={`h-full rounded-full ${unlocked ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        </div>
                      )
                    })()}

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Tax ({taxPercent}%)</span>
                      <span className="text-neutral-700">Rs. {tax.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Delivery fee</span>
                      <span className="text-neutral-700">
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
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="-mx-1 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2"
                        >
                          <span className="text-[12px] font-semibold text-emerald-700">🏷️ Total savings</span>
                          <span className="text-[12px] font-bold text-emerald-700">− Rs. {Math.round(totalSavings).toLocaleString()}</span>
                        </motion.div>
                      )
                    })()}

                    <div className="mt-1 flex items-center justify-between border-t border-neutral-200 pt-3">
                      <span className="text-base font-bold text-neutral-900">Grand Total</span>
                      <motion.span
                        key={grandTotal}
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-base font-bold text-neutral-900"
                      >
                        Rs. {grandTotal.toLocaleString()}
                      </motion.span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-neutral-100 bg-white px-6 pb-6 pt-4">
                <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                  <Link
                    href="/website/checkout"
                    onClick={closeCart}
                    className="flex w-full items-center justify-between rounded-2xl bg-[var(--color-primary)] px-6 py-4 text-sm font-bold text-[var(--color-secondary)] shadow-lg shadow-[var(--color-primary)]/20 transition-shadow hover:shadow-xl"
                  >
                    <span>Checkout · Rs. {grandTotal.toLocaleString()}</span>
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight size={18} />
                    </motion.span>
                  </Link>
                </motion.div>

                {orderType === 'delivery' && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
                    <Clock3 size={15} className="shrink-0 text-sky-500" />
                    <p className="text-[12.5px] leading-relaxed text-neutral-600">
                      Arriving in ~60 min · <span className="font-semibold text-sky-700">{date}, {time}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Addon detail modal — outside the animated wrapper so it isn't clipped by the drawer's stacking context */}
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 py-8 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-28 w-28 items-center justify-center rounded-full bg-[var(--color-primary)]/8"
      >
        <ShoppingBag size={54} strokeWidth={1.4} className="text-[var(--color-primary)]" />
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-neutral-900">Your cart is empty</h3>
        <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-neutral-400">
          Nothing here yet — browse the menu and add something tasty.
        </p>
      </div>
      <motion.button
        onClick={handleStart}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        className="mt-1 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-bold text-[var(--color-secondary)] shadow-md"
      >
        Browse Menu
      </motion.button>
    </motion.div>
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
  // brief pulse on the price/qty chip whenever quantity changes, purely visual
  const [pulseKey, setPulseKey] = useState(0)

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

  const bump = () => setPulseKey((k) => k + 1)

  return (
    <motion.div
      layout
      variants={rowVariant}
      exit="exit"
      className={`border-b border-neutral-100 last:border-b-0 ${
        isHighlight
          ? 'my-1.5 rounded-2xl border-l-[3px] border-l-amber-400 bg-amber-50/70 border-b-0 px-3 py-3'
          : isCompact
          ? 'py-2.5'
          : 'py-3.5'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`relative shrink-0 overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 ${
          isCompact ? 'h-12 w-12' : 'h-[62px] w-[62px]'
        }`}>
          {item.image ? (
            <Image src={item.image} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-[10px] text-neutral-300">
              No img
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-between gap-2">
          <div className="min-w-0">
            <p className={`truncate font-semibold leading-tight text-neutral-900 ${isCompact ? 'text-xs' : 'text-[13.5px]'}`}>
              {item.name}{item.selectedOption ? ` (${item.selectedOption})` : ''}
            </p>
            <motion.p
              key={pulseKey}
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className={`mt-1 font-bold text-neutral-900 ${isCompact ? 'text-xs' : 'text-sm'}`}
            >
              Rs. {(item.price * item.quantity).toLocaleString()}
            </motion.p>
          </div>

          <div className="flex shrink-0 items-center overflow-hidden rounded-full bg-neutral-100">
            <motion.button
              onClick={() => { onDecrease(); bump() }}
              aria-label="Decrease or remove"
              whileTap={{ scale: 0.85 }}
              className="flex h-8 w-8 items-center justify-center text-neutral-600 transition-colors hover:text-[var(--color-primary)]"
            >
              {item.quantity <= 1 ? <Trash2 size={13} /> : <Minus size={13} strokeWidth={3} />}
            </motion.button>
            <span className="w-6 text-center text-sm font-bold text-neutral-900">
              {item.quantity}
            </span>
            <motion.button
              onClick={() => { onIncrease(); bump() }}
              aria-label="Increase quantity"
              whileTap={{ scale: 0.85 }}
              className="flex h-8 w-8 items-center justify-center text-neutral-600 transition-colors hover:text-[var(--color-primary)]"
            >
              <Plus size={13} strokeWidth={3} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Add-ons toggle ── */}
      {hasAddons && (
        <div className={`mt-2 ${isCompact ? 'ml-[60px]' : 'ml-[76px]'}`}>
          <button
            type="button"
            onClick={() => setAddonsOpen((v) => !v)}
            className="flex items-center gap-1 text-[11.5px] font-semibold text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <motion.span animate={{ rotate: addonsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={13} />
            </motion.span>
            {addonsOpen ? 'Hide add-ons' : `View add-ons (${item.selectedAddons!.length})`}
          </button>

          <AnimatePresence initial={false}>
            {addonsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-2">
                  {groupedAddons.map((group, gi) => (
                    <div key={gi}>
                      {group.groupName && (
                        <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-neutral-400">
                          {group.groupName}
                        </p>
                      )}
                      <div className="space-y-0.5 border-l-2 border-neutral-200 pl-3">
                        {group.entries.map((entry, ei) => (
                          <div key={ei} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-neutral-600">
                              <span className="font-semibold text-neutral-400">{entry.qty}×</span>
                              {'  '}{entry.name}
                            </span>
                            {entry.extraCost != null && entry.extraCost > 0 && (
                              <span className="shrink-0 text-[11px] font-semibold text-amber-600">
                                +Rs.{entry.extraCost.toLocaleString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}