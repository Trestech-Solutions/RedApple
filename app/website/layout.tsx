'use client'

import { useState, useEffect } from 'react'
import {
  CartProvider, StoreSettingsProvider, useStoreSettings,
} from '@/lib/hooks/useCart'
import { ReduxProvider } from '@/redux/Provider'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { CartBar } from '@/components/cart/CartBar'
import { WebsiteBootstrap } from '@/components/website/WebsiteBootstrap'
import { WebsiteNavbar } from '@/components/website/WebsiteNavbar'
import { WebsiteFooter } from '@/components/website/WebsiteFooter'
import { WebsiteSkeleton } from '@/components/website/WebsiteSkeleton'
import { AuthModal } from '@/components/auth/AuthModal'
import { CorporateOrderModal } from '@/components/website/CorporateOrderModal'
import { MenuDrawer } from '@/components/website/MenuDrawer'
import { useBusinessHours } from '@/lib/hooks/useBusinessHours'
import { FloatingActions } from '@/components/website/FloatingActions'
import { CartAnimationProvider } from '@/lib/context/CartAnimationContext'

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
  const [scrollPct, setScrollPct]                   = useState(0)

  // ── Scroll progress ────────────────────────────────────────────────────────
  useEffect(() => {
    function update() {
      const el  = document.documentElement
      const scrolled = el.scrollTop  || document.body.scrollTop
      const total    = el.scrollHeight - el.clientHeight
      setScrollPct(total > 0 ? (scrolled / total) * 100 : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  if (isLoading) return <WebsiteSkeleton />

  const bgImage = resolveMediaUrl(settings.menu_page_background_image) || DEFAULT_PATTERN_URL
  const bgColor = settings.background_color || ''

  const primaryColor   = settings.primary_color   || '#000000'
  const secondaryColor = settings.secondary_color || '#FFFFFF'
  const tertiaryColor  = settings.tertiary_color  || '#FFFFFF'

  // ── Closed banner text ─────────────────────────────────────────────────────
  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()

  return (
    <div
      style={{
        ...(bgColor ? { backgroundColor: bgColor } : {}),
        backgroundImage: `url("${bgImage}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        '--color-primary':   primaryColor,
        '--color-secondary': secondaryColor,
        '--color-tertiary':  tertiaryColor,
      } as React.CSSProperties}
    >
      {/* ── Closed / Holiday Banner ───────────────────────────────────────── */}
      <div
        className={` top-0 z-50 w-full text-white overflow-hidden transition-all duration-500 ease-in-out ${
          isHoliday ? 'bg-amber-500' : 'bg-red-600'
        } ${!isOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6">

            {/* Left: icon + main message */}
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-base" aria-hidden>{isHoliday ? '🎌' : '🔴'}</span>
              <span>
                {isHoliday
                  ? (holidayMessage ? `Holiday Closure: ${holidayMessage}` : 'Closed for holiday today')
                  : (closedMessage ?? 'We are currently closed')}
              </span>
            </div>

            {/* Right: date · time */}
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

      {/* ── Scroll progress bar (animated, flows left → right) ─────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full"
      >
        <div
          className="relative h-full"
          style={{
            width: `${scrollPct}%`,
            opacity: scrollPct > 0 ? 1 : 0,
            transition: 'width 120ms ease-out, opacity 300ms ease',
          }}
        >
          {/* flowing gradient, moves left → right continuously */}
          <div className="progress-flow absolute inset-0 overflow-hidden" />
          {/* moving light sweep */}
          <div className="progress-sweep absolute inset-0 overflow-hidden" />
          {/* glowing head at the leading edge */}
          <span className="progress-head absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full" />
        </div>
      </div>

      {children}

      <CartBar />
      <WebsiteFooter />

      {/* ── Floating action buttons (search + scroll-to-top) ── */}
      <FloatingActions />
<a
      
        href="https://wa.me/923366655786"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
      >
        <span className="transition-transform duration-200 group-hover:scale-110">
          <WhatsAppIcon size={30} />
        </span>
      </a>

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
        .progress-flow {
          background: linear-gradient(
            90deg,
            var(--color-primary),
            var(--color-secondary),
            var(--color-primary),
            var(--color-secondary),
            var(--color-primary)
          );
          background-size: 200% 100%;
          animation: progress-flow 1.8s linear infinite;
          box-shadow: 0 0 8px 1px var(--color-primary);
        }
        @keyframes progress-flow {
          from { background-position: 100% 0; }
          to   { background-position: 0% 0; }
        }

        .progress-sweep::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent);
          transform: translateX(-100%);
          animation: progress-sweep 1.4s ease-in-out infinite;
        }
        @keyframes progress-sweep {
          from { transform: translateX(-100%); }
          to   { transform: translateX(350%); }
        }

        .progress-head {
          background: var(--color-primary);
          box-shadow: 0 0 10px 3px var(--color-primary);
          animation: progress-head-pulse 1.2s ease-in-out infinite;
        }
        @keyframes progress-head-pulse {
          0%, 100% { transform: translate(50%, -50%) scale(1); opacity: 0.9; }
          50%      { transform: translate(50%, -50%) scale(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  )
}