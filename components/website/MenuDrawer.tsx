'use client'

import { useEffect } from 'react'
import {
  X,
  LogIn,
  UserCircle,
  Info,
  BookOpen,
  Mail,
  MapPin,
  MessageSquareWarning,
  ChevronRight,
} from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'

const MENU_ITEMS = [
  { label: 'About Us',         href: '/website/about',     icon: Info },
  { label: 'Blog',             href: '/website/blog',      icon: BookOpen },
  { label: 'Contact Us',       href: '/website/contact',   icon: Mail },
  { label: 'Our Locations',    href: '/website/locations', icon: MapPin },
  { label: 'Submit Complaint', href: '/website/complaint', icon: MessageSquareWarning },
]

interface MenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  onLoginClick: () => void
}

// Panel opens as a circle expanding from the top-right corner (where the menu button lives)
const ORIGIN = 'calc(100% - 30px) 30px'
const EASE = 'cubic-bezier(0.7, 0, 0.2, 1)'

export function MenuDrawer({ isOpen, onClose, onLoginClick }: MenuDrawerProps) {
  const { user } = useCart()

  // Close on Escape + lock page scroll while open
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  const handleAuthClick = () => {
    onClose()
    onLoginClick()
  }

  // Stagger children in when opening, drop instantly when closing
  const enter = (i: number) => ({
    transitionDelay: isOpen ? `${300 + i * 70}ms` : '0ms',
  })
  const enterCls = (extra = '') =>
    `transition-all duration-500 ease-out ${
      isOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
    } ${extra}`

  return (
    <>
      <style>{`
        @keyframes md-drift-a { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(-30px,40px) scale(1.15) } }
        @keyframes md-drift-b { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(35px,-30px) scale(1.1) } }
        @keyframes md-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,.35) } 100% { box-shadow: 0 0 0 14px rgba(255,255,255,0) } }
        @media (prefers-reduced-motion: reduce) {
          .md-anim, .md-anim * { animation: none !important; transition-duration: 1ms !important; transition-delay: 0ms !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!isOpen}
        className="md-anim fixed right-0 top-0 z-50 flex h-full w-[86%] max-w-sm flex-col overflow-hidden bg-[var(--color-primary)] text-white shadow-2xl"
        style={{
          clipPath: isOpen
            ? `circle(150% at ${ORIGIN})`
            : `circle(0px at ${ORIGIN})`,
          transition: `clip-path 650ms ${EASE}, visibility 0s linear ${isOpen ? '0s' : '650ms'}`,
          visibility: isOpen ? 'visible' : 'hidden',
        }}
      >
        {/* Ambient light blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-white/15 blur-3xl"
          style={{ animation: 'md-drift-a 9s ease-in-out infinite' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-[var(--color-secondary)] opacity-60 blur-3xl"
          style={{ animation: 'md-drift-b 11s ease-in-out infinite' }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pb-2 pt-5">
          <h2
            className={enterCls('text-2xl font-semibold tracking-tight')}
            style={enter(0)}
          >
            Menu
          </h2>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-all duration-300 hover:rotate-90 hover:bg-white hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Links */}
        <nav className="relative mt-4 flex flex-col gap-2 px-4">
          {MENU_ITEMS.map((item, i) => {
            const Icon = item.icon
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={onClose}
                style={enter(i + 1)}
                className={enterCls(
                  'group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
                )}
              >
                {/* Fill that sweeps in from the left on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 origin-left scale-x-0 bg-white transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
                />

                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-all duration-500 group-hover:-rotate-6 group-hover:bg-[var(--color-primary)] group-hover:text-white">
                  <Icon size={18} />
                </span>

                <span className="relative flex-1 text-[15px] font-semibold transition-all duration-500 group-hover:translate-x-1 group-hover:text-[var(--color-primary)]">
                  {item.label}
                </span>

                <ChevronRight
                  size={18}
                  className="relative -translate-x-2 opacity-40 transition-all duration-500 group-hover:translate-x-0 group-hover:text-[var(--color-primary)] group-hover:opacity-100"
                />
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="relative mt-auto px-4 pb-6">
          <button
            onClick={handleAuthClick}
            style={enter(MENU_ITEMS.length + 1)}
            className={enterCls(
              'group flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left text-[var(--color-primary)] shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
            )}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white"
              style={{ animation: isOpen ? 'md-pulse-ring 2s ease-out infinite' : 'none' }}
            >
              {user ? <UserCircle size={20} /> : <LogIn size={18} />}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold">
                {user ? 'My account' : 'Log in'}
              </span>
              <span className="block text-xs opacity-60">
                {user ? 'View your profile and orders' : 'Sign in to place your order'}
              </span>
            </span>
            <ChevronRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>

          <p className="mt-4 text-center text-xs text-white/60">
            Powered by <span className="font-bold text-white/80">Trestech</span>
          </p>
        </div>
      </aside>
    </>
  )
}