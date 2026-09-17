'use client'

import { useRef, useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
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
// CATEGORY-1
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
      className="sticky top-0 z-30"
      style={{ backgroundColor: navBg }}
    >
      <div className="mx-auto flex max-w-[1400px] overflow-x-auto scrollbar-hide snap-x touch-pan-x">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`snap-start relative flex-shrink-0 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-all sm:px-5 sm:py-3 sm:text-sm rounded-sm mx-0.5 my-1.5 ${
                isActive
                  ? 'shadow-md scale-105'
                  : 'opacity-70'
              }`}
              style={{
                backgroundColor: isActive
                  ? 'var(--color-secondary)'
                  : 'var(--color-primary)',
                color: isActive
                  ? 'var(--color-primary)'
                  : 'var(--color-secondary)',
              }}
            >
              {cat.badge && (
                <span
                  className="absolute -right-1 -top-1 rounded-full px-1 py-0.5 text-[8px] font-extrabold shadow"
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
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-2
// ─────────────────────────────────────────────────────────────────────────────

function Cat2({
  categories,
  activeCategoryId,
  onSelect,
}: CategoryNavProps) {
  const { settings } = useStoreSettings()
  const scrollRef = useRef<HTMLDivElement>(null)

  const navBg =
    settings.category_navbar_background_color || 'var(--color-primary)'

  const scrollRight = () => {
    scrollRef.current?.scrollBy({
      left: 240,
      behavior: 'smooth',
    })
  }

  return (
    <nav
      className="sticky top-0 z-30 shadow-sm relative"
      style={{ backgroundColor: navBg }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center pr-10">
        <div
          ref={scrollRef}
          className="flex flex-1 overflow-x-auto scrollbar-hide snap-x touch-pan-x gap-1 px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3"
        >
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId

            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className="snap-start relative flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all sm:px-5 sm:py-2 sm:text-sm whitespace-nowrap"
                style={{
                  backgroundColor: isActive
                    ? 'var(--color-secondary)'
                    : 'var(--color-primary)',
                  color: isActive
                    ? 'var(--color-primary)'
                    : 'var(--color-secondary)',
                  transform: isActive
                    ? 'scale(1.05)'
                    : 'scale(1)',
                  boxShadow: isActive
                    ? '0 4px 10px rgba(0,0,0,0.15)'
                    : 'none',
                }}
              >
                {cat.badge && (
                  <span
                    className="absolute -right-1 -top-1 rounded-full px-1 py-0.5 text-[8px] font-extrabold shadow"
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

        {/* Scroll right arrow */}
        <button
          onClick={scrollRight}
          className="absolute right-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors sm:h-9 sm:w-9"
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'var(--color-secondary)',
          }}
          aria-label="Scroll categories"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY-3
// ─────────────────────────────────────────────────────────────────────────────

const SCROLL_COLLAPSE_THRESHOLD = 700

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
   * COLLAPSED
   * Inactive:
   *   Black background
   *   Golden text
   *
   * Active:
   *   Golden background
   *   Black text
   */

  const backgroundColor = collapsed
    ? 'var(--color-tertiary)'
    : navBg

  return (
    <nav
      className="sticky top-0 z-30 border-b transition-all duration-300"
      style={{
        backgroundColor,
        borderColor: collapsed
          ? 'rgba(0,0,0,0.1)'
          : 'rgba(255,255,255,0.1)',
      }}
    >
      <div
        className={`mx-auto flex max-w-[1400px] overflow-x-auto scrollbar-hide snap-x touch-pan-x transition-all duration-300 ease-in-out ${
          collapsed
            ? 'items-center gap-2 px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3'
            : 'items-stretch gap-0 px-0 py-0'
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
                className={`snap-start relative flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all duration-300 ease-in-out sm:px-5 sm:py-2 sm:text-xs md:text-sm ${
                  isActive
                    ? 'shadow-md scale-105'
                    : ''
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

                  btn.style.backgroundColor =
                    'var(--color-secondary)'

                  btn.style.color =
                    'var(--color-primary)'
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget

                  if (cat.id === activeCategoryId) {
                    btn.style.backgroundColor =
                      'var(--color-secondary)'

                    btn.style.color =
                      'var(--color-primary)'
                  } else {
                    btn.style.backgroundColor =
                      'var(--color-primary)'

                    btn.style.color =
                      'var(--color-secondary)'
                  }
                }}
              >
                {cat.badge && (
                  <span
                    className="absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                    style={{
                      backgroundColor:
                        'var(--color-secondary)',

                      color:
                        'var(--color-primary)',
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
          // EXPANDED CATEGORY
          // ───────────────────────────────────────────────────────────────

          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`snap-start relative flex min-w-[80px] flex-col items-center justify-center gap-1 px-3 py-3 text-[11px] font-semibold transition-all duration-300 ease-in-out sm:min-w-[100px] sm:px-4 sm:py-4 sm:text-xs md:min-w-[120px] md:text-sm ${
                isActive
                  ? ''
                  : 'opacity-70'
              }`}
              style={{
                backgroundColor:
                  'var(--color-primary)',

                color:
                  'var(--color-secondary)',
              }}
            >
              {/* Badge */}
              {cat.badge && (
                <span
                  className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow"
                  style={{
                    backgroundColor:
                      'var(--color-secondary)',

                    color:
                      'var(--color-primary)',
                  }}
                >
                  {cat.badge}
                </span>
              )}

              {/* Icon */}
              <div className="relative flex h-7 w-7 items-center justify-center sm:h-20 sm:w-20">
                {cat.icon.type === 'image' ? (
                  <Image
                    src={cat.icon.value}
                    alt={cat.label}
                    fill
                    sizes="62px"
                    className={`object-contain transition-all ${
                      isActive
                        ? 'opacity-100'
                        : 'opacity-60'
                    }`}
                  />
                ) : (
                  <Icon
                    icon={cat.icon.value}
                    width="100%"
                    height="100%"
                    className={`transition-all ${
                      isActive
                        ? 'opacity-100'
                        : 'opacity-60'
                    }`}
                  />
                )}
              </div>

              {/* Category Label */}
              <span className="text-center leading-tight whitespace-nowrap">
                {cat.label}
              </span>
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