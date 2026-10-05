'use client'

/**
 * Cat3 — Icon cards with tilt/lift hover, glow ring, smooth collapse morph
 * Starts expanded: icon + label cards. After 900px scroll collapses to pill strip.
 * Background transitions primary → tertiary on collapse. Icons support image or iconify.
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { useStoreSettings } from '@/lib/hooks/useCart'
import type { CategoryNavProps } from './shared'

const SCROLL_COLLAPSE_THRESHOLD = 900

export function Cat3({ categories, activeCategoryId, onSelect }: CategoryNavProps) {
  const { settings } = useStoreSettings()
  const navBg = settings.category_navbar_background_color || 'var(--color-primary)'
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > SCROLL_COLLAPSE_THRESHOLD)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const backgroundColor = collapsed ? 'var(--color-tertiary)' : navBg

  return (
    <nav
      className="sticky top-0 z-30 border-b shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors duration-500"
      style={{ backgroundColor, borderColor: collapsed ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
    >
      <div
        className={`mx-auto flex max-w-[1400px] overflow-x-auto scrollbar-hide snap-x touch-pan-x transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          collapsed
            ? 'items-center gap-2 px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3'
            : 'items-stretch gap-1.5 px-2 py-2.5 sm:gap-2 sm:px-3'
        }`}
      >
        {categories.map((cat, i) => {
          const isActive = cat.id === activeCategoryId

          // ─── Collapsed: pill strip ─────────────────────────────────────
          if (collapsed) {
            return (
              <button key={cat.id} onClick={() => onSelect(cat.id)}
                style={{
                  animation: `catSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.025}s both`,
                  backgroundColor: isActive ? 'var(--color-secondary)' : 'var(--color-primary)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)',
                  boxShadow: isActive ? '0 6px 16px -4px rgba(0,0,0,0.4)' : undefined,
                }}
                className={`group relative flex-shrink-0 snap-start overflow-hidden whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all duration-300 ease-out sm:px-5 sm:py-2 sm:text-xs md:text-sm ${
                  isActive ? 'scale-105' : 'hover:scale-[1.04]'
                }`}
                onMouseEnter={(e) => { const b = e.currentTarget; b.style.backgroundColor = 'var(--color-secondary)'; b.style.color = 'var(--color-primary)' }}
                onMouseLeave={(e) => { const b = e.currentTarget; if (cat.id === activeCategoryId) { b.style.backgroundColor = 'var(--color-secondary)'; b.style.color = 'var(--color-primary)' } else { b.style.backgroundColor = 'var(--color-primary)'; b.style.color = 'var(--color-secondary)' } }}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                {cat.badge && (
                  <span className="absolute -right-1 -top-1 animate-pulse rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                    style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}>
                    {cat.badge}
                  </span>
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            )
          }

          // ─── Expanded: icon card ───────────────────────────────────────
          return (
            <button key={cat.id} onClick={() => onSelect(cat.id)}
              style={{
                animation: `catRiseIn 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.035}s both`,
                backgroundColor: isActive ? 'var(--color-secondary)' : 'var(--color-primary)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)',
                boxShadow: isActive ? '0 10px 24px -8px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.12) inset' : undefined,
              }}
              className={`group relative flex min-w-[84px] flex-shrink-0 snap-start flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl px-3 py-3.5 text-[11px] font-semibold transition-all duration-300 ease-out sm:min-w-[104px] sm:px-4 sm:py-4 sm:text-xs md:min-w-[124px] md:text-sm ${
                isActive ? '-translate-y-1 scale-[1.04]' : 'hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-lg'
              }`}
              onMouseEnter={(e) => { const b = e.currentTarget; b.style.backgroundColor = 'var(--color-secondary)'; b.style.color = 'var(--color-primary)' }}
              onMouseLeave={(e) => { const b = e.currentTarget; if (cat.id === activeCategoryId) { b.style.backgroundColor = 'var(--color-secondary)'; b.style.color = 'var(--color-primary)' } else { b.style.backgroundColor = 'var(--color-primary)'; b.style.color = 'var(--color-secondary)' } }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              {isActive && (
                <span className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-50 blur-lg"
                  style={{ backgroundColor: 'var(--color-secondary)' }} />
              )}
              {cat.badge && (
                <span className="absolute right-1 top-1 animate-bounce rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                  style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)', animationDuration: '2s' }}>
                  {cat.badge}
                </span>
              )}
              {/* Icon */}
              <div className="relative z-10 flex h-7 w-7 items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.15] group-hover:-rotate-3 sm:h-16 sm:w-16">
                {cat.icon.type === 'image' ? (
                  <Image src={cat.icon.value} alt={cat.label} fill sizes="62px" className="object-contain drop-shadow-sm" />
                ) : (
                  <Icon icon={cat.icon.value} width="100%" height="100%" />
                )}
              </div>
              <span className="relative z-10 text-center leading-tight whitespace-nowrap">{cat.label}</span>
              {/* Active indicator bar */}
              <span
                className={`absolute -bottom-0.5 left-1/2 h-1 -translate-x-1/2 rounded-full transition-all duration-300 ease-out ${isActive ? 'w-6 opacity-100' : 'w-0 opacity-0'}`}
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
            </button>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes catRiseIn {
          from { opacity: 0; transform: translateY(10px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes catSlideIn {
          from { opacity: 0; transform: translateX(-8px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </nav>
  )
}
