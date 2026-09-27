'use client'

import { useState, useEffect as reactUseEffect, useMemo } from 'react'
import Image from 'next/image'
import { X, AlertCircle, Eye, EyeOff, Phone, Lock, User, Mail } from 'lucide-react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'
import { useLogin, useRegister } from '@/api/client/customer'
import { getRestaurantId } from '@/api/utils'
import type { RegisterPayload, CustomerLoginResponse } from '@/api/types'
import { useAppDispatch } from '@/redux/hooks'
import { setTokens as reduxSetTokens, logout as reduxLogout } from '@/redux/slices/authSlice'

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

function persistTokens(data: CustomerLoginResponse, dispatch?: ReturnType<typeof useAppDispatch>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOMER_TOKEN_KEY, data.access)
  if (data.refresh) localStorage.setItem(CUSTOMER_REFRESH_KEY, data.refresh)
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
  if (dispatch && data.access) {
    dispatch(reduxSetTokens({
      accessToken: data.access,
      refreshToken: data.refresh ?? '',
    }))
  }
}

function clearCustomerAuth(dispatch?: ReturnType<typeof useAppDispatch>) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CUSTOMER_TOKEN_KEY)
  localStorage.removeItem(CUSTOMER_REFRESH_KEY)
  localStorage.removeItem(CUSTOMER_USER_KEY)
  if (dispatch) dispatch(reduxLogout())
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
  const dispatch = useAppDispatch()

  const brandLogoSrc = useMemo(
    () => resolveImg(settings.merchant_logo) ?? FALLBACK_LOGO,
    [settings.merchant_logo],
  )

  const [step, setStep]           = useState<Step>('login')
  const [countryCode, setCC]      = useState('+92')

  const [loginPhone, setLoginPhone]   = useState('')
  const [loginPass, setLoginPass]     = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)

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
      persistTokens(data, dispatch)
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
      persistTokens(data, dispatch)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div
        className={`relative w-full rounded-[2rem] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-h-[95vh] overflow-y-auto border border-black/5 transition-all duration-300 ${
          step === 'register' ? 'max-w-xl' : 'max-w-md'
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-neutral-500 backdrop-blur hover:bg-black/10 hover:text-neutral-800 hover:rotate-90 transition-all duration-300"
        >
          <X size={15} />
        </button>

        {/* Header band */}
        <div
          className="relative px-6 pt-8 pb-16 sm:px-8 sm:pt-10 sm:pb-20 rounded-b-[2.5rem]"
          style={{ background: `linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, black))` }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg overflow-hidden ring-4 ring-white/30 sm:h-20 sm:w-20">
              <Image
                src={brandLogoSrc}
                alt="Brand Logo"
                width={80}
                height={80}
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="mt-4 text-xl font-extrabold tracking-tight text-[var(--color-secondary)] sm:text-2xl">
              {step === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-secondary)]/80 sm:text-sm">
              {step === 'login'
                ? 'Log in to continue your order'
                : 'Join us for a faster checkout'}
            </p>
          </div>
        </div>

        {/* Floating tab pill */}
        <div className="relative z-10 -mt-8 flex justify-center px-6">
          <div className="grid w-full max-w-xs grid-cols-2 rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5">
            {(['login', 'register'] as Step[]).map((s) => (
              <button
                key={s}
                onClick={() => { setStep(s); setError('') }}
                className={`relative rounded-xl py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
                  step === s
                    ? 'bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-md'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {s === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-8 pt-6 sm:px-8 sm:pb-10">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-[11px] text-red-700 ring-1 ring-red-100 sm:text-xs">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* ── LOGIN ──────────────────────────────────────────────────── */}
          {step === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 sm:text-sm">
                  <Phone size={13} className="text-[var(--color-primary)]" /> Mobile Number
                </label>
                <div className="flex overflow-hidden rounded-2xl border-2 border-neutral-100 bg-neutral-50 transition-all focus-within:border-[var(--color-primary)] focus-within:bg-white">
                  <select
                    value={countryCode}
                    onChange={(e) => setCC(e.target.value)}
                    className="border-r-2 border-neutral-100 bg-transparent px-2.5 py-3 text-xs font-medium text-neutral-700 outline-none sm:text-sm"
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
                    className="flex-1 bg-transparent px-3 py-3 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 sm:px-4 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 sm:text-sm">
                  <Lock size={13} className="text-[var(--color-primary)]" /> Password
                </label>
                <div className="flex overflow-hidden rounded-2xl border-2 border-neutral-100 bg-neutral-50 transition-all focus-within:border-[var(--color-primary)] focus-within:bg-white">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginPass}
                    onChange={(e) => { setLoginPass(e.target.value); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="flex-1 bg-transparent px-3.5 py-3 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 sm:px-4 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass((v) => !v)}
                    className="px-3.5 text-neutral-400 hover:text-[var(--color-primary)] transition-colors"
                    aria-label="Toggle password"
                  >
                    {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={sending}
                className="w-full rounded-2xl bg-[var(--color-primary)] py-3.5 text-xs font-bold text-[var(--color-secondary)] shadow-lg shadow-[var(--color-primary)]/30 transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-60 sm:text-sm"
              >
                {sending ? 'Logging in...' : 'Login'}
              </button>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 border-t border-dashed border-neutral-200" />
                <span className="text-[11px] font-medium text-neutral-400 sm:text-xs">Or</span>
                <div className="flex-1 border-t border-dashed border-neutral-200" />
              </div>

              <button
                onClick={onGuestContinue}
                className="w-full rounded-2xl border-2 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 py-3.5 text-xs font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/10 active:scale-[0.98] sm:text-sm"
              >
                Order as Guest
              </button>
            </div>
          )}

          {/* ── REGISTER ───────────────────────────────────────────────── */}
          {step === 'register' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 sm:text-sm">
                    <User size={13} className="text-[var(--color-primary)]" /> Full Name <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input
                    value={regName}
                    onChange={(e) => { setRegName(e.target.value); setError('') }}
                    placeholder="John Doe"
                    className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 px-3.5 py-3 text-xs text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[var(--color-primary)] focus:bg-white sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 sm:text-sm">
                    <Phone size={13} className="text-[var(--color-primary)]" /> Mobile Number
                  </label>
                  <div className="flex overflow-hidden rounded-2xl border-2 border-neutral-100 bg-neutral-50 transition-all focus-within:border-[var(--color-primary)] focus-within:bg-white">
                    <select
                      value={countryCode}
                      onChange={(e) => setCC(e.target.value)}
                      className="border-r-2 border-neutral-100 bg-transparent px-2 py-3 text-xs font-medium text-neutral-700 outline-none sm:text-sm"
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
                      className="flex-1 min-w-0 bg-transparent px-3 py-3 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 sm:text-sm">
                    <Mail size={13} className="text-[var(--color-primary)]" /> Email
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 px-3.5 py-3 text-xs text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[var(--color-primary)] focus:bg-white sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 sm:text-sm">
                    <Lock size={13} className="text-[var(--color-primary)]" /> Password
                  </label>
                  <div className="flex overflow-hidden rounded-2xl border-2 border-neutral-100 bg-neutral-50 transition-all focus-within:border-[var(--color-primary)] focus-within:bg-white">
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={regPass}
                      onChange={(e) => { setRegPass(e.target.value); setError('') }}
                      placeholder="Min 8 chars"
                      className="flex-1 min-w-0 bg-transparent px-3.5 py-3 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass((v) => !v)}
                      className="px-3 text-neutral-400 hover:text-[var(--color-primary)] transition-colors"
                      aria-label="Toggle password"
                    >
                      {showRegPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-600 sm:text-sm">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={regPass2}
                  onChange={(e) => { setRegPass2(e.target.value); setError('') }}
                  placeholder="Re-enter password"
                  className="w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 px-3.5 py-3 text-xs text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-[var(--color-primary)] focus:bg-white sm:px-4 sm:text-sm"
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={sending}
                className="w-full rounded-2xl bg-[var(--color-primary)] py-3.5 text-xs font-bold text-[var(--color-secondary)] shadow-lg shadow-[var(--color-primary)]/30 transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-60 sm:text-sm"
              >
                {sending ? 'Creating Account...' : 'Create Account'}
              </button>

              <button
                onClick={() => { setStep('login'); setError('') }}
                className="w-full text-center text-[11px] text-neutral-500 hover:text-neutral-700 sm:text-xs"
              >
                Already have an account? <span className="font-bold text-[var(--color-primary)]">Login →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}