// components/website/UserDropdown.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserCircle, ChevronDown, Package, MapPin, LogOut, User } from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'

export function UserDropdown({ onLoginClick }: { onLoginClick: () => void }) {
  const { user, setUser } = useCart()
  const [open, setOpen]   = useState(false)
  const [pos,  setPos]    = useState({ top: 0, right: 0 })
  const ref               = useRef<HTMLDivElement>(null)
  const btnRef            = useRef<HTMLButtonElement>(null)
  const router            = useRouter()

  // Recompute panel position every time it opens
  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      top:   rect.bottom + window.scrollY + 8,
      right: window.innerWidth - rect.right,
    })
  }, [])

  const handleOpen = () => {
    updatePos()
    setOpen((o) => !o)
  }

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    // Also close + reposition on scroll/resize
    const repos = () => { updatePos() }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    window.addEventListener('scroll', repos, { passive: true })
    window.addEventListener('resize', repos)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
      window.removeEventListener('scroll', repos)
      window.removeEventListener('resize', repos)
    }
  }, [open, updatePos])

  const handleSignOut = () => {
    setUser(null)
    setOpen(false)
    router.push('/')
  }

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-1.5 text-sm font-medium hover:underline"
        aria-label="Sign in or Register"
      >
        <User size={16} />
        <span className="hidden sm:inline">Sign in / Register</span>
      </button>
    )
  }

  const panel = open && typeof window !== 'undefined' ? createPortal(
    <div
      ref={ref}
      style={{ position: 'absolute', top: pos.top, right: pos.right, zIndex: 99999 }}
      className="w-44 rounded-xl bg-white shadow-2xl border border-neutral-100 overflow-hidden"
    >
      <Link
        href="/website/profile"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <UserCircle size={16} className="text-neutral-400" />
        My Profile
      </Link>
      <Link
        href="/website/profile/myOrders"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <Package size={16} className="text-neutral-400" />
        My Orders
      </Link>
      <Link
        href="/website/profile/addresses"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <MapPin size={16} className="text-neutral-400" />
        My Addresses
      </Link>
      <div className="border-t border-neutral-100" />
      <button
        onClick={handleSignOut}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[#000000] hover:bg-red-50 transition-colors"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>,
    document.body
  ) : null

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
      >
        <UserCircle size={18} />
        <span className="hidden sm:inline">{user.name}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {panel}
    </div>
  )
}