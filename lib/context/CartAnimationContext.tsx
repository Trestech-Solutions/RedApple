'use client'

import {
  createContext, useContext, useRef, useState, useCallback, useEffect,
} from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlyParticle {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  image: string
  size: number
}

interface CartAnimationContextType {
  /**
   * Call this from any "Add to cart" button.
   * @param sourceEl  The element that was clicked (used to get start coords)
   * @param image     Product image URL — shown as the flying thumbnail
   */
  triggerFly: (sourceEl: HTMLElement, image: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartAnimationContext = createContext<CartAnimationContextType | undefined>(undefined)

// ─── Cart icon target ─────────────────────────────────────────────────────────
// Cart buttons carry data-cart-target="true" (navbar cart + the floating cart
// that appears once the navbar has scrolled away). At fly-time pick the one
// that's actually on screen, so the item never flies off the top of the page.

const FLY_MS = 1300

function getCartTarget(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target="true"]'))
  const vh = window.innerHeight
  const vw = window.innerWidth
  const onScreen = els.find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw
  })
  return onScreen ?? els[0] ?? null
}

// ─── Provider ────────────────────────────────────────────────────────────────

let nextId = 0

export function CartAnimationProvider({ children }: { children: React.ReactNode }) {
  const [particles, setParticles] = useState<FlyParticle[]>([])

  const triggerFly = useCallback((sourceEl: HTMLElement, image: string) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = getCartTarget()
    if (!target) return
    const cartRect = target.getBoundingClientRect()

    const srcRect = sourceEl.getBoundingClientRect()

    // Start: centre of the clicked button
    const startX = srcRect.left + srcRect.width  / 2
    const startY = srcRect.top  + srcRect.height / 2

    // End: centre of the cart icon
    const endX = cartRect.left + cartRect.width  / 2
    const endY = cartRect.top  + cartRect.height / 2

    const particle: FlyParticle = {
      id: nextId++,
      startX, startY,
      endX, endY,
      image,
      size: 48,
    }

    setParticles((p) => [...p, particle])

    // Little "catch" bounce on the cart as the item lands
    setTimeout(() => {
      target.animate?.(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(.95)' }, { transform: 'scale(1)' }],
        { duration: 450, easing: 'ease-out' },
      )
    }, FLY_MS - 120)

    // Remove after the animation completes
    setTimeout(() => {
      setParticles((p) => p.filter((x) => x.id !== particle.id))
    }, FLY_MS + 100)
  }, [])

  return (
    <CartAnimationContext.Provider value={{ triggerFly }}>
      {children}
      <FlyingParticlesRenderer particles={particles} />
    </CartAnimationContext.Provider>
  )
}

export function useCartAnimation() {
  const ctx = useContext(CartAnimationContext)
  // Graceful fallback — if used outside provider just no-op
  return ctx ?? { triggerFly: () => {} }
}

// ─── Flying particles renderer ────────────────────────────────────────────────
// Each particle is an absolutely positioned element that animates from
// (startX, startY) to (endX, endY) along a quadratic bezier arc using a
// CSS @keyframes injected once.

const STYLE_ID = 'fly-to-cart-styles-v2'

function ensureStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  // Horizontal and vertical motion run on separate layers with different
  // easing, which bends the straight line into a natural arc: the item lifts
  // and pops a little, then glides into the cart while shrinking.
  style.textContent = `
    @keyframes fly-x {
      from { transform: translateX(0); }
      to   { transform: translateX(var(--fly-dx)); }
    }
    @keyframes fly-y {
      0%   { transform: translateY(0) scale(1); }
      18%  { transform: translateY(-44px) scale(1.15); }
      100% { transform: translateY(var(--fly-dy)) scale(0.25); }
    }
    @keyframes fly-fade {
      0%, 82% { opacity: 1; }
      100%    { opacity: 0; }
    }

    .fly-particle {
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      will-change: transform;
      animation: fly-x ${FLY_MS}ms cubic-bezier(0.45, 0, 0.55, 1) forwards;
    }
    .fly-particle-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 10px 24px rgba(0,0,0,0.28);
      border: 2px solid rgba(255,255,255,0.85);
      will-change: transform, opacity;
      animation:
        fly-y ${FLY_MS}ms cubic-bezier(0.5, 0, 0.75, 1) forwards,
        fly-fade ${FLY_MS}ms linear forwards;
    }
  `
  document.head.appendChild(style)
}

function FlyingParticlesRenderer({ particles }: { particles: FlyParticle[] }) {
  useEffect(() => { ensureStyles() }, [])

  if (particles.length === 0) return null

  return (
    <>
      {particles.map((p) => {
        const dx = p.endX - p.startX
        const dy = p.endY - p.startY

        return (
          <div
            key={p.id}
            className="fly-particle"
            style={{
              left:   p.startX - p.size / 2,
              top:    p.startY - p.size / 2,
              width:  p.size,
              height: p.size,
              // CSS custom props drive the keyframe endpoint
              '--fly-dx': `${dx}px`,
              '--fly-dy': `${dy}px`,
            } as React.CSSProperties}
          >
            <div className="fly-particle-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
