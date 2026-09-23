'use client'

import { useState } from 'react'
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
          <WebsiteLayoutInner>{children}</WebsiteLayoutInner>
        </StoreSettingsProvider>
      </CartProvider>
    </ReduxProvider>
  )
}

function WebsiteLayoutInner({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useStoreSettings()
  const [authModalOpen, setAuthModalOpen]           = useState(false)
  const [corporateModalOpen, setCorporateModalOpen] = useState(false)
  const [menuOpen, setMenuOpen]                     = useState(false)

  if (isLoading) return <WebsiteSkeleton />

  const bgImage = resolveMediaUrl(settings.menu_page_background_image) || DEFAULT_PATTERN_URL
  const bgColor = settings.background_color || ''

  const primaryColor   = settings.primary_color   || '#000000'
  const secondaryColor = settings.secondary_color || '#FFFFFF'
  const tertiaryColor  = settings.tertiary_color  || '#FFFFFF'

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
      {settings.close_store && settings.close_message && (
        <div className="sticky top-0 z-40 bg-red-600 text-white text-center text-xs sm:text-sm py-2 px-3 font-semibold">
          Store is currently closed — {settings.close_message}
        </div>
      )}

      {/* Owns OrderTypeModal (first visit + openLocationModal) */}
      <WebsiteBootstrap />
      <CartDrawer />

      <WebsiteNavbar
        onLoginClick={() => setAuthModalOpen(true)}
        onCorporateClick={() => setCorporateModalOpen(true)}
        onMenuClick={() => setMenuOpen(true)}
      />

      {children}

      <CartBar />
      <WebsiteFooter />
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
    </div>
  )
}