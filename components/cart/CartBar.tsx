'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'

const CSS = `
@keyframes cb-rise {
  from { opacity: 0; transform: translateY(24px) scale(.96); }
  to   { opacity: 1; transform: none; }
}
@keyframes cb-pop {
  0%   { transform: scale(.6); }
  60%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}
@keyframes cb-bump {
  0%, 100% { transform: scale(1); }
  40%      { transform: scale(1.035); }
}
@keyframes cb-shine {
  from { transform: translateX(-120%) skewX(-20deg); }
  to   { transform: translateX(320%) skewX(-20deg); }
}
.cb-wrap  { animation: cb-rise .5s cubic-bezier(.2,.9,.25,1) backwards; }
.cb-bump  { animation: cb-bump .45s ease; }
.cb-pop   { animation: cb-pop .4s cubic-bezier(.3,1.7,.5,1); }
.cb-shine { animation: cb-shine .8s ease-out; }
@media (prefers-reduced-motion: reduce) {
  .cb-wrap, .cb-bump, .cb-pop, .cb-shine { animation: none !important; }
}
`

export function CartBar() {
  const { totalItems, subtotal, openCart } = useCart()

  // Play a small "item added" moment when the count goes up
  const [pulse, setPulse] = useState(0)
  const prev = useRef(totalItems)
  useEffect(() => {
    if (totalItems > prev.current) setPulse((p) => p + 1)
    prev.current = totalItems
  }, [totalItems])

  if (totalItems === 0) return null

  return (
    // z-30: stays under drawer backdrops (z-40) so it never floats above an open cart
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="cb-wrap pointer-events-auto w-full max-w-[380px]">
        <button
          key={pulse}
          onClick={openCart}
          aria-label={`View cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}, Rs. ${subtotal.toLocaleString()}`}
          className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-[var(--color-primary)] py-2.5 pl-2.5 pr-4 text-[var(--color-secondary)] shadow-[0_14px_30px_-10px_rgba(0,0,0,.55)] ring-1 ring-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-10px_rgba(0,0,0,.6)] active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
            pulse > 0 ? 'cb-bump' : ''
          }`}
        >
          {/* Shine sweep: plays when an item is added, and on hover */}
          {pulse > 0 && (
            <span
              aria-hidden
              className="cb-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-white/25"
            />
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/4 -translate-x-[120%] skew-x-[-20deg] bg-white/20 transition-transform duration-700 ease-out group-hover:translate-x-[320%]"
          />

          {/* Bag icon with live count */}
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)]">
            <ShoppingBag size={19} />
            <span
              key={totalItems}
              className="cb-pop absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold leading-none text-[var(--color-secondary)] ring-2 ring-[var(--color-secondary)]"
            >
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          </span>

          {/* Label */}
          <span className="flex-1 text-left leading-tight">
            <span className="block text-sm font-bold">View Cart</span>
            <span className="block text-[11px] font-medium opacity-70">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </span>

          {/* Total */}
          <span
            key={subtotal}
            className="cb-pop text-sm font-bold tabular-nums"
          >
            Rs. {subtotal.toLocaleString()}
          </span>

          <ChevronRight
            size={18}
            className="-ml-1 opacity-60 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100"
          />
        </button>
      </div>
    </div>
  )
}