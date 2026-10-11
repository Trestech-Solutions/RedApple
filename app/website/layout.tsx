'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  CartProvider, StoreSettingsProvider, useStoreSettings, useCart,
} from '@/lib/hooks/useCart'
import { ReduxProvider } from '@/redux/Provider'
import { CartBar } from '@/components/cart/CartBar'
import { WebsiteBootstrap } from '@/components/website/WebsiteBootstrap'
import { WebsiteNavbar } from '@/components/website/WebsiteNavbar'
import { WebsiteFooter } from '@/components/website/WebsiteFooter'
import { WebsiteSkeleton } from '@/components/website/WebsiteSkeleton'
import { useBusinessHours } from '@/lib/hooks/useBusinessHours'
import { FloatingActions } from '@/components/website/FloatingActions'
import { FloatingCartButton } from '@/components/website/FloatingCartButton'
import { CartAnimationProvider } from '@/lib/context/CartAnimationContext'

// Overlays are code-split: they (and framer-motion, used by CartDrawer) load
// after the menu is interactive instead of blocking the first paint.
const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer').then((m) => m.CartDrawer), { ssr: false })
const AuthModal = dynamic(() => import('@/components/auth/AuthModal').then((m) => m.AuthModal), { ssr: false })
const CorporateOrderModal = dynamic(
  () => import('@/components/website/CorporateOrderModal').then((m) => m.CorporateOrderModal),
  { ssr: false },
)
const MenuDrawer = dynamic(() => import('@/components/website/MenuDrawer').then((m) => m.MenuDrawer), { ssr: false })

const DEFAULT_PATTERN_URL =
  'https://assets.indolj.io/upload/1693394669-Final-Pattern.png'
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''

/** Resolves a relative /media/... path to a full URL. Pass-through for absolute URLs. */
function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path || path.trim() === '') return undefined
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) {
    const base = MEDIA_BASE.replace(/\/+$/, '').replace(/\/api$/i, '')
    if (!base) return undefined
    return `${base}${path}`
  }
  return path
}

/** WhatsApp brand glyph (inline SVG, inherits colour via currentColor). */
function WhatsAppIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/** Cart-aware WhatsApp FAB — shifts up above CartBar on mobile. */
function WhatsAppButton() {
  const { totalItems } = useCart()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const cartBarVisible = totalItems > 0
  const bottom = isMobile
    ? (cartBarVisible ? 80 + 8 + 56 + 8 : 24)
    : 24

  return (
    <a
      href="https://wa.me/923366655786"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="group fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 sm:right-6 sm:h-14 sm:w-14"
      style={{
        transform: `translateY(-${bottom - 24}px)`,
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        transition: 'transform 300ms cubic-bezier(.2,.9,.25,1)',
      }}
    >
      <span className="transition-transform duration-200 group-hover:scale-110">
        <WhatsAppIcon size={26} />
      </span>
    </a>
  )
}

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <CartProvider>
        <StoreSettingsProvider>
          <CartAnimationProvider>
            <WebsiteLayoutInner>{children}</WebsiteLayoutInner>
          </CartAnimationProvider>
        </StoreSettingsProvider>
      </CartProvider>
    </ReduxProvider>
  )
}

function WebsiteLayoutInner({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useStoreSettings()
  const { isOpen, closedMessage, todayOpensAt, todayClosesAt, isHoliday, holidayMessage } = useBusinessHours()
  const [authModalOpen, setAuthModalOpen]           = useState(false)
  const [corporateModalOpen, setCorporateModalOpen] = useState(false)
  const [menuOpen, setMenuOpen]                     = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  // ── Scroll progress ────────────────────────────────────────────────────────
  // Written straight to the DOM (transform: scaleX) once per animation frame.
  // Using React state here re-rendered the navbar/footer/cart on every scroll
  // event, which is what made scrolling stutter on phones.
  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      const el = progressRef.current
      if (!el) return
      const doc   = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      const pct   = total > 0 ? Math.min(1, doc.scrollTop / total) : 0
      el.style.transform = `scaleX(${pct})`
      el.style.opacity   = pct > 0 ? '1' : '0'
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [isLoading])

  if (isLoading) return <WebsiteSkeleton />

  // Background: image only (no background color)
  const bgImage = resolveMediaUrl(settings.menu_page_background_image) || DEFAULT_PATTERN_URL

  const primaryColor   = settings.primary_color   || '#000000'
  const secondaryColor = settings.secondary_color || '#FFFFFF'
  const tertiaryColor  = settings.tertiary_color  || '#FFFFFF'

  // ── Closed banner text ─────────────────────────────────────────────────────
  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()

  return (
    <div
      className="relative isolate min-h-dvh"
      style={{
        '--color-primary':   primaryColor,
        '--color-secondary': secondaryColor,
        '--color-tertiary':  tertiaryColor,
      } as React.CSSProperties}
    >
      {/* Page pattern on its own fixed layer. `background-attachment: fixed`
          repaints the whole page every scroll frame on mobile (and iOS ignores it). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 [transform:translateZ(0)]"
        style={{ backgroundImage: `url("${bgImage}")`, backgroundRepeat: 'repeat', backgroundSize: 'auto' }}
      />
      {/* ── Closed / Holiday Banner ───────────────────────────────────────── */}
      <div
        className={` top-0 z-50 w-full text-white overflow-hidden transition-all duration-500 ease-in-out ${
          isHoliday ? 'bg-amber-500' : 'bg-red-600'
        } ${!isOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-base" aria-hidden>{isHoliday ? '🎌' : '🔴'}</span>
            <span>
              {isHoliday
                ? (holidayMessage ? `Holiday Closure: ${holidayMessage}` : 'Closed for holiday today')
                : (closedMessage ?? 'We are currently closed')}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium opacity-90">
            <span>{dateStr}</span>
            <span className="opacity-50">·</span>
            <span>{timeStr}</span>
            {!isHoliday && todayOpensAt && todayClosesAt && !settings.close_store && (
              <>
                <span className="opacity-50">·</span>
                <span>Hours: {todayOpensAt} – {todayClosesAt}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Owns OrderTypeModal (first visit + openLocationModal) */}
      <WebsiteBootstrap />
      <CartDrawer />

      <WebsiteNavbar
        onLoginClick={() => setAuthModalOpen(true)}
        onCorporateClick={() => setCorporateModalOpen(true)}
        onMenuClick={() => setMenuOpen(true)}
      />

      {/* ── Scroll progress bar ─────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full"
      >
        <div
          ref={progressRef}
          className="progress-bar h-full w-full origin-left"
          style={{ transform: 'scaleX(0)', opacity: 0, transition: 'opacity 300ms ease', willChange: 'transform' }}
        />
      </div>

      {children}

      <CartBar />
      <WebsiteFooter />

      <FloatingActions />
      <FloatingCartButton />
      <WhatsAppButton />

      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onGuestContinue={() => setAuthModalOpen(false)}
        />
      )}
      {corporateModalOpen && (
        <CorporateOrderModal onClose={() => setCorporateModalOpen(false)} />
      )}
      <MenuDrawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLoginClick={() => setAuthModalOpen(true)}
      />

      <style jsx>{`
        .progress-bar {
          background: linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-primary));
          box-shadow: 0 0 6px var(--color-primary);
        }
      `}</style>
    </div>
  )
}