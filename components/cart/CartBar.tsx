'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'

const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2
  const r = 26 + (i % 3) * 8
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, d: (i % 4) * 25 }
})

const CSS = `
@keyframes cb-rise {
  0%   { opacity: 0; transform: translateY(70px) scale(.9); }
  60%  { opacity: 1; transform: translateY(-6px) scale(1.01); }
  100% { opacity: 1; transform: none; }
}
@keyframes cb-pop {
  0%   { transform: scale(.4) rotate(-12deg); }
  55%  { transform: scale(1.45) rotate(6deg); }
  100% { transform: scale(1) rotate(0); }
}
@keyframes cb-roll {
  0%   { opacity: 0; transform: translateY(70%); filter: blur(3px); }
  100% { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes cb-bump {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.045) translateY(-3px); }
  60%  { transform: scale(.99); }
  100% { transform: scale(1); }
}
@keyframes cb-shine {
  from { transform: translateX(-140%) skewX(-20deg); }
  to   { transform: translateX(420%) skewX(-20deg); }
}
@keyframes cb-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes cb-glow {
  0%, 100% { box-shadow: 0 -4px 26px -6px color-mix(in srgb, var(--color-secondary) 35%, transparent), 0 14px 34px -10px rgba(0,0,0,.6); }
  50%      { box-shadow: 0 -8px 44px -4px color-mix(in srgb, var(--color-secondary) 70%, transparent), 0 14px 34px -10px rgba(0,0,0,.6); }
}
@keyframes cb-aurora {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes cb-float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50%      { transform: translateY(-2px) rotate(-4deg); }
}
@keyframes cb-wiggle {
  0%, 100% { transform: rotate(0) scale(1); }
  20% { transform: rotate(-16deg) scale(1.2); }
  40% { transform: rotate(14deg) scale(1.2); }
  60% { transform: rotate(-8deg) scale(1.1); }
  80% { transform: rotate(5deg) scale(1.05); }
}
@keyframes cb-nudge {
  0%, 100% { transform: translateX(0); opacity: .6; }
  50%      { transform: translateX(4px); opacity: 1; }
}
@keyframes cb-spark {
  0%   { opacity: 1; transform: translate(0,0) scale(1); }
  100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(0); }
}
@keyframes cb-ring {
  0%   { opacity: .8; transform: scale(.6); }
  100% { opacity: 0; transform: scale(2.4); }
}
@keyframes cb-twinkle {
  0%, 100% { opacity: .15; transform: scale(.6); }
  50%      { opacity: .9; transform: scale(1.1); }
}

.cb-wrap   { animation: cb-rise .7s cubic-bezier(.2,.9,.25,1.1) backwards; }
.cb-bump   { animation: cb-bump .55s cubic-bezier(.3,1.5,.5,1); }
.cb-frame  { animation: cb-glow 3s ease-in-out infinite; }
.cb-border { animation: cb-spin 3.5s linear infinite; }
.cb-aurora { background-size: 200% 200%; animation: cb-aurora 6s ease-in-out infinite; }
.cb-float  { animation: cb-float 3s ease-in-out infinite; }
.cb-wiggle { animation: cb-wiggle .7s ease; }
.cb-pop    { animation: cb-pop .45s cubic-bezier(.3,1.7,.5,1); }
.cb-roll   { animation: cb-roll .4s cubic-bezier(.2,.9,.3,1); }
.cb-shine  { animation: cb-shine .9s ease-out; }
.cb-nudge  { animation: cb-nudge 1.4s ease-in-out infinite; }
.cb-spark  { animation: cb-spark .7s ease-out forwards; }
.cb-ring   { animation: cb-ring .7s ease-out forwards; }
.cb-twinkle{ animation: cb-twinkle 2.4s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .cb-wrap, .cb-bump, .cb-frame, .cb-border, .cb-aurora, .cb-float, .cb-wiggle,
  .cb-pop, .cb-roll, .cb-shine, .cb-nudge, .cb-spark, .cb-ring, .cb-twinkle { animation: none !important; }
}
`

