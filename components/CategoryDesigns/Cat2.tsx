'use client'

/**
 * Cat2 — Floating glass pill nav with edge fade + animated scroll arrows
 * Rounded-full pills. Left/right fade gradients with ChevronLeft/Right arrows
 * that appear/disappear based on scroll position.
 */

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStoreSettings } from '@/lib/hooks/useCart'
import type { CategoryNavProps } from './shared'

export function Cat2({ categories, activeCategoryId, onSelect }: CategoryNavProps) {
  const { settings } = useStoreSettings()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftFade,  setShowLeftFade]  = useState(false)
  const [showRightFade, setShowRightFade] = useState(true)

  const navBg = settings.category_navbar_background_color || 'var(--color-primary)'

  const updateFades = () => {
    const el = scrollRef.current
    if (!el) return
    setShowLeftFade(el.scrollLeft > 4)
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => { updateFades() }, [categories])

  const scrollBy = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md"
      style={{ backgroundColor: navBg }}>
      <div className="relative mx-auto flex max-w-[1400px] items-center">
        {/* Left fade + arrow */}
        <div
          className={`pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r transition-opacity duration-300 ${showLeftFade ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `linear-gradient(to right, ${navBg}, transparent)` }}
        />
        <button onClick={() => scrollBy(-220)}
          className={`absolute left-2 z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 ${
            showLeftFade ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'
          }`}
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--color-secondary)' }}
          aria-label="Scroll left">
          <ChevronLeft size={16} />
        </button>

        <div ref={scrollRef} onScroll={updateFades}
          className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide snap-x touch-pan-x px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3">
          {categories.map((cat, i) => {
            const isActive = cat.id === activeCategoryId
            return (
              <button key={cat.id} onClick={() => onSelect(cat.id)}
                style={{
                  animation: `catPopIn 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.03}s both`,
                  backgroundColor: isActive ? 'var(--color-secondary)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)',
                  boxShadow: isActive ? '0 8px 20px -6px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.15) inset' : undefined,
                }}
                className={`group relative flex-shrink-0 snap-start overflow-hidden whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out sm:px-5 sm:py-2.5 sm:text-sm ${
                  isActive ? 'scale-[1.06]' : 'hover:scale-[1.04] hover:bg-white/15'
                }`}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                {cat.badge && (
                  <span className="absolute -right-1 -top-1 animate-pulse rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                    style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}>
                    {cat.badge}
                  </span>
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right fade + arrow */}
        <div
          className={`pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l transition-opacity duration-300 ${showRightFade ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `linear-gradient(to left, ${navBg}, transparent)` }}
        />
        <button onClick={() => scrollBy(220)}
          className={`absolute right-2 z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 ${
            showRightFade ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0 pointer-events-none'
          }`}
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--color-secondary)' }}
          aria-label="Scroll right">
          <ChevronRight size={16} />
        </button>
      </div>

      <style jsx>{`
        @keyframes catPopIn {
          from { opacity: 0; transform: scale(0.85) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </nav>
  )
}
