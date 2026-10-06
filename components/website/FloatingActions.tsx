'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowUp, Search } from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'

// ─── FloatingActions ──────────────────────────────────────────────────────────
// Search + scroll-to-top buttons. On mobile when CartBar is visible (cart has
// items), buttons shift up above the CartBar so nothing gets hidden behind it.

const CART_BAR_HEIGHT = 80   // CartBar ~72px + 8px gap
const BASE_BOTTOM     = 24   // default bottom-6 (24px)
const SM_BOTTOM       = 96   // sm: bottom-24 (96px) — no CartBar overlap issue on wide screens

export function FloatingActions() {
  const [visible,    setVisible]    = useState(false)
  const [isMobile,   setIsMobile]   = useState(false)
  const { totalItems } = useCart()

  const cartBarVisible = totalItems > 0

  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 300) }
    function onResize() { setIsMobile(window.innerWidth < 640) }
    onScroll(); onResize()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const scrollToSearch = useCallback(() => {
    const el = document.getElementById('search-bar')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      const input = el.querySelector<HTMLInputElement>('input[type="text"]')
      input?.focus()
    }, 500)
  }, [])

  // Calculate bottom offset
  const bottom = isMobile
    ? (cartBarVisible ? CART_BAR_HEIGHT + 8 : BASE_BOTTOM)
    : SM_BOTTOM

  const base =
    'flex h-12 w-12 items-center justify-center rounded-full shadow-lg ' +
    'hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const sharedStyle = {
    bottom:       `${bottom}px`,
    opacity:       visible ? 1 : 0,
    pointerEvents: (visible ? 'auto' : 'none') as React.CSSProperties['pointerEvents'],
    transform:     visible ? 'translateY(0)' : 'translateY(16px)',
    transition:    'opacity 300ms, transform 300ms, bottom 300ms cubic-bezier(.2,.9,.25,1)',
    boxShadow:    '0 4px 20px -4px rgba(0,0,0,0.25)',
  }

  return (
    <>
      {/* Search — LEFT */}
      <button
        type="button"
        onClick={scrollToSearch}
        aria-label="Go to search"
        className={`${base} fixed left-6 z-50`}
        style={{
          ...sharedStyle,
          backgroundColor: 'var(--color-secondary)',
          color:           'var(--color-primary)',
        }}
      >
        <Search size={20} strokeWidth={2.2} />
      </button>

      {/* Scroll-to-top — RIGHT */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`${base} fixed right-6 z-50`}
        style={{
          ...sharedStyle,
          backgroundColor: 'var(--color-primary)',
          color:           'var(--color-secondary)',
        }}
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
    </>
  )
}
