'use client'

/**
 * Cat3 — Icon cards with tilt/lift hover, glow ring, smooth collapse morph
 * Starts expanded: icon + label cards. After scrolling past COLLAPSE_AT it collapses to a pill strip.
 * Background transitions primary → tertiary on collapse. Icons support image or iconify.
 *
 * Responsive notes
 *  - Card width, icon size and type scale step up at sm / md / lg (no jump from 28px → 64px).
 *  - Row is centered when it fits and scrolls from the left when it overflows.
 *  - Hover effects only apply on hover-capable devices (no sticky hover after a tap).
 *  - The active category scrolls into view so it is never hidden off-screen on phones.
 *  - Scroll collapse uses hysteresis + rAF so the nav doesn't flicker when its height changes.
 *  - Safe-area insets respected (notched phones / landscape).
 *  - Badges and glow are no longer clipped by overflow-hidden.
 *  - prefers-reduced-motion disables entrance animations and smooth scrolling.
 */

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { useStoreSettings } from '@/lib/hooks/useCart'
import type { CategoryNavProps } from './shared'

const COLLAPSE_AT = 600
const EXPAND_AT = 480 // lower than COLLAPSE_AT so the nav doesn't oscillate

const ACTIVE_COLORS = 'bg-[var(--color-secondary)] text-[var(--color-primary)]'
const INACTIVE_COLORS =
  'bg-[var(--color-primary)] text-[var(--color-secondary)] ' +
  '[@media(hover:hover)]:hover:bg-[var(--color-secondary)] [@media(hover:hover)]:hover:text-[var(--color-primary)]'

export function Cat3({ categories, activeCategoryId, onSelect }: CategoryNavProps) {
  const { settings } = useStoreSettings()
  const navBg = settings.category_navbar_background_color || 'var(--color-primary)'
  const [collapsed, setCollapsed] = useState(false)
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Collapse on scroll (rAF-throttled, with hysteresis)
  useEffect(() => {
    let ticking = false
    const update = () => {
      ticking = false
      const y = window.scrollY
      setCollapsed((prev) => (prev ? y > EXPAND_AT : y > COLLAPSE_AT))
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keep the active category visible inside the horizontal scroller
  useEffect(() => {
    const el = itemRefs.current[String(activeCategoryId)]
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Wait a frame so the collapse/expand layout has settled
    const id = requestAnimationFrame(() =>
      el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
    )
    return () => cancelAnimationFrame(id)
  }, [activeCategoryId, collapsed])

  const backgroundColor = collapsed ? 'var(--color-tertiary)' : navBg

  return (
    <nav
      aria-label="Categories"
      className="sticky top-0 z-30 w-full border-b shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors duration-500"
      style={{
        backgroundColor,
        borderColor: collapsed ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div
        className={`mx-auto flex w-full max-w-[1400px] snap-x touch-pan-x overflow-x-auto overscroll-x-contain scroll-px-3 scrollbar-hide transition-[gap,padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          collapsed
            ? 'items-center gap-1.5 px-3 py-2 sm:gap-2 sm:px-4 sm:py-2.5 md:gap-2.5 md:py-3'
            : 'items-stretch gap-1.5 px-2 pb-3 pt-3 sm:gap-2 sm:px-3 md:gap-3 md:px-4'
        }`}
      >
        {categories.map((cat, i) => {
          const isActive = cat.id === activeCategoryId
          const key = String(cat.id)
          const setRef = (el: HTMLButtonElement | null) => {
            itemRefs.current[key] = el
          }
          // Cap the stagger so long lists don't take seconds to appear
          const delayIndex = Math.min(i, 14)
          const colors = isActive ? ACTIVE_COLORS : INACTIVE_COLORS

          // ─── Collapsed: pill strip ─────────────────────────────────────
          if (collapsed) {
            return (
              <button
                key={cat.id}
                ref={setRef}
                type="button"
                onClick={() => onSelect(cat.id)}
                aria-current={isActive ? 'true' : undefined}
                style={{
                  ['--i' as string]: delayIndex,
                  boxShadow: isActive ? '0 6px 16px -4px rgba(0,0,0,0.4)' : undefined,
                }}
                className={`cat-slide group relative flex-shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] font-semibold outline-none transition-all duration-300 ease-out first:ml-auto last:mr-auto focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 sm:px-4 sm:py-2 sm:text-xs md:px-5 md:text-sm ${colors} ${
                  isActive ? 'scale-105' : '[@media(hover:hover)]:hover:scale-[1.04]'
                }`}
              >
                {/* Shine (clipped in its own layer so badges can overflow the button) */}
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:translate-x-full" />
                </span>
                {cat.badge && (
                  <span
                    className="absolute -right-1 -top-1 z-20 animate-pulse rounded-full px-1.5 py-0.5 text-[8px] font-extrabold leading-none shadow"
                    style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)' }}
                  >
                    {cat.badge}
                  </span>
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            )
          }

          // ─── Expanded: icon card ───────────────────────────────────────
          return (
            <button
              key={cat.id}
              ref={setRef}
              type="button"
              onClick={() => onSelect(cat.id)}
              aria-current={isActive ? 'true' : undefined}
              style={{
                ['--i' as string]: delayIndex,
                boxShadow: isActive
                  ? '0 10px 24px -8px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.12) inset'
                  : undefined,
              }}
              className={`cat-rise group relative flex min-w-[76px] flex-shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl px-2.5 py-3 text-[11px] font-semibold outline-none transition-all duration-300 ease-out first:ml-auto last:mr-auto focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 sm:min-w-[96px] sm:gap-1.5 sm:px-3.5 sm:py-3.5 sm:text-xs md:min-w-[116px] md:px-4 md:py-4 md:text-sm lg:min-w-[132px] ${colors} ${
                isActive
                  ? '-translate-y-1 scale-[1.04]'
                  : '[@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:scale-[1.03] [@media(hover:hover)]:hover:shadow-lg'
              }`}
            >
              {/* Shine (own clipped layer) */}
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:translate-x-full" />
              </span>
              {/* Glow ring for active card */}
              {isActive && (
                <span
                  className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-50 blur-lg"
                  style={{ backgroundColor: 'var(--color-secondary)' }}
                />
              )}
              {cat.badge && (
                <span
                  className="absolute right-1 top-1 z-20 animate-bounce rounded-full px-1.5 py-0.5 text-[8px] font-extrabold leading-none shadow"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-primary)',
                    animationDuration: '2s',
                  }}
                >
                  {cat.badge}
                </span>
              )}
              {/* Icon — steps up gradually with the viewport */}
              <div className="relative z-10 flex h-9 w-9 items-center justify-center transition-transform duration-300 ease-out sm:h-11 sm:w-11 md:h-14 md:w-14 lg:h-16 lg:w-16 [@media(hover:hover)]:group-hover:-rotate-3 [@media(hover:hover)]:group-hover:scale-[1.15]">
                {cat.icon.type === 'image' ? (
                  <Image
                    src={cat.icon.value}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 64px, (min-width: 768px) 56px, (min-width: 640px) 44px, 36px"
                    className="object-contain drop-shadow-sm"
                  />
                ) : (
                  <Icon icon={cat.icon.value} width="100%" height="100%" aria-hidden="true" />
                )}
              </div>
              <span className="relative z-10 whitespace-nowrap text-center leading-tight">{cat.label}</span>
              {/* Active indicator bar */}
              <span
                className={`absolute -bottom-0.5 left-1/2 h-1 -translate-x-1/2 rounded-full transition-all duration-300 ease-out ${
                  isActive ? 'w-6 opacity-100' : 'w-0 opacity-0'
                }`}
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
            </button>
          )
        })}
      </div>

      <style jsx>{`
        .cat-rise {
          animation: catRiseIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i, 0) * 0.035s) both;
        }
        .cat-slide {
          animation: catSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i, 0) * 0.025s) both;
        }
        @keyframes catRiseIn {
          from { opacity: 0; transform: translateY(10px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes catSlideIn {
          from { opacity: 0; transform: translateX(-8px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cat-rise,
          .cat-slide {
            animation: none;
          }
        }
      `}</style>
    </nav>
  )
}