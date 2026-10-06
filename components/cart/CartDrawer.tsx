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

// ── Premium CSS (keyframes) ────────────────────────────────────────────
const CSS = `
@keyframes cd-aurora {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes cd-shine {
  from { transform: translateX(-140%) skewX(-20deg); }
  to   { transform: translateX(480%) skewX(-20deg); }
}
@keyframes cd-glow {
  0%, 100% { box-shadow: 0 10px 28px -8px color-mix(in srgb, var(--color-primary) 55%, transparent); }
  50%      { box-shadow: 0 14px 40px -6px color-mix(in srgb, var(--color-primary) 85%, transparent); }
}
@keyframes cd-march {
  to { background-position: 16px 0, -16px 100%, 0 -16px, 100% 16px; }
}
@keyframes cd-twinkle {
  0%, 100% { opacity: .15; transform: scale(.6); }
  50%      { opacity: .9; transform: scale(1.1); }
}
@keyframes cd-shimmer {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}
@keyframes cd-ping {
  0%   { opacity: .6; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.9); }
}
.cd-aurora  { background-size: 200% 200%; animation: cd-aurora 7s ease-in-out infinite; }
.cd-shine   { animation: cd-shine 2.6s ease-in-out infinite; }
.cd-glow    { animation: cd-glow 2.8s ease-in-out infinite; }
.cd-twinkle { animation: cd-twinkle 2.4s ease-in-out infinite; }
.cd-shimmer { animation: cd-shimmer 1.8s ease-in-out infinite; }
.cd-ping    { animation: cd-ping 1.8s ease-out infinite; }

/* animated marching dashed border (Add more items card) */
.cd-dash {
  --c: color-mix(in srgb, var(--color-primary) 55%, transparent);
  background-image:
    linear-gradient(90deg, var(--c) 50%, transparent 50%),
    linear-gradient(90deg, var(--c) 50%, transparent 50%),
    linear-gradient(0deg,  var(--c) 50%, transparent 50%),
    linear-gradient(0deg,  var(--c) 50%, transparent 50%);
  background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
  background-size: 16px 2px, 16px 2px, 2px 16px, 2px 16px;
  background-position: 0 0, 0 100%, 0 0, 100% 0;
  animation: cd-march 1.2s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .cd-aurora, .cd-shine, .cd-glow, .cd-twinkle, .cd-shimmer, .cd-ping, .cd-dash { animation: none !important; }
}
`

