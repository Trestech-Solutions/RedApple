'use client'

import { X, LogIn, UserCircle } from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'

const MENU_ITEMS = [
  { label: 'About Us',         href: '/website/about' },
  { label: 'Blog',             href: '/website/blog' },
  { label: 'Contact Us',       href: '/website/contact' },
  { label: 'Our Locations',    href: '/website/locations' },
  { label: 'Submit Complaint', href: '/website/complaint' },
]

interface MenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  onLoginClick: () => void
}

export function MenuDrawer({ isOpen, onClose, onLoginClick }: MenuDrawerProps) {
  const { user } = useCart()

  const handleAuthClick = () => {
    onClose()
    onLoginClick()
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Drawer — slides in from right */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-64 flex-col bg-[var(--color-primary)] shadow-2xl transition-transform duration-300 sm:w-72 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button */}
        <div className="flex justify-end p-3 sm:p-4">
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-7 w-7 items-center justify-center bg-[var(--color-secondary)] rounded-full text-white hover:bg-white/20 transition-colors sm:h-8 sm:w-8"
          >
            <X size={16} className="sm:hidden" />
            <X size={18} className="hidden sm:block" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col  gap-2.5 px-4 sm:gap-3 sm:px-5">
          {MENU_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="rounded-lg bg-[var(--color-secondary)]  [background-color:color-mix(in_srgb,var(--color-primary),white_12%)] px-4 py-3 text-sm font-bold text-white hover:[background-color:color-mix(in_srgb,var(--color-primary),white_25%)] transition-colors sm:px-5 sm:py-3.5"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-5 pb-6">
          <p className="text-center text-xs text-white/60">
            Powered by{' '}
            <span className="font-bold text-white/80">Trestech</span>
          </p>
        </div>
      </div>
    </>
  )
}
