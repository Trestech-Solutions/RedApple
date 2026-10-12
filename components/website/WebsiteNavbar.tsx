// components/website/WebsiteNavbar.tsx
'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Phone, ShoppingBag, MessageCircle, ChevronDown, Menu } from 'lucide-react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'
import { UserDropdown } from '@/components/website/UserDropdown'
import { RecentOrdersDropdown } from '@/components/website/RecentOrdersDropdown'

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''
const FALLBACK_LOGO = '/web/logo.webp'

function resolveMediaUrl(path?: string | null): string {
  if (!path || path.trim() === '') return FALLBACK_LOGO
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) {
    const base = MEDIA_BASE.replace(/\/+$/, '').replace(/\/api$/i, '')
    return base ? `${base}${path}` : FALLBACK_LOGO
  }
  return FALLBACK_LOGO
}

/** Only accept well-formed hex colours (store data has values like '#00000'). */
function validHex(color?: string | null): string | undefined {
  const c = color?.trim()
  return c && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c) ? c : undefined
}

/** True when a #rgb / #rrggbb colour is dark enough to need light text on top. */
function isDarkColor(color: string): boolean {
  const hex = color.trim().replace('#', '')
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return false
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55
}

/* ------------------------------------------------------------------ */
/*  Colours come from CSS variables so the store's theme still rules:  */
/*    --wn-bg    = settings.navbar_color      (bar surface)            */
/*    --wn-brand = brand accent (merchant_header_background / fg)     */
/*    --wn-text  = readable text on the bar (auto light/dark)         */
/* ------------------------------------------------------------------ */
const NAVBAR_CSS = `
@keyframes wn-enter { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
@keyframes wn-bump  { 0%,100% { transform: scale(1); } 35% { transform: scale(1.14); } 70% { transform: scale(.96); } }
@keyframes wn-pop   { 0% { transform: scale(0); } 70% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes wn-ping  { 0% { transform: scale(1); opacity: .7; } 80%,100% { transform: scale(2.4); opacity: 0; } }
@keyframes wn-spin  { to { transform: rotate(360deg); } }
@keyframes wn-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes wn-logo-in {
  0%   { opacity: 0; transform: translateY(-16px) scale(.7) rotate(-12deg); }
  60%  { opacity: 1; transform: translateY(2px) scale(1.06) rotate(3deg); }
  100% { opacity: 1; transform: none; }
}
@keyframes wn-shine { 0%,72% { transform: translateX(-180%) skewX(-20deg); } 100% { transform: translateX(280%) skewX(-20deg); } }

.wn-bar  { animation: wn-enter .45s cubic-bezier(.2,.8,.2,1) both; }
.wn-bump { animation: wn-bump .5s ease; }
.wn-pop  { animation: wn-pop .35s cubic-bezier(.3,1.6,.5,1); }
.wn-ping { animation: wn-ping 2s cubic-bezier(0,0,.2,1) infinite; }

/* Logo: entrance once, then a slow float + rotating brand ring + occasional shine.
   Transform/opacity only, so it stays smooth on phones. */
.wn-logo-in    { animation: wn-logo-in .9s cubic-bezier(.2,.9,.25,1) .1s both; }
.wn-logo-float { animation: wn-float 5s ease-in-out 1s infinite; }
.wn-logo-ring  { animation: wn-spin 9s linear infinite; }
.wn-logo-tile  { transition: transform .35s cubic-bezier(.3,1.5,.5,1); }
.wn-logo:hover .wn-logo-tile { transform: scale(1.06) rotate(-3deg); }
.wn-logo-shine::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 45%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent);
  animation: wn-shine 6.5s ease-in-out 1.6s infinite;
  pointer-events: none;
}

/* Quiet "ghost" control: transparent until hovered */
.wn-ghost { transition: background-color .2s ease, color .2s ease; }
.wn-ghost:hover { background-color: color-mix(in srgb, var(--wn-text) 6%, transparent); }

/* Primary control (cart): solid brand */
.wn-primary {
  background-color: var(--wn-brand);
  color: var(--wn-on-brand);
  box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--wn-brand) 70%, transparent);
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
}
.wn-primary:hover  { filter: brightness(1.06); box-shadow: 0 10px 22px -8px color-mix(in srgb, var(--wn-brand) 75%, transparent); }
.wn-primary:active { transform: scale(.95); }

.wn-focus:focus-visible { outline: 2px solid var(--wn-brand); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .wn-bar, .wn-bump, .wn-pop, .wn-ping, .wn-logo-in, .wn-logo-float, .wn-logo-ring,
  .wn-logo-shine::after { animation: none !important; }
}
`

interface WebsiteNavbarProps {
  onLoginClick: () => void
  onCorporateClick: () => void
  onMenuClick: () => void
}

export function WebsiteNavbar({ onLoginClick, onMenuClick }: WebsiteNavbarProps) {
  const pathname = usePathname()
  const { totalItems, openCart, location, openLocationModal } = useCart()
  const { settings } = useStoreSettings()

  /* ---------- theme (all from store settings) ---------- */
  const navBg     = validHex(settings.navbar_color) || '#ffffff'
  const logoBg    = validHex(settings.foreground_color) || '#ffffff'
  // Accent = the store's brand colour (same red as the category bar / buttons).
  const brand     =
    validHex(settings.primary_color) ||
    validHex(settings.merchant_header_background) ||
    validHex(settings.category_navbar_background_color) ||
    '#171717'
  const barIsDark = isDarkColor(navBg)
  const textColor = barIsDark ? '#ffffff' : '#171717'
  const onBrand   = isDarkColor(brand) ? '#ffffff' : '#171717'

  const logoSrc = resolveMediaUrl(settings.merchant_logo)
  const logoLeftAlign = Boolean(settings.logo_left_align)
  const logoFit = Boolean(settings.logo_fit_to_navbar)
  const logoLink =
    settings.logo_link && settings.logo_link.trim() !== '' ? settings.logo_link : '/'
  const logoIsExternal = /^https?:\/\//i.test(logoLink)

  const showPhone = settings.show_navbar !== false && !settings.hide_phone_from_header
  const showCartIcon = settings.show_cart_icon !== false
  const isWhatsapp = (settings.phone_icon_type || 'none') === 'whatsapp'
  const phoneHref = isWhatsapp ? 'https://wa.me/923366655786' : 'tel:021111022022'

  const isHome = pathname === '/' || pathname === '/website/home'
  const locationLabel = location || 'Select location'

  /* ---------- cart bump when an item is added ---------- */
  const [bump, setBump] = useState(false)
  const prevItems = useRef(totalItems)
  useEffect(() => {
    const increased = totalItems > prevItems.current
    prevItems.current = totalItems
    if (!increased) return
    setBump(true)
    const t = setTimeout(() => setBump(false), 550)
    return () => clearTimeout(t)
  }, [totalItems])

  /* ---------- logo ---------- */
  // Big badge logo that hangs over the bar's bottom edge (unless the store
  // chose "fit to navbar", which keeps it small and inside the bar).
  const logoBox = logoFit
    ? 'h-10 w-10 sm:h-11 sm:w-11'
    : 'h-[60px] w-[60px] sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-[108px] lg:w-[108px]'
  const logoSpacer = logoFit
    ? 'w-10 sm:w-11'
    : 'w-[60px] sm:w-20 md:w-24 lg:w-[108px]'
  const logoPos = logoFit ? 'top-1/2 -translate-y-1/2' : 'top-1.5 sm:top-2'
  const ringGradient =
    `conic-gradient(from 0deg, ${brand}, color-mix(in srgb, ${brand} 8%, transparent) 25%, ` +
    `${brand} 50%, color-mix(in srgb, ${brand} 8%, transparent) 75%, ${brand})`

  const LogoElement = (
    <span className="wn-logo wn-logo-in relative block">
      <span className="wn-logo-float relative block">
        {/* soft glow + crisp rotating brand ring */}
        <span aria-hidden className="wn-logo-ring absolute -inset-1.5 rounded-full opacity-50 blur-md" style={{ background: ringGradient }} />
        <span aria-hidden className="wn-logo-ring absolute -inset-[5px] rounded-full" style={{ background: ringGradient }} />
        <span
          className={`wn-logo-tile wn-logo-shine relative grid ${logoBox} place-items-center overflow-hidden rounded-full`}
          style={{
            backgroundColor: logoBg,
            boxShadow: `0 0 0 3px ${navBg}, 0 16px 32px -12px rgba(0,0,0,.5)`,
          }}
        >
          <Image
            src={logoSrc}
            alt="Logo"
            width={216}
            height={216}
            className="h-full w-full object-contain p-[12%]"
            priority
          />
        </span>
      </span>
    </span>
  )

  const LogoLinked = logoIsExternal ? (
    <a href={logoLink} target="_blank" rel="noopener noreferrer" aria-label="Visit website" className="wn-focus block shrink-0 rounded-full">
      {LogoElement}
    </a>
  ) : isHome ? (
    <div className="shrink-0">{LogoElement}</div>
  ) : (
    <Link href={logoLink} aria-label="Home" className="wn-focus block shrink-0 rounded-full">
      {LogoElement}
    </Link>
  )

  const themeVars = {
    '--wn-bg': navBg,
    '--wn-brand': brand,
    '--wn-on-brand': onBrand,
    '--wn-text': textColor,
  } as CSSProperties

  const muted = barIsDark ? 'text-white/60' : 'text-neutral-500'
  const hairline = `color-mix(in srgb, ${textColor} 9%, transparent)`

  return (
    <header
      id="site-header"
      className="relative z-30 w-full px-3 pt-3 sm:px-5 sm:pt-4 lg:px-7"
      style={{ ...themeVars, color: textColor }}
    >
      <style dangerouslySetInnerHTML={{ __html: NAVBAR_CSS }} />

      <div
        className="wn-bar relative mx-auto max-w-[1384px] rounded-2xl sm:rounded-[20px]"
        style={{
          backgroundColor: navBg,
          border: `1px solid ${hairline}`,
          boxShadow: '0 1px 2px rgba(0,0,0,.04), 0 12px 32px -18px rgba(0,0,0,.28)',
        }}
      >
        <div className="relative flex h-16 items-center gap-2 px-2.5 sm:h-[72px] sm:gap-3 sm:px-4 md:h-20 md:px-5">
          {/* ── Left ── */}
          <div className="flex min-w-0 flex-1 basis-0 items-center gap-2 sm:gap-3">
            {logoLeftAlign && <div aria-hidden className={`${logoSpacer} shrink-0`} />}

            <button
              type="button"
              onClick={() => openLocationModal()}
              aria-label={`Change location (currently ${locationLabel})`}
              className="wn-ghost wn-focus group flex min-w-0 items-center gap-2 rounded-xl p-1 pr-1.5 text-left sm:gap-2.5 sm:p-1.5 sm:pr-3"
            >
              <span
                className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10"
                style={{ backgroundColor: `color-mix(in srgb, ${brand} 12%, transparent)`, color: brand }}
              >
                <MapPin size={18} strokeWidth={2.2} />
                {location && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                    <span className="wn-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2" style={{ ['--tw-ring-color' as string]: navBg }} />
                  </span>
                )}
              </span>
              <span className="min-w-0 leading-tight">
                <span className={`hidden text-[10px] font-semibold uppercase tracking-[0.14em] sm:block ${muted}`}>
                  Deliver to
                </span>
                <span className="flex items-center gap-1">
                  <span className="block max-w-[72px] truncate text-xs font-semibold min-[400px]:max-w-[104px] sm:max-w-[150px] sm:text-sm md:max-w-[200px]">
                    {locationLabel}
                  </span>
                  <ChevronDown size={14} className={`hidden shrink-0 transition-transform group-hover:translate-y-px sm:block ${muted}`} />
                </span>
              </span>
            </button>
          </div>

          {/* ── Centre logo ── */}
          <div
            className={`pointer-events-none absolute z-20 ${logoPos} ${
              logoLeftAlign ? 'left-2.5 sm:left-4 md:left-5' : 'inset-x-0 flex justify-center'
            }`}
          >
            <div className="pointer-events-auto">{LogoLinked}</div>
          </div>

          {/* ── Right ── */}
          <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-1.5 md:gap-2">
            {showPhone && (
              <a
                href={phoneHref}
                target={isWhatsapp ? '_blank' : undefined}
                rel={isWhatsapp ? 'noopener noreferrer' : undefined}
                aria-label={isWhatsapp ? 'Chat on WhatsApp' : 'Call us'}
                className="wn-ghost wn-focus hidden h-10 items-center gap-2 rounded-xl px-3 lg:flex"
              >
                {isWhatsapp
                  ? <MessageCircle size={18} strokeWidth={2.2} className="text-[#25D366]" />
                  : <Phone size={17} strokeWidth={2.2} style={{ color: brand }} />}
                <span className="hidden text-sm font-semibold tabular-nums tracking-wide xl:inline">
                  021-111-022-022
                </span>
              </a>
            )}

            {showPhone && (
              <span aria-hidden className="mx-1 hidden h-6 w-px lg:block" style={{ backgroundColor: hairline }} />
            )}

            {settings.enable_user_login !== false && (
              <div className="wn-ghost flex h-10 min-w-10 items-center justify-center rounded-xl px-2.5 text-sm font-semibold [&_button]:hover:no-underline sm:px-3">
                <UserDropdown onLoginClick={onLoginClick} />
              </div>
            )}

            {/* Recent orders: only renders when the cookie has order IDs */}
            <RecentOrdersDropdown navFg={brand} iconTextColor={onBrand} />

            {showCartIcon && (
              <button
                type="button"
                onClick={openCart}
                aria-label={totalItems > 0 ? `Open cart, ${totalItems} items` : 'Open cart'}
                data-cart-target="true"
                className={`wn-primary wn-focus relative grid h-10 w-10 place-items-center rounded-xl sm:h-11 sm:w-11 ${bump ? 'wn-bump' : ''}`}
              >
                <ShoppingBag size={19} strokeWidth={2.2} />
                {totalItems > 0 && (
                  <span
                    key={totalItems}
                    className="wn-pop absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold leading-none tabular-nums"
                    style={{ backgroundColor: navBg, color: brand, boxShadow: `0 0 0 2px ${brand}` }}
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              aria-label="Open menu"
              onClick={onMenuClick}
              className="wn-ghost wn-focus grid h-10 w-10 place-items-center rounded-xl sm:h-11 sm:w-11"
            >
              <Menu size={21} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
