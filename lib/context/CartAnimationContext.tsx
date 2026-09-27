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

// ─── Cart icon target ID ──────────────────────────────────────────────────────
// WebsiteNavbar renders the cart button with data-cart-target="true".
// We query for it at fly-time so we always get the current position.

function getCartIconRect(): DOMRect | null {
  if (typeof document === 'undefined') return null
  const el = document.querySelector<HTMLElement>('[data-cart-target="true"]')
  return el ? el.getBoundingClientRect() : null
}

// ─── Provider ────────────────────────────────────────────────────────────────

let nextId = 0

export function CartAnimationProvider({ children }: { children: React.ReactNode }) {
  const [particles, setParticles] = useState<FlyParticle[]>([])

  const triggerFly = useCallback((sourceEl: HTMLElement, image: string) => {
    const cartRect = getCartIconRect()
    if (!cartRect) return

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

    // Remove after animation completes (750 ms)
    setTimeout(() => {
      setParticles((p) => p.filter((x) => x.id !== particle.id))
    }, 800)
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

const STYLE_ID = 'fly-to-cart-styles'

function ensureStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes fly-to-cart {
      0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      60% {
        opacity: 1;
      }
      100% {
        transform: translate(var(--fly-dx), var(--fly-dy)) scale(0.15);
        opacity: 0;
      }
    }

    .fly-particle {
      position: fixed;
      z-index: 9999;
      border-radius: 50%;
      overflow: hidden;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      border: 2px solid rgba(255,255,255,0.7);
      animation: fly-to-cart 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )
      })}
    </>
  )
}
