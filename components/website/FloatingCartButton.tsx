'use client'

/**
 * Floating cart button (top-right, just under the sticky category bar). It
 * slides in once the main navbar (#site-header) has scrolled out of view, so
 * the cart is always one tap away, and becomes the fly-to-cart target while
 * visible.
 */

import { useEffect, useRef, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'

export function FloatingCartButton() {
  const { totalItems, openCart } = useCart()
  const { settings } = useStoreSettings()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const header = document.getElementById('site-header')
    if (!header || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 })
    io.observe(header)
    return () => io.disconnect()
  }, [])

  // Pop the badge when an item is added
  const [bump, setBump] = useState(0)
  const prev = useRef(totalItems)
  useEffect(() => {
    if (totalItems > prev.current) setBump((b) => b + 1)
    prev.current = totalItems
  }, [totalItems])

  if (settings.show_cart_icon === false) return null

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={totalItems > 0 ? `Open cart, ${totalItems} items` : 'Open cart'}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      data-cart-target={visible ? 'true' : undefined}
      className={`fixed right-3 top-[72px] z-40 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary)] text-white ring-[3px] ring-white transition-[opacity,transform] duration-300 ease-out active:scale-95 sm:right-5 sm:top-[84px] sm:h-14 sm:w-14 ${
        visible ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-3 scale-90 opacity-0'
      }`}
      style={{ boxShadow: '0 12px 28px -10px color-mix(in srgb, var(--color-primary) 80%, transparent)' }}
    >
      <ShoppingBag size={22} strokeWidth={2.2} />
      {totalItems > 0 && (
        <span
          key={bump}
          className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-[var(--color-primary)] tabular-nums ring-2 ring-[var(--color-primary)]"
          style={{ animation: bump ? 'fcb-pop .35s cubic-bezier(.3,1.6,.5,1)' : undefined }}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
      <style>{`@keyframes fcb-pop { 0% { transform: scale(0) } 70% { transform: scale(1.25) } 100% { transform: scale(1) } }`}</style>
    </button>
  )
}
