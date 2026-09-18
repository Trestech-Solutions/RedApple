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
// CATEGORY-1 — clean uppercase tab strip with active underline
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
      className="sticky top-0 z-30 shadow-sm backdrop-blur-sm"
      style={{ backgroundColor: navBg }}
    >
      <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto scrollbar-hide snap-x touch-pan-x px-2 py-2 sm:gap-1.5 sm:px-4">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`group snap-start relative flex-shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-300 ease-out sm:px-5 sm:py-3 sm:text-sm ${
                isActive ? 'shadow-md scale-[1.04]' : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'
              }`}
              style={{
                backgroundColor: isActive
                  ? 'var(--color-secondary)'
                  : 'transparent',
                color: isActive
                  ? 'var(--color-primary)'
                  : 'var(--color-secondary)',
              }}
            >
              {cat.badge && (
                <span
                  className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {cat.badge}
                </span>
              )}

              {cat.label}

              {/* underline indicator */}
              <span
                className={`absolute bottom-0.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full transition-all duration-300 ${
                  isActive ? 'w-5 opacity-100' : 'w-0 opacity-0'
                }`}
                style={{
                  backgroundColor: isActive
                    ? 'var(--color-primary)'
                    : 'var(--color-secondary)',
                }}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-2 — floating pill nav with edge fade + scroll arrows
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
      className="sticky top-0 z-30 shadow-sm backdrop-blur-sm"
      style={{ backgroundColor: navBg }}
    >
      <div className="relative mx-auto flex max-w-[1400px] items-center">
        {/* Left fade + arrow */}
        {showLeftFade && (
          <>
            <div
              className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r"
              style={{ backgroundImage: `linear-gradient(to right, ${navBg}, transparent)` }}
            />
            <button
              onClick={() => scrollBy(-220)}
              className="absolute left-2 z-20 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-md transition-transform hover:scale-110 sm:h-8 sm:w-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'var(--color-secondary)' }}
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          onScroll={updateFades}
          className="flex flex-1 gap-2 overflow-x-auto scrollbar-hide snap-x touch-pan-x px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3"
        >
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId

            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={`snap-start relative flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out sm:px-5 sm:py-2.5 sm:text-sm ${
                  isActive ? 'shadow-lg' : 'hover:scale-[1.03] hover:shadow-md'
                }`}
                style={{
                  backgroundColor: isActive
                    ? 'var(--color-secondary)'
                    : 'rgba(255,255,255,0.08)',
                  color: isActive
                    ? 'var(--color-primary)'
                    : 'var(--color-secondary)',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {cat.badge && (
                  <span
                    className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                    style={{
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {cat.badge}
                  </span>
                )}

                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Right fade + arrow */}
        {showRightFade && (
          <>
            <div
              className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l"
              style={{ backgroundImage: `linear-gradient(to left, ${navBg}, transparent)` }}
            />
            <button
              onClick={() => scrollBy(220)}
              className="absolute right-2 z-20 flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-md transition-transform hover:scale-110 sm:h-8 sm:w-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'var(--color-secondary)' }}
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-3 — icon cards that collapse into pills on scroll
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

  /*
   * EXPANDED
   * Primary background = Black
   * Secondary text = Golden
   *
   * COLLAPSED / HOVER / ACTIVE
   *   Secondary background
   *   Primary text
   */

  const backgroundColor = collapsed
    ? 'var(--color-tertiary)'
    : navBg

  return (
    <nav
      className="sticky top-0 z-30 border-b shadow-sm backdrop-blur-sm transition-all duration-300"
      style={{
        backgroundColor,
        borderColor: collapsed
          ? 'rgba(0,0,0,0.08)'
          : 'rgba(255,255,255,0.1)',
      }}
    >
      <div
        className={`mx-auto flex max-w-[1400px] overflow-x-auto scrollbar-hide snap-x touch-pan-x transition-all duration-300 ease-in-out ${
          collapsed
            ? 'items-center gap-2 px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3'
            : 'items-stretch gap-1 px-2 py-2 sm:gap-1.5 sm:px-3'
        }`}
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId

          // ───────────────────────────────────────────────────────────────
          // COLLAPSED CATEGORY
          // ───────────────────────────────────────────────────────────────

          if (collapsed) {
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={`snap-start relative flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all duration-300 ease-out sm:px-5 sm:py-2 sm:text-xs md:text-sm ${
                  isActive ? 'shadow-md scale-105' : 'hover:scale-[1.03]'
                }`}
                style={{
                  backgroundColor: isActive
                    ? 'var(--color-secondary)'
                    : 'var(--color-primary)',
                  color: isActive
                    ? 'var(--color-primary)'
                    : 'var(--color-secondary)',
                }}
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
                {cat.badge && (
                  <span
                    className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                    style={{
                      backgroundColor: 'var(--color-secondary)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {cat.badge}
                  </span>
                )}

                {cat.label}
              </button>
            )
          }

          // ───────────────────────────────────────────────────────────────
          // EXPANDED CATEGORY (icon view)
          // hover/active: secondary background + primary text
          // ───────────────────────────────────────────────────────────────

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`group snap-start relative flex min-w-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-3.5 text-[11px] font-semibold transition-all duration-300 ease-out sm:min-w-[104px] sm:px-4 sm:py-4 sm:text-xs md:min-w-[124px] md:text-sm ${
                isActive ? 'shadow-lg scale-[1.03]' : 'hover:scale-[1.03] hover:shadow-md'
              }`}
              style={{
                backgroundColor: isActive
                  ? 'var(--color-secondary)'
                  : 'var(--color-primary)',
                color: isActive
                  ? 'var(--color-primary)'
                  : 'var(--color-secondary)',
              }}
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
              {/* Badge */}
              {cat.badge && (
                <span
                  className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                  style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {cat.badge}
                </span>
              )}

              {/* Icon */}
              <div className="relative flex h-7 w-7 items-center justify-center transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16">
                {cat.icon.type === 'image' ? (
                  <Image
                    src={cat.icon.value}
                    alt={cat.label}
                    fill
                    sizes="62px"
                    className="object-contain opacity-100"
                  />
                ) : (
                  <Icon
                    icon={cat.icon.value}
                    width="100%"
                    height="100%"
                  />
                )}
              </div>

              {/* Category Label */}
              <span className="text-center leading-tight whitespace-nowrap">
                {cat.label}
              </span>

              {/* Active indicator bar */}
              <span
                className={`absolute -bottom-0.5 left-1/2 h-1 -translate-x-1/2 rounded-full transition-all duration-300 ${
                  isActive ? 'w-6 opacity-100' : 'w-0 opacity-0'
                }`}
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
            </button>
          )
        })}
      </div>
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