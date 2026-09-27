'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowUp, Search } from 'lucide-react'

// ─── FloatingActions ──────────────────────────────────────────────────────────
// Two fixed buttons that appear after the user scrolls 300px down:
//   LEFT  — Search icon  → scrolls to #search-bar and focuses the input
//   RIGHT — Arrow Up     → scrolls back to top
//
// Colors follow the store theme via CSS variables:
//   --color-primary   (set on the root layout div)
//   --color-secondary

export function FloatingActions() {
  const [visible, setVisible] = useState(false)

  // Show only after scrolling 300px
  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // initial check
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const scrollToSearch = useCallback(() => {
    const el = document.getElementById('search-bar')
    if (!el) return

    // Smooth-scroll to the search bar
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // After the scroll animation finishes, focus the input inside
    setTimeout(() => {
      const input = el.querySelector<HTMLInputElement>('input[type="text"]')
      input?.focus()
    }, 500)
  }, [])

  // Base classes shared by both buttons
  const base =
    'flex h-12 w-12 items-center justify-center rounded-full shadow-lg ' +
    'transition-all duration-300 ' +
    'hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  return (
    <>
      {/* ── Search button — LEFT side ─────────────────────────────────── */}
      <button
        type="button"
        onClick={scrollToSearch}
        aria-label="Go to search"
        className={`${base} fixed bottom-24 left-6 z-50`}
        style={{
          backgroundColor: 'var(--color-secondary)',
          color:           'var(--color-primary)',
          opacity:          visible ? 1 : 0,
          pointerEvents:    visible ? 'auto' : 'none',
          transform:        visible ? 'translateY(0)' : 'translateY(16px)',
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.25)',
        }}
      >
        <Search size={20} strokeWidth={2.2} />
      </button>

      {/* ── Scroll-to-top button — RIGHT side ─────────────────────────── */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`${base} fixed bottom-24 right-6 z-50`}
        style={{
          backgroundColor: 'var(--color-primary)',
          color:           'var(--color-secondary)',
          opacity:          visible ? 1 : 0,
          pointerEvents:    visible ? 'auto' : 'none',
          transform:        visible ? 'translateY(0)' : 'translateY(16px)',
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.25)',
        }}
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
    </>
  )
}
