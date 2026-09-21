'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  MapPin, Phone, Menu, ShoppingCart,
  Search, ArrowUp, MessageCircle,
} from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'
import { AuthModal } from '@/components/auth/AuthModal'
import { CorporateOrderModal } from '@/components/website/CorporateOrderModal'
import { MenuDrawer } from '@/components/website/MenuDrawer'
import { UserDropdown } from '@/components/website/UserDropdown'

const NAV_LINKS = [
  { label: 'Profile',      href: '/website/profile' },
  { label: 'My Orders',    href: '/website/profile/myOrders' },
  { label: 'My Addresses', href: '/website/profile/addresses' },
]

export function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, totalItems, openCart, location, openLocationModal } = useCart()

  const [authModalOpen, setAuthModalOpen]           = useState(false)
  const [corporateModalOpen, setCorporateModalOpen] = useState(false)
  const [menuOpen, setMenuOpen]                     = useState(false)

  const isCheckout = pathname === '/website/checkout'
  const handleLocationClick = () => {
    if (isCheckout) router.push('/')
    else openLocationModal()
  }

  // Helper: true when the customer has a valid session (in either Redux or localStorage)
  const hasSession = (): boolean => {
    if (user) return true
    if (typeof window === 'undefined') return false
    const token = localStorage.getItem('trestech_customer_token')
    return !!token
  }

  // Redirect if not logged in — but only after client hydration so we
  // don't prematurely redirect based on a stale SSR snapshot of Redux state.
  // Also tolerate the brief window where user/token are still being
  // hydrated on the client (hasSession returns true from localStorage fallback).
  useEffect(() => {
    // Wait until the user is defined (or confirmed null after hydration).
    // Avoid redirect if localStorage still has a token (CartProvider will soon
    // sync it into Redux and the user check will pass on the next render).
    let cancelled = false
    const check = () => {
      if (cancelled) return
      if (typeof window === 'undefined') return
      const hasToken = !!localStorage.getItem('trestech_customer_token')
      if (!user && !hasToken) {
        router.replace('/')
      }
    }
    // Run twice: immediate check + delayed check in case we arrived before
    // localStorage auth was read.
    check()
    const t = setTimeout(check, 50)
    return () => { cancelled = true; clearTimeout(t) }
  }, [user, router])

  // Render nothing until we have a client-side session decision.
  // If user is null but localStorage has a token, CartProvider will sync it.
  if (!hasSession()) return null

  return (
    <div className="min-h-screen font-sans text-neutral-800">

      {/* ── Topbar ────────────────────────────────────────────────── */}
  

      {/* ── Page content ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-[860px] px-4 pt-14 pb-16 md:px-8">
        {children}
      </div>

 

      <a
        href="https://wa.me/923366655786"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform"
      >
        <MessageCircle size={26} fill="white" />
      </a>

      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} onGuestContinue={() => setAuthModalOpen(false)} />
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