// ── Shared motion presets ──────────────────────────────────────────────
const drawerSpring = { type: 'spring', stiffness: 340, damping: 34, mass: 0.9 } as const
const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}
const rowVariant = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: 28, height: 0, marginBottom: 0, transition: { duration: 0.22, ease: 'easeIn' } },
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
  const totalQty = items.reduce((n, it) => n + it.quantity, 0)

  const scrollPopular = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-neutral-900/60 backdrop-blur-[3px]"
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
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col overflow-hidden rounded-l-[28px] bg-white shadow-[0_0_80px_rgba(0,0,0,0.35)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={drawerSpring}
          >
            {/* ── Premium Header ── */}
            <div className="relative overflow-hidden bg-[var(--color-primary)] px-6 pb-5 pt-6 text-[var(--color-secondary)]">
              {/* aurora wash */}
              <span
                aria-hidden
                className="cd-aurora pointer-events-none absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    'linear-gradient(110deg, transparent 0%, color-mix(in srgb, var(--color-secondary) 30%, transparent) 35%, transparent 55%, color-mix(in srgb, var(--color-secondary) 18%, transparent) 80%, transparent 100%)',
                }}
              />
              {/* glass highlight */}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
              {/* twinkles */}
              <span aria-hidden className="cd-twinkle pointer-events-none absolute right-24 top-4 h-1 w-1 rounded-full bg-[var(--color-secondary)]" />
              <span aria-hidden className="cd-twinkle pointer-events-none absolute right-40 bottom-4 h-[3px] w-[3px] rounded-full bg-[var(--color-secondary)]" style={{ animationDelay: '.9s' }} />
              <span aria-hidden className="cd-twinkle pointer-events-none absolute left-40 top-3 h-[3px] w-[3px] rounded-full bg-[var(--color-secondary)]" style={{ animationDelay: '1.6s' }} />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-[0_6px_16px_-4px_rgba(0,0,0,.5)]">
                    <span aria-hidden className="cd-ping pointer-events-none absolute inset-0 rounded-xl border-2 border-[var(--color-secondary)]" />
                    <ShoppingBag size={20} strokeWidth={2.25} />
                    {items.length > 0 && (
                      <motion.span
                        key={totalQty}
                        initial={{ scale: 0.4, rotate: -12 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                        className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-extrabold leading-none text-[var(--color-secondary)] ring-2 ring-[var(--color-secondary)]"
                      >
                        {totalQty > 99 ? '99+' : totalQty}
                      </motion.span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-[22px] font-extrabold leading-tight tracking-tight">Your Cart</h2>
                    {items.length > 0 && (
                      <motion.p
                        key={items.length}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-medium opacity-75"
                      >
                        {items.length} {items.length === 1 ? 'item' : 'items'} ready to order
                      </motion.p>
                    )}
                  </div>
                </div>

                <motion.button
                  onClick={closeCart}
                  aria-label="Close cart"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.88 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-secondary)]/15 ring-1 ring-[var(--color-secondary)]/30 transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                >
                  <X size={17} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-2">
              {items.length > 0 ? (
                <>
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

                  {/* ── Add more items (dashed card) ── */}
                  <motion.button
                    type="button"
                    onClick={closeCart}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="cd-dash group relative my-4 flex w-full items-center gap-3.5 overflow-hidden rounded-2xl bg-[var(--color-primary)]/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-primary)]/[0.09]"
                  >
                    <span
                      aria-hidden
                      className="cd-shine pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-[var(--color-primary)]/10"
                    />
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-primary)]/50 bg-white text-[var(--color-primary)] transition-transform duration-300 group-hover:rotate-90">
                      <PlusIcon size={20} strokeWidth={2.75} />
                    </span>
                    <span className="relative flex-1 leading-tight">
                      <span className="block text-[14px] font-extrabold text-neutral-900">Add more items</span>
                      <span className="block text-[11.5px] text-neutral-500">Back to menu, your cart stays saved</span>
                    </span>
                    <ArrowRight
                      size={17}
                      className="relative text-[var(--color-primary)] transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </motion.button>
                </>
              ) : (
                <EmptyCart />
              )}

              {items.length > 0 && hasFbtItems && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="mb-6 mt-1"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <motion.span
                        animate={{ rotate: [0, 14, -10, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5 }}
                      >
                        <Sparkles size={15} className="text-[var(--color-primary)]" />
                      </motion.span>
                      <div>
                        <p className="text-[13px] font-bold text-neutral-800">Goes great with this</p>
                        <p className="text-[11px] text-neutral-400">Tap to add to your order</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 pt-0.5">
                      <button onClick={() => scrollPopular('left')} aria-label="Scroll left"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-all hover:scale-110 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                        <ChevronLeft size={13} />
                      </button>
                      <button onClick={() => scrollPopular('right')} aria-label="Scroll right"
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-all hover:scale-110 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
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
                          transition={{ delay: 0.28 + i * 0.04, duration: 0.25 }}
                          whileHover={{ y: -4 }}
                          className="group w-[112px] shrink-0 cursor-pointer"
                          onClick={() => setAddonModal(addonToProductData(addon))}
                        >
                          <div className="relative h-[112px] w-[112px] overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm transition-shadow duration-300 group-hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,.4)]">
                            <Image src={imageUrl} alt={addon.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                            <motion.button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setAddonModal(addonToProductData(addon)) }}
                              aria-label={`View ${addon.name}`}
                              whileTap={{ scale: 0.8 }}
                              whileHover={{ scale: 1.12, rotate: 90 }}
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
                          transition={{ delay: 0.28 + i * 0.04, duration: 0.25 }}
                          whileHover={{ y: -4 }}
                          className="group w-[112px] shrink-0"
                        >
                          <div className="relative h-[112px] w-[112px] overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm transition-shadow duration-300 group-hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,.4)]">
                            <Image src={imageUrl} alt={prod.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              whileHover={{ scale: 1.12, rotate: 90 }}
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
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="relative mb-4 overflow-hidden rounded-2xl border border-neutral-100 bg-gradient-to-b from-neutral-50 to-white px-4 py-4 shadow-[0_8px_24px_-14px_rgba(0,0,0,.25)]"
                >
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
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 14 }}
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
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                            <motion.div
                              className={`relative h-full overflow-hidden rounded-full ${unlocked ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <span aria-hidden className="cd-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                            </motion.div>
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
                          className="relative -mx-1 flex items-center justify-between overflow-hidden rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200/60"
                        >
                          <span aria-hidden className="cd-shine pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-white/60" />
                          <span className="relative text-[12px] font-semibold text-emerald-700">🏷️ Total savings</span>
                          <span className="relative text-[12px] font-bold text-emerald-700">− Rs. {Math.round(totalSavings).toLocaleString()}</span>
                        </motion.div>
                      )
                    })()}

                    <div className="mt-1 flex items-center justify-between border-t border-dashed border-neutral-300 pt-3">
                      <span className="text-base font-bold text-neutral-900">Grand Total</span>
                      <motion.span
                        key={grandTotal}
                        initial={{ opacity: 0, y: -6, scale: 1.15 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        className="text-lg font-extrabold text-neutral-900"
                      >
                        Rs. {grandTotal.toLocaleString()}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-neutral-100 bg-white px-6 pb-6 pt-4 shadow-[0_-12px_30px_-18px_rgba(0,0,0,.25)]">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.975 }}>
                  <Link
                    href="/website/checkout"
                    onClick={closeCart}
                    className="cd-glow group relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-[var(--color-primary)] px-6 py-4 text-sm font-extrabold tracking-wide text-[var(--color-secondary)]"
                  >
                    {/* aurora + shine */}
                    <span
                      aria-hidden
                      className="cd-aurora pointer-events-none absolute inset-0 opacity-40"
                      style={{
                        backgroundImage:
                          'linear-gradient(110deg, transparent 0%, color-mix(in srgb, var(--color-secondary) 30%, transparent) 40%, transparent 60%)',
                      }}
                    />
                    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
                    <span aria-hidden className="cd-shine pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-white/30" />

                    <span className="relative">Checkout · Rs. {grandTotal.toLocaleString()}</span>
                    <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[var(--color-secondary)]/15 ring-1 ring-[var(--color-secondary)]/30 transition-colors group-hover:bg-[var(--color-secondary)]/30">
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRight size={17} />
                      </motion.span>
                    </span>
                  </Link>
                </motion.div>

                {orderType === 'delivery' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex items-center gap-2.5 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-white px-4 py-3"
                  >
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      className="shrink-0"
                    >
                      <Clock3 size={15} className="text-sky-500" />
                    </motion.span>
                    <p className="text-[12.5px] leading-relaxed text-neutral-600">
                      Arriving in ~60 min · <span className="font-semibold text-sky-700">{date}, {time}</span>
                    </p>
                  </motion.div>
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
      <div className="relative">
        <span aria-hidden className="cd-ping pointer-events-none absolute inset-0 rounded-full bg-[var(--color-primary)]/20" />
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, -4, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/20"
        >
          <ShoppingBag size={54} strokeWidth={1.4} className="text-[var(--color-primary)]" />
        </motion.div>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-neutral-900">Your cart is empty</h3>
        <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-neutral-400">
          Nothing here yet — browse the menu and add something tasty.
        </p>
      </div>
      <motion.button
        onClick={handleStart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="cd-glow relative mt-1 overflow-hidden rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-bold text-[var(--color-secondary)]"
      >
        <span aria-hidden className="cd-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-white/30" />
        <span className="relative">Browse Menu</span>
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
      className={`group/row border-b border-neutral-100 last:border-b-0 ${
        isHighlight
          ? 'my-1.5 rounded-2xl border-l-[3px] border-l-amber-400 bg-amber-50/70 border-b-0 px-3 py-3'
          : isCompact
          ? 'py-2.5'
          : 'py-3.5'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`relative shrink-0 overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-[0_6px_16px_-8px_rgba(0,0,0,.35)] transition-transform duration-300 group-hover/row:scale-105 ${
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
              initial={{ scale: 1.2, y: -2 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
              className={`mt-1 origin-left font-extrabold text-neutral-900 ${isCompact ? 'text-xs' : 'text-sm'}`}
            >
              Rs. {(item.price * item.quantity).toLocaleString()}
            </motion.p>
          </div>

          <div className="flex shrink-0 items-center overflow-hidden rounded-full bg-neutral-100 ring-1 ring-black/5 shadow-inner">
            <motion.button
              onClick={() => { onDecrease(); bump() }}
              aria-label="Decrease or remove"
              whileTap={{ scale: 0.8 }}
              className={`flex h-8 w-8 items-center justify-center transition-colors ${
                item.quantity <= 1 ? 'text-rose-500 hover:bg-rose-50' : 'text-neutral-600 hover:text-[var(--color-primary)]'
              }`}
            >
              {item.quantity <= 1 ? <Trash2 size={13} /> : <Minus size={13} strokeWidth={3} />}
            </motion.button>
            <motion.span
              key={item.quantity}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 16 }}
              className="w-6 text-center text-sm font-bold text-neutral-900"
            >
              {item.quantity}
            </motion.span>
            <motion.button
              onClick={() => { onIncrease(); bump() }}
              aria-label="Increase quantity"
              whileTap={{ scale: 0.8 }}
              className="flex h-8 w-8 items-center justify-center bg-[var(--color-primary)] text-[var(--color-secondary)] transition-opacity hover:opacity-90"
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