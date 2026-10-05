'use client'

/**
 * Cat1 — Glass tab strip with animated sliding underline + glow
 * Sticky nav, backdrop-blur. Horizontal scroll of pill buttons.
 * Active: secondary bg / primary text. Shine sweep on hover.
 * Staggered catFadeIn CSS animation on load.
 */

import { useStoreSettings } from '@/lib/hooks/useCart'
import type { CategoryNavProps } from './shared'

export function Cat1({ categories, activeCategoryId, onSelect }: CategoryNavProps) {
  const { settings } = useStoreSettings()
  const navBg = settings.category_navbar_background_color || 'var(--color-primary)'

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
                isActive ? 'scale-[1.05] shadow-[0_6px_18px_-6px_rgba(0,0,0,0.4)]' : 'opacity-70 hover:scale-[1.03] hover:opacity-100'
              }`}
            >
              {/* shine sweep on hover */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              {/* soft glow when active */}
              {isActive && (
                <span className="pointer-events-none absolute inset-0 -z-10 rounded-xl blur-md opacity-60"
                  style={{ backgroundColor: 'var(--color-secondary)' }} />
              )}
              {cat.badge && (
                <span className="absolute -right-1 -top-1 animate-bounce rounded-full px-1.5 py-0.5 text-[8px] font-extrabold shadow-md"
                  style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-primary)', animationDuration: '2s' }}>
                  {cat.badge}
                </span>
              )}
              <span className="relative z-10">{cat.label}</span>
              {/* animated sliding underline */}
              <span
                className={`absolute bottom-0.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full transition-all duration-300 ease-out ${
                  isActive ? 'w-6 opacity-100' : 'w-0 opacity-0 group-hover:w-3 group-hover:opacity-60'
                }`}
                style={{ backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-secondary)' }}
              />
            </button>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes catFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  )
}
