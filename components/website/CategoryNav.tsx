'use client'

import { useRef, useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStoreSettings } from '@/lib/hooks/useCart'

type CategoryIcon =
  | { type: 'image'; value: string }
  | { type: 'iconify'; value: string }

interface CategoryNavProps {
  categories: {
    id: string
    label: string
    icon: CategoryIcon
    badge?: string
  }[]
  activeCategoryId: string
  onSelect: (categoryId: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-1 — glass tab strip, animated sliding underline + glow
// ─────────────────────────────────────────────────────────────────────────────

function Cat1({
  categories,
  activeCategoryId,
  onSelect,
}: CategoryNavProps) {
  const { settings } = useStoreSettings()

  const navBg =
    settings.category_navbar_background_color || 'var(--color-primary)'

  return (
    <nav
      className="sticky top-0 z-30 border-b border-white/10 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md"
      style={{ backgroundColor: navBg }}
    >
      <div className="mx-auto flex max-w-[1400px] gap-1.5 overflow-x-auto scrollbar-hide snap-x touch-pan-x px-2 py-2.5 sm:gap-2 sm:px-4 sm:py-3">
        {categories.map((cat, i) => {
          const isActive = cat.id === activeCategoryId

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              style={{
                animation: `catFadeIn 0.4s ease-out ${i * 0.03}s both`,
                backgroundColor: isActive ? 'var(--color-secondary)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)',
              }}
              className={`group relative flex-shrink-0 snap-start overflow-hidden whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-300 ease-out will-change-transform sm:px-5 sm:py-3 sm:text-sm ${
                isActive
                  ? 'scale-[1.05] shadow-[0_6px_18px_-6px_rgba(0,0,0,0.4)]'
                  : 'opacity-70 hover:scale-[1.03] hover:opacity-100'
              }`}
            >
              {/* shine sweep on hover */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

              {/* soft glow when active */}
              {isActive && (
                <span
                  className="pointer-events-none absolute inset-0 -z-10 rounded-xl blur-md opacity-60"
                  style={{ backgroundColor: 'var(--color-secondary)' }}
                />
              )}

              {cat.badge && (
                <span
                  className="absolute -right-1 -top-1 animate-bounce rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow-md"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-primary)',
                    animationDuration: '2s',
                  }}
                >
                  {cat.badge}
                </span>
              )}

              <span className="relative z-10">{cat.label}</span>

              {/* animated sliding underline */}
              <span
                className={`absolute bottom-0.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full transition-all duration-300 ease-out ${
                  isActive ? 'w-6 opacity-100' : 'w-0 opacity-0 group-hover:w-3 group-hover:opacity-60'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-secondary)',
                }}
              />
            </button>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes catFadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-2 — floating glass pill nav, edge fade + animated scroll arrows
// ─────────────────────────────────────────────────────────────────────────────

function Cat2({
  categories,
  activeCategoryId,
  onSelect,
}: CategoryNavProps) {
  const { settings } = useStoreSettings()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(true)

  const navBg =
    settings.category_navbar_background_color || 'var(--color-primary)'

  const updateFades = () => {
    const el = scrollRef.current
    if (!el) return
    setShowLeftFade(el.scrollLeft > 4)
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateFades()
  }, [categories])

  const scrollBy = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <nav
      className="sticky top-0 z-30 border-b border-white/10 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md"
      style={{ backgroundColor: navBg }}
    >
      <div className="relative mx-auto flex max-w-[1400px] items-center">
        {/* Left fade + arrow */}
        <div
          className={`pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r transition-opacity duration-300 ${
            showLeftFade ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `linear-gradient(to right, ${navBg}, transparent)` }}
        />
        <button
          onClick={() => scrollBy(-220)}
          className={`absolute left-2 z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 ${
            showLeftFade ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'
          }`}
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--color-secondary)' }}
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={scrollRef}
          onScroll={updateFades}
          className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide snap-x touch-pan-x px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3"
        >
          {categories.map((cat, i) => {
            const isActive = cat.id === activeCategoryId

            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                style={{
                  animation: `catPopIn 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.03}s both`,
                  backgroundColor: isActive ? 'var(--color-secondary)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)',
                  boxShadow: isActive
                    ? '0 8px 20px -6px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.15) inset'
                    : undefined,
                }}
                className={`group relative flex-shrink-0 snap-start overflow-hidden whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out sm:px-5 sm:py-2.5 sm:text-sm ${
                  isActive ? 'scale-[1.06]' : 'hover:scale-[1.04] hover:bg-white/15'
                }`}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

                {cat.badge && (
                  <span
                    className="absolute -right-1 -top-1 animate-pulse rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                    style={{
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {cat.badge}
                  </span>
                )}

                <span className="relative z-10">{cat.label}</span>
              </button>
            )
          })}
        </div>

        <div
          className={`pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l transition-opacity duration-300 ${
            showRightFade ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `linear-gradient(to left, ${navBg}, transparent)` }}
        />
        <button
          onClick={() => scrollBy(220)}
          className={`absolute right-2 z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 ${
            showRightFade ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0 pointer-events-none'
          }`}
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--color-secondary)' }}
          aria-label="Scroll right"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <style jsx>{`
        @keyframes catPopIn {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-3 — icon cards with tilt/lift hover, glow ring, smooth collapse morph
// ─────────────────────────────────────────────────────────────────────────────

const SCROLL_COLLAPSE_THRESHOLD = 900

function Cat3({
  categories,
  activeCategoryId,
  onSelect,
}: CategoryNavProps) {
  const { settings } = useStoreSettings()

  const navBg =
    settings.category_navbar_background_color || 'var(--color-primary)'

  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setCollapsed(window.scrollY > SCROLL_COLLAPSE_THRESHOLD)
    }

    onScroll()

    window.addEventListener('scroll', onScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const backgroundColor = collapsed ? 'var(--color-tertiary)' : navBg

  return (
    <nav
      className="sticky top-0 z-30 border-b shadow-[0_4px_24px_-8px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors duration-500"
      style={{
        backgroundColor,
        borderColor: collapsed ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
      }}
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

          // ───────────────────────────────────────────────────────────────
          // COLLAPSED CATEGORY
          // ───────────────────────────────────────────────────────────────

          if (collapsed) {
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                style={{
                  animation: `catSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.025}s both`,
                  backgroundColor: isActive ? 'var(--color-secondary)' : 'var(--color-primary)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)',
                  boxShadow: isActive
                    ? '0 6px 16px -4px rgba(0,0,0,0.4)'
                    : undefined,
                }}
                className={`group relative flex-shrink-0 snap-start overflow-hidden whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all duration-300 ease-out sm:px-5 sm:py-2 sm:text-xs md:text-sm ${
                  isActive ? 'scale-105' : 'hover:scale-[1.04]'
                }`}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget
                  btn.style.backgroundColor = 'var(--color-secondary)'
                  btn.style.color = 'var(--color-primary)'
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget
                  if (cat.id === activeCategoryId) {
                    btn.style.backgroundColor = 'var(--color-secondary)'
                    btn.style.color = 'var(--color-primary)'
                  } else {
                    btn.style.backgroundColor = 'var(--color-primary)'
                    btn.style.color = 'var(--color-secondary)'
                  }
                }}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

                {cat.badge && (
                  <span
                    className="absolute -right-1 -top-1 animate-pulse rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                    style={{
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {cat.badge}
                  </span>
                )}

                <span className="relative z-10">{cat.label}</span>
              </button>
            )
          }

          // ───────────────────────────────────────────────────────────────
          // EXPANDED CATEGORY (icon view)
          // ───────────────────────────────────────────────────────────────

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              style={{
                animation: `catRiseIn 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.035}s both`,
                backgroundColor: isActive ? 'var(--color-secondary)' : 'var(--color-primary)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-secondary)',
                boxShadow: isActive
                  ? '0 10px 24px -8px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.12) inset'
                  : undefined,
              }}
              className={`group relative flex min-w-[84px] flex-shrink-0 snap-start flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl px-3 py-3.5 text-[11px] font-semibold transition-all duration-300 ease-out sm:min-w-[104px] sm:px-4 sm:py-4 sm:text-xs md:min-w-[124px] md:text-sm ${
                isActive ? '-translate-y-1 scale-[1.04]' : 'hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-lg'
              }`}
              onMouseEnter={(e) => {
                const btn = e.currentTarget
                btn.style.backgroundColor = 'var(--color-secondary)'
                btn.style.color = 'var(--color-primary)'
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget
                if (cat.id === activeCategoryId) {
                  btn.style.backgroundColor = 'var(--color-secondary)'
                  btn.style.color = 'var(--color-primary)'
                } else {
                  btn.style.backgroundColor = 'var(--color-primary)'
                  btn.style.color = 'var(--color-secondary)'
                }
              }}
            >
              {/* shine sweep */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

              {/* glow ring when active */}
              {isActive && (
                <span
                  className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-50 blur-lg"
                  style={{ backgroundColor: 'var(--color-secondary)' }}
                />
              )}

              {cat.badge && (
                <span
                  className="absolute right-1 top-1 animate-bounce rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-primary)',
                    animationDuration: '2s',
                  }}
                >
                  {cat.badge}
                </span>
              )}

              {/* Icon */}
              <div className="relative z-10 flex h-7 w-7 items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.15] group-hover:-rotate-3 sm:h-16 sm:w-16">
                {cat.icon.type === 'image' ? (
                  <Image
                    src={cat.icon.value}
                    alt={cat.label}
                    fill
                    sizes="62px"
                    className="object-contain drop-shadow-sm"
                  />
                ) : (
                  <Icon icon={cat.icon.value} width="100%" height="100%" />
                )}
              </div>

              {/* Category Label */}
              <span className="relative z-10 text-center leading-tight whitespace-nowrap">
                {cat.label}
              </span>

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
        @keyframes catRiseIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes catSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function CategoryNav(props: CategoryNavProps) {
  const { settings } = useStoreSettings()

  const design =
    (settings.category_design as string | undefined) ??
    'category-3'

  if (design === 'category-1') {
    return <Cat1 {...props} />
  }

  if (design === 'category-2') {
    return <Cat2 {...props} />
  }

  if (design === 'category-3') {
    return <Cat3 {...props} />
  }

  return <Cat3 {...props} />
}