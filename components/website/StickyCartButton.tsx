'use client'

/**
 * Cart button that lives at the right end of the sticky category bar and slides
 * in once the main navbar (#site-header) has scrolled out of view, so the cart
 * is always one tap away. It also becomes the fly-to-cart target while visible.
 */

import { useEffect, useRef, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'

export function StickyCartButton() {
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
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden transition-[width,opacity] duration-300 ease-out ${
        visible ? 'w-14 opacity-100 sm:w-16' : 'w-0 opacity-0'
      }`}
    >
      <button
        type="button"
        onClick={openCart}
        aria-label={totalItems > 0 ? `Open cart, ${totalItems} items` : 'Open cart'}
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
        data-cart-target={visible ? 'true' : undefined}
        className={`relative grid h-10 w-10 place-items-center rounded-xl bg-white text-[var(--color-primary)] shadow-[0_6px_16px_-6px_rgba(0,0,0,.45)] transition-transform duration-300 active:scale-95 sm:h-11 sm:w-11 ${
          visible ? 'scale-100' : 'scale-75'
        }`}
      >
        <ShoppingBag size={20} strokeWidth={2.2} />
        {totalItems > 0 && (
          <span
            key={bump}
            className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold leading-none text-white tabular-nums ring-2 ring-white"
            style={{ animation: bump ? 'scb-pop .35s cubic-bezier(.3,1.6,.5,1)' : undefined }}
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>
      <style>{`@keyframes scb-pop { 0% { transform: scale(0) } 70% { transform: scale(1.25) } 100% { transform: scale(1) } }`}</style>
    </div>
  )
}