export function CartBar() {
  const { totalItems, subtotal, openCart } = useCart()

  // Increments every time an item is added → retriggers burst / wiggle / shine
  const [pulse, setPulse] = useState(0)
  const prev = useRef(totalItems)
  useEffect(() => {
    if (totalItems > prev.current) setPulse((p) => p + 1)
    prev.current = totalItems
  }, [totalItems])

  if (totalItems === 0) return null

  return (
    // z-30: stays under drawer backdrops (z-40). Flush to the bottom edge.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="cb-wrap pointer-events-auto w-full max-w-[400px]">
        <div key={pulse} className={pulse > 0 ? 'cb-bump' : ''}>
          {/* Glowing frame with rotating gradient border */}
          <div className="cb-frame relative overflow-hidden rounded-t-[22px] p-[1.5px]">
            <span
              aria-hidden
              className="cb-border pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px]"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, var(--color-secondary) 70deg, transparent 140deg, transparent 200deg, var(--color-secondary) 270deg, transparent 340deg)',
              }}
            />

            <button
              onClick={openCart}
              aria-label={`View cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}, Rs. ${subtotal.toLocaleString()}`}
              className="group relative flex w-full items-center gap-3 overflow-hidden rounded-t-[20.5px] bg-[var(--color-primary)] py-3 pl-3 pr-4 text-[var(--color-secondary)] transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-secondary)]"
            >
              {/* Aurora wash */}
              <span
                aria-hidden
                className="cb-aurora pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'linear-gradient(110deg, transparent 0%, color-mix(in srgb, var(--color-secondary) 28%, transparent) 35%, transparent 55%, color-mix(in srgb, var(--color-secondary) 18%, transparent) 80%, transparent 100%)',
                }}
              />
              {/* Top glass highlight */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent"
              />

              {/* Twinkling dots */}
              <span aria-hidden className="cb-twinkle pointer-events-none absolute right-16 top-2 h-1 w-1 rounded-full bg-[var(--color-secondary)]" />
              <span aria-hidden className="cb-twinkle pointer-events-none absolute right-28 bottom-2 h-[3px] w-[3px] rounded-full bg-[var(--color-secondary)]" style={{ animationDelay: '.8s' }} />
              <span aria-hidden className="cb-twinkle pointer-events-none absolute left-24 top-2 h-[3px] w-[3px] rounded-full bg-[var(--color-secondary)]" style={{ animationDelay: '1.5s' }} />

              {/* Shine sweep on add */}
              {pulse > 0 && (
                <span
                  key={`s-${pulse}`}
                  aria-hidden
                  className="cb-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-white/35"
                />
              )}
              {/* Shine sweep on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/4 -translate-x-[140%] skew-x-[-20deg] bg-white/25 transition-transform duration-700 ease-out group-hover:translate-x-[420%]"
              />

              {/* Bag icon + live count + burst */}
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-primary)] shadow-[0_6px_16px_-4px_rgba(0,0,0,.5)]">
                {pulse > 0 && (
                  <span key={`r-${pulse}`} aria-hidden className="cb-ring pointer-events-none absolute inset-0 rounded-xl border-2 border-[var(--color-secondary)]" />
                )}
                {pulse > 0 &&
                  SPARKS.map((s, i) => (
                    <span
                      key={`${pulse}-${i}`}
                      aria-hidden
                      className="cb-spark pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)]"
                      style={{ ['--x' as string]: `${s.x}px`, ['--y' as string]: `${s.y}px`, animationDelay: `${s.d}ms` }}
                    />
                  ))}
                <span key={`b-${pulse}`} className={pulse > 0 ? 'cb-wiggle' : 'cb-float'}>
                  <ShoppingBag size={20} strokeWidth={2.25} />
                </span>
                <span
                  key={totalItems}
                  className="cb-pop absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-extrabold leading-none text-[var(--color-secondary)] ring-2 ring-[var(--color-secondary)]"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              </span>

              {/* Label */}
              <span className="flex-1 text-left leading-tight">
                <span className="block text-[15px] font-extrabold tracking-wide">View Cart</span>
                <span className="block overflow-hidden text-[11px] font-medium opacity-75">
                  <span key={totalItems} className="cb-roll inline-block">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'} added
                  </span>
                </span>
              </span>

              {/* Total */}
              <span className="overflow-hidden">
                <span key={subtotal} className="cb-roll block text-[15px] font-extrabold tabular-nums">
                  Rs. {subtotal.toLocaleString()}
                </span>
              </span>

              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-secondary)]/15 ring-1 ring-[var(--color-secondary)]/30 transition-colors duration-300 group-hover:bg-[var(--color-secondary)]/30">
                <ChevronRight size={16} className="cb-nudge" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}