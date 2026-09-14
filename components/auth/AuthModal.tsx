'use client'

import { useState, useEffect as reactUseEffect, useMemo } from 'react'
import Image from 'next/image'
import { X, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'
import { useLogin, useRegister } from '@/api/client/customer'
import { getRestaurantId } from '@/api/utils'
import type { RegisterPayload, CustomerLoginResponse } from '@/api/types'

const COUNTRY_CODES = [
  { code: '+92', flag: '🇵🇰' },
  { code: '+1',  flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+971', flag: '🇦🇪' },
]

type Step = 'login' | 'register'

interface AuthModalProps {
  onClose: () => void
  onGuestContinue: () => void
}

// ⚠️ Storefront CUSTOMER tokens use SEPARATE keys from Admin/Staff JWT.
// The axios interceptor attaches trestech_customer_token to /storefront/ calls,
// and trestech_token to Admin API calls. If we use the wrong key here,
// customer endpoints (add address etc.) get 403 "Authentication credentials were not provided".
const CUSTOMER_TOKEN_KEY   = 'trestech_customer_token'
const CUSTOMER_REFRESH_KEY = 'trestech_customer_refresh_token'
const CUSTOMER_USER_KEY    = 'trestech_customer_user'

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''
function resolveImg(path?: string | null): string | null {
  if (!path?.trim()) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) {
    const base = MEDIA_BASE.replace(/\/+$/, '').replace(/\/api$/i, '')
    return base ? `${base}${path}` : null
  }
  return null
}

const FALLBACK_LOGO =
  'https://assets.indolj.io/upload/1776252259-1652698752-uk-1.jpg'

function persistTokens(data: CustomerLoginResponse) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOMER_TOKEN_KEY, data.access)
  if (data.refresh) localStorage.setItem(CUSTOMER_REFRESH_KEY, data.refresh)
  // Backend returns `customer` on storefront auth; fallback to `user` for compatibility
  const c = data.customer ?? data.user
  if (!c) return
  localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify({
    id: c.id,
    name: (data.customer?.name) ?? `${(data.user as any)?.first_name ?? ''} ${(data.user as any)?.last_name ?? ''}`.trim(),
    phone: c.phone,
    email: c.email || '',
    is_active: c.is_active,
    date_joined: c.date_joined,
  }))
}

function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/\D/g, '')
  if (cleaned.startsWith('92')) cleaned = cleaned.slice(2)
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1)
  return '0' + cleaned
}

export function AuthModal({ onClose, onGuestContinue }: AuthModalProps) {
  const { setUser } = useCart()
  const { settings } = useStoreSettings()

  const brandLogoSrc = useMemo(
    () => resolveImg(settings.merchant_logo) ?? FALLBACK_LOGO,
    [settings.merchant_logo],
  )

  const [step, setStep]           = useState<Step>('login')
  const [countryCode, setCC]      = useState('+92')

  // Login state
  const [loginPhone, setLoginPhone]   = useState('')
  const [loginPass, setLoginPass]     = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)

  // Register state
  const [regName,  setRegName]        = useState('')
  const [regEmail, setRegEmail]       = useState('')
  const [regPhone, setRegPhone]       = useState('')
  const [regPass,  setRegPass]        = useState('')
  const [regPass2, setRegPass2]       = useState('')
  const [showRegPass, setShowRegPass] = useState(false)

  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const login = useLogin({
    onSuccess(data) {
      persistTokens(data)
      const c = data.customer ?? data.user
      setUser({
        name: data.customer?.name ?? `${(data.user as any)?.first_name ?? ''} ${(data.user as any)?.last_name ?? ''}`.trim(),
        phone: c?.phone ?? '',
        email: c?.email || undefined,
      })
      onClose()
    },
  })

  const register = useRegister({
    onSuccess(data) {
      persistTokens(data)
      const c = data.customer ?? data.user
      setUser({
        name: data.customer?.name ?? `${(data.user as any)?.first_name ?? ''} ${(data.user as any)?.last_name ?? ''}`.trim(),
        phone: c?.phone ?? '',
        email: c?.email || undefined,
      })
      onClose()
    },
  })

  reactUseEffect(() => {
    if (login.isPending || register.isPending) {
      setSending(true)
    } else {
      setSending(false)
    }
  }, [login.isPending, register.isPending])

  const handleLogin = () => {
    const cleaned = loginPhone.replace(/\D/g, '')
    if (cleaned.length < 10) {
      setError('Please enter a valid mobile number')
      return
    }
    if (loginPass.length < 6) {
      setError('Please enter your password (min 6 characters)')
      return
    }
    setError('')
    login.login({
      restaurant: Number(getRestaurantId()),
      phone: normalizePhone(loginPhone),
      password: loginPass,
    })
  }

  const handleRegister = () => {
    if (!regName.trim()) { setError('Name is required'); return }
    const cleaned = regPhone.replace(/\D/g, '')
    if (cleaned.length < 10) { setError('Please enter a valid mobile number'); return }
    if (regPass.length < 8) { setError('Password must be at least 8 characters'); return }
    if (regPass !== regPass2) { setError('Passwords do not match'); return }
    setError('')

    const payload: RegisterPayload = {
      restaurant: Number(getRestaurantId()),
      name: regName.trim(),
      email: regEmail.trim() || undefined,
      phone: normalizePhone(regPhone),
      password: regPass,
      password_confirm: regPass2,
    }
    register.register(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300 transition-colors z-10"
        >
          <X size={14} />
        </button>

        {/* Tab bar */}
        <div className="grid grid-cols-2 border-b border-neutral-200">
          {(['login', 'register'] as Step[]).map((s) => (
            <button
              key={s}
              onClick={() => { setStep(s); setError('') }}
              className={`py-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                step === s
                  ? 'bg-white text-[#000000] border-b-2 border-[#000000]'
                  : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {s === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          {/* Brand header */}
          <div className="flex flex-col items-center mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#000000] bg-white shadow-md overflow-hidden sm:h-16 sm:w-16 mb-3">
              <Image
                src={brandLogoSrc}
                alt="Brand Logo"
                width={64}
                height={64}
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">
              {step === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-neutral-500 sm:text-sm mt-1">
              {step === 'login'
                ? 'Enter your phone number and password'
                : 'Register to order faster next time'}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700 sm:px-4 sm:text-xs">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* ── LOGIN ──────────────────────────────────────────────────── */}
          {step === 'login' && (
            <>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700 sm:text-sm">
                  Mobile Number
                </label>
                <div className="flex overflow-hidden rounded-lg border border-neutral-300 focus-within:border-[#000000] focus-within:ring-1 focus-within:ring-[#000000] transition-all">
                  <select
                    value={countryCode}
                    onChange={(e) => setCC(e.target.value)}
                    className="border-r border-neutral-300 bg-neutral-50 px-2 py-2.5 text-xs text-neutral-700 outline-none sm:py-3 sm:text-sm"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="3366655786"
                    value={loginPhone}
                    onChange={(e) => { setLoginPhone(e.target.value.replace(/\D/g, '')); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="flex-1 bg-white px-3 py-2.5 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 sm:px-4 sm:py-3 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700 sm:text-sm">
                  Password
                </label>
                <div className="flex overflow-hidden rounded-lg border border-neutral-300 focus-within:border-[#000000] focus-within:ring-1 focus-within:ring-[#000000] transition-all">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginPass}
                    onChange={(e) => { setLoginPass(e.target.value); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="flex-1 bg-white px-3 py-2.5 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 sm:px-4 sm:py-3 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass((v) => !v)}
                    className="px-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                    aria-label="Toggle password"
                  >
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={sending}
                className="w-full rounded-lg bg-[#000000] py-2.5 text-xs font-bold text-white hover:bg-[#1f1f1f] disabled:opacity-60 transition-colors sm:py-3.5 sm:text-sm"
              >
                {sending ? 'Logging in...' : 'Login'}
              </button>
            </>
          )}

          {/* ── REGISTER ───────────────────────────────────────────────── */}
          {step === 'register' && (
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700 sm:text-sm">
                  Full Name <span className="text-[#000000]">*</span>
                </label>
                <input
                  value={regName}
                  onChange={(e) => { setRegName(e.target.value); setError('') }}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-xs text-neutral-800 outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000] sm:px-4 sm:py-3 sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700 sm:text-sm">
                  Mobile Number
                </label>
                <div className="flex overflow-hidden rounded-lg border border-neutral-300 focus-within:border-[#000000] focus-within:ring-1 focus-within:ring-[#000000] transition-all">
                  <select
                    value={countryCode}
                    onChange={(e) => setCC(e.target.value)}
                    className="border-r border-neutral-300 bg-neutral-50 px-2 py-2.5 text-xs text-neutral-700 outline-none sm:py-3 sm:text-sm"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="3366655786"
                    value={regPhone}
                    onChange={(e) => { setRegPhone(e.target.value.replace(/\D/g, '')); setError('') }}
                    className="flex-1 bg-white px-3 py-2.5 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 sm:px-4 sm:py-3 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700 sm:text-sm">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-xs text-neutral-800 outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000] sm:px-4 sm:py-3 sm:text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700 sm:text-sm">
                  Password
                </label>
                <div className="flex overflow-hidden rounded-lg border border-neutral-300 focus-within:border-[#000000] focus-within:ring-1 focus-within:ring-[#000000] transition-all">
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    value={regPass}
                    onChange={(e) => { setRegPass(e.target.value); setError('') }}
                    placeholder="Min 6 characters"
                    className="flex-1 bg-white px-3 py-2.5 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 sm:px-4 sm:py-3 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass((v) => !v)}
                    className="px-3 text-neutral-400 hover:text-neutral-700 transition-colors"
                    aria-label="Toggle password"
                  >
                    {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-700 sm:text-sm">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={regPass2}
                  onChange={(e) => { setRegPass2(e.target.value); setError('') }}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-xs text-neutral-800 outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000] sm:px-4 sm:py-3 sm:text-sm"
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={sending}
                className="w-full rounded-lg bg-[#000000] py-2.5 text-xs font-bold text-white hover:bg-[#1f1f1f] disabled:opacity-60 transition-colors sm:py-3.5 sm:text-sm"
              >
                {sending ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          )}

          {step === 'login' && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-neutral-200" />
                <span className="text-[11px] text-neutral-400 sm:text-xs">Or</span>
                <div className="flex-1 border-t border-neutral-200" />
              </div>

              <button
                onClick={onGuestContinue}
                className="w-full rounded-lg border-2 border-[#ffffff] bg-[#ffffff]/10 py-2.5 text-xs font-bold text-[#b8860b] hover:bg-[#ffffff]/20 transition-colors sm:py-3.5 sm:text-sm"
              >
                Order as Guest
              </button>
            </>
          )}

          {step === 'register' && (
            <button
              onClick={() => { setStep('login'); setError('') }}
              className="mt-4 w-full text-center text-[11px] text-neutral-500 hover:text-neutral-700 sm:text-xs"
            >
              Already have an account? <span className="text-[#000000] font-semibold">Login →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
