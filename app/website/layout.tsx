'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import {
  CartProvider, StoreSettingsProvider, useCart, useStoreSettings,
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
import { OrderTypeModal } from '@/components/website/OrderTypeModal'

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
  const { locationModalOpen, closeLocationModal } = useCart()
  const { settings, isLoading } = useStoreSettings()
  const [authModalOpen, setAuthModalOpen]           = useState(false)
  const [corporateModalOpen, setCorporateModalOpen] = useState(false)
  const [menuOpen, setMenuOpen]                     = useState(false)

  // While the combine-menu API call is in-flight, show the full-page skeleton
  // so the user never sees an unstyled / partial navbar before data is ready.
  if (isLoading) return <WebsiteSkeleton />

  // Background: prefer menu_page_background_image → background_color → default pattern
  const bgImage = resolveMediaUrl(settings.menu_page_background_image) || DEFAULT_PATTERN_URL
  const bgColor = settings.background_color || ''

  return (
    <div
      style={{
        ...(bgColor ? { backgroundColor: bgColor } : {}),
        backgroundImage: `url("${bgImage}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      }}
    >
      {settings.close_store && settings.close_message && (
        <div className="sticky top-0 z-40 bg-red-600 text-white text-center text-xs sm:text-sm py-2 px-3 font-semibold">
          Store is currently closed — {settings.close_message}
        </div>
      )}
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
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform"
      >
        <MessageCircle size={26} fill="white" />
      </a>

      {locationModalOpen && (
        <OrderTypeModal onClose={closeLocationModal} />
      )}
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
