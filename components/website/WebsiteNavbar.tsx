// components/website/WebsiteNavbar.tsx
'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Phone, ShoppingCart, MessageCircle } from 'lucide-react'
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

/* ------------------------------------------------------------------ */
/*  Animations + hover states                                          */
/*  Colors come from CSS variables so the store's theme still rules:   */
/*    --wn-fg   = settings.foreground_color                            */
/*    --wn-bg   = settings.navbar_color                                */
/*    --wn-icon = icon color on top of the light circles               */
/* ------------------------------------------------------------------ */
const NAVBAR_CSS = `
@keyframes wn-drop {
  from { opacity: 0; transform: translateY(-28px) scale(.97); }
  to   { opacity: 1; transform: none; }
}
@keyframes wn-in {
  from { opacity: 0; transform: translateY(-10px) scale(.85); }
  to   { opacity: 1; transform: none; }
}
@keyframes wn-spin { to { transform: rotate(360deg); } }
@keyframes wn-ping {
  0%   { transform: scale(1); opacity: .75; }
  80%, 100% { transform: scale(2.6); opacity: 0; }
}
@keyframes wn-pop {
  0%   { transform: scale(0); }
  60%  { transform: scale(1.4); }
  100% { transform: scale(1); }
}
@keyframes wn-bump {
  0%, 100% { transform: scale(1) rotate(0); }
  30% { transform: scale(1.2) rotate(-10deg); }
  60% { transform: scale(.94) rotate(6deg); }
}
@keyframes wn-wiggle {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-18deg); }
  40% { transform: rotate(16deg); }
  60% { transform: rotate(-10deg); }
  80% { transform: rotate(8deg); }
}
@keyframes wn-hop {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* One orchestrated entrance: bar drops in, then items pop in one by one */
.wn-bar { animation: wn-drop .8s cubic-bezier(.2,.9,.25,1) backwards; }
.wn-in  { animation: wn-in .55s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: var(--d, 0ms); }

/* Round icon buttons (light circle, dark icon) */
.wn-btn {
  background: var(--wn-fg);
  color: var(--wn-icon);
  transition: transform .3s cubic-bezier(.3,1.7,.5,1), box-shadow .3s ease;
}
.wn-btn:hover {
  box-shadow:
    0 10px 22px -8px color-mix(in srgb, var(--wn-fg) 70%, transparent),
    0 0 0 4px color-mix(in srgb, var(--wn-fg) 22%, transparent);
}
.wn-lift:hover  { transform: translateY(-2px) scale(1.08); }
.wn-lift:active { transform: scale(.92); }
.wn-bump { animation: wn-bump .6s ease; }
.wn-pop  { animation: wn-pop .4s cubic-bezier(.3,1.7,.5,1); }

/* Glass pills (location, phone): fill on hover */
.wn-pill {
  background: color-mix(in srgb, var(--wn-fg) 13%, transparent);
  color: var(--wn-fg);
  border: 1px solid color-mix(in srgb, var(--wn-fg) 24%, transparent);
  transition: background-color .3s ease, color .3s ease, transform .3s cubic-bezier(.3,1.7,.5,1), box-shadow .3s ease;
}
.wn-pill:hover {
  background: var(--wn-fg);
  color: var(--wn-icon);
  transform: translateY(-1px);
  box-shadow: 0 10px 22px -10px color-mix(in srgb, var(--wn-fg) 70%, transparent);
}
.wn-pill:active { transform: scale(.96); }
.wn-pill:hover .wn-pin  { animation: wn-hop .5s ease infinite; }
.wn-pill:hover .wn-ring { animation: wn-wiggle .7s ease; }
.wn-ping { animation: wn-ping 1.8s cubic-bezier(0,0,.2,1) infinite; }

/* Logo: slowly rotating ring is the one always-on motion */
.wn-logo-ring { animation: wn-spin 7s linear infinite; }

/* Hamburger that morphs on hover */
.wn-burger span {
  display: block; height: 2px; border-radius: 2px; background: currentColor;
  transition: width .3s cubic-bezier(.3,1.4,.5,1), transform .3s ease;
}
.wn-burger span:nth-child(1) { width: 18px; }
.wn-burger span:nth-child(2) { width: 11px; }
.wn-burger span:nth-child(3) { width: 15px; }
.wn-menu:hover .wn-burger span { width: 18px; }
.wn-menu:active .wn-burger span:nth-child(2) { transform: scaleX(.5); }

.wn-focus:focus-visible { outline: 2px solid var(--wn-fg); outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .wn-bar, .wn-in, .wn-bump, .wn-pop, .wn-logo-ring, .wn-ping,
  .wn-pill:hover .wn-pin, .wn-pill:hover .wn-ring { animation: none !important; }
  .wn-btn, .wn-pill, .wn-burger span { transition-duration: .01ms !important; }
}
`

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

interface WebsiteNavbarProps {
  onLoginClick: () => void
  onCorporateClick: () => void
  onMenuClick: () => void
}

export function WebsiteNavbar({ onLoginClick, onMenuClick }: WebsiteNavbarProps) {
  const pathname = usePathname()
  const { totalItems, openCart, location, openLocationModal } = useCart()
  const { settings } = useStoreSettings()

  /* ---------- theme (all from store settings, same as before) ---------- */
  const navBg = settings.navbar_color || '#000000'
  const navFg = settings.foreground_color || '#ffffff'
  const headerBg = settings.merchant_header_background || ''
  // Icons sit on light circles, so they always take the navbar colour.
  const iconTextColor = navBg

  const logoSrc = resolveMediaUrl(settings.merchant_logo)
  const logoLeftAlign = Boolean(settings.logo_left_align)
  const logoFit = Boolean(settings.logo_fit_to_navbar)
  const logoLink =
    settings.logo_link && settings.logo_link.trim() !== '' ? settings.logo_link : '/'
  const logoIsExternal = /^https?:\/\//i.test(logoLink)

  const showPhone = settings.show_navbar !== false && !settings.hide_phone_from_header
  const showCartIcon = settings.show_cart_icon !== false
  const phoneIconType = settings.phone_icon_type || 'none'
  const isWhatsapp = phoneIconType === 'whatsapp'
  const phoneHref = isWhatsapp ? 'https://wa.me/923366655786' : 'tel:021111022022'

  const isHome = pathname === '/' || pathname === '/website/home'
  const locationLabel = location || 'NED University'

  /* ---------- cart bump when an item is added ---------- */
  const [bump, setBump] = useState(false)
  const prevItems = useRef(totalItems)
  useEffect(() => {
    const increased = totalItems > prevItems.current
    prevItems.current = totalItems
    if (!increased) return
    setBump(true)
    const t = setTimeout(() => setBump(false), 650)
    return () => clearTimeout(t)
  }, [totalItems])

  /* ---------- logo ---------- */
  // Big logo hangs half-way out of the bar onto the page (unless "fit to navbar" is on)
  const logoBox = logoFit
    ? 'h-8 w-8 sm:h-9 sm:w-9'
    : 'h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24'
  const logoImgSize = logoFit ? 48 : 128
  // In-flow spacer so the pills never run underneath the logo (size = logo + ring)
  const logoSpacer = logoFit ? 'w-11 sm:w-12' : 'w-[70px] sm:w-[86px]'
  // Vertical: centre of the logo sits on the bar's bottom edge (or mid-bar when fitted)
  const logoY = logoFit ? 'top-1/2' : 'top-full'
  const ringGradient = `conic-gradient(from 0deg, ${navFg}, transparent 30%, ${navFg} 55%, transparent 80%, ${navFg})`

  const LogoElement = (
    <div
      className="wn-in"
      style={delay(80)}
    >
      <div className="relative rounded-full p-[3px] lg:p-1">
        {/* soft glow + crisp ring, both rotating */}
        <span
          aria-hidden
          className="wn-logo-ring absolute inset-0 rounded-full opacity-60 blur-[6px]"
          style={{ background: ringGradient }}
        />
        <span
          aria-hidden
          className="wn-logo-ring absolute inset-0 rounded-full"
          style={{ background: ringGradient }}
        />
        <span
          className={`relative grid ${logoBox} place-items-center overflow-hidden rounded-full shadow-[0_14px_30px_-10px_rgba(0,0,0,.6)]`}
          style={{ backgroundColor: navFg }}
        >
          <Image
            src={logoSrc}
            alt="Logo"
            width={logoImgSize}
            height={logoImgSize}
            className="h-full w-full object-contain p-0.5"
            loading="eager"
            priority
          />
        </span>
      </div>
    </div>
  )

  const LogoLinked = logoIsExternal ? (
    <a
      href={logoLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit website"
      className="wn-focus shrink-0 rounded-full"
    >
      {LogoElement}
    </a>
  ) : isHome ? (
    <div className="shrink-0">{LogoElement}</div>
  ) : (
    <Link href={logoLink} aria-label="Home" className="wn-focus shrink-0 rounded-full">
      {LogoElement}
    </Link>
  )

  /* ---------- bar surface ---------- */
  const shade = 'linear-gradient(115deg, rgba(255,255,255,.12), transparent 45%, rgba(0,0,0,.18))'
  const barSurface: CSSProperties = {
    backgroundColor: navBg,
    backgroundImage: headerBg ? `${shade}, url("${headerBg}")` : shade,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backdropFilter: 'blur(14px) saturate(160%)',
    WebkitBackdropFilter: 'blur(14px) saturate(160%)',
    border: `1px solid color-mix(in srgb, ${navFg} 20%, transparent)`,
    boxShadow: '0 10px 30px -14px rgba(0,0,0,.4)',
  }

  const themeVars = {
    '--wn-fg': navFg,
    '--wn-bg': navBg,
    '--wn-icon': iconTextColor,
  } as CSSProperties

  return (
    <header
      className="relative z-30 px-2 pt-2 sm:px-4 sm:pt-3"
      style={{ ...themeVars, color: navFg }}
    >
      <style dangerouslySetInnerHTML={{ __html: NAVBAR_CSS }} />

      <div className="wn-bar relative mx-auto max-w-[1400px] rounded-full">
        {/* Surface layer: background lives here so dropdowns aren't affected */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          style={barSurface}
        />

        {/* Floating logo: centre sits on the bar's bottom edge, so half hangs onto the page */}
        <div
          className={`pointer-events-none absolute z-20 -translate-y-1/2 ${logoY} ${
            logoLeftAlign ? 'left-2 sm:left-3' : 'inset-x-0 flex justify-center'
          }`}
        >
          <div className="pointer-events-auto">{LogoLinked}</div>
        </div>

        {/* Content */}
        <div
          className="relative z-10 flex items-center gap-2 px-2 py-2 sm:gap-3 sm:px-3"
        >
          {/* Left cluster */}
          <div className="flex min-w-0 flex-1 basis-0 items-center gap-2">
            {logoLeftAlign && <div aria-hidden className={`${logoSpacer} shrink-0`} />}

            <button
              type="button"
              onClick={() => openLocationModal()}
              aria-label="Change location"
              className="wn-pill wn-in wn-focus flex min-w-0 items-center gap-2 rounded-full py-1.5 pl-2.5 pr-3 text-left"
              style={delay(160)}
            >
              <span className="relative shrink-0">
                <MapPin size={16} className="wn-pin" />
                <span className="absolute -right-1 -top-1 flex h-2 w-2">
                  <span className="wn-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              </span>

              {/* sm and up: two lines */}
              <span className="hidden min-w-0 leading-tight sm:block">
                <span className="block text-[10px] font-medium opacity-70">Change location</span>
                <span className="block max-w-[150px] truncate text-xs font-semibold">
                  {locationLabel}
                </span>
              </span>

              {/* mobile: one line */}
              <span className="max-w-[84px] truncate text-[11px] font-semibold sm:hidden">
                {locationLabel}
              </span>
            </button>

            {showPhone && (
              <a
                href={phoneHref}
                target={isWhatsapp ? '_blank' : undefined}
                rel={isWhatsapp ? 'noopener noreferrer' : undefined}
                aria-label={isWhatsapp ? 'Chat on WhatsApp' : 'Call us'}
                className="wn-pill wn-in wn-focus hidden shrink-0 items-center gap-2 rounded-full p-2 sm:flex lg:px-3.5 lg:py-1.5"
                style={delay(240)}
              >
                <span className="wn-ring inline-flex">
                  {isWhatsapp ? <MessageCircle size={16} /> : <Phone size={16} />}
                </span>
                <span className="hidden text-xs font-semibold tracking-wide lg:inline">
                  021-111-022-022
                </span>
              </a>
            )}
          </div>

          {/* Center logo */}
          {!logoLeftAlign && <div aria-hidden className={`${logoSpacer} shrink-0 lg:hidden`} />}

          {/* Right cluster */}
          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
            {settings.enable_user_login !== false && (
              <div
                className="wn-btn wn-in relative flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-2 py-1 sm:min-h-10 sm:min-w-10"
                style={delay(280)}
              >
                <UserDropdown onLoginClick={onLoginClick} />
              </div>
            )}

            {/* Recent orders: only renders when cookie has order IDs */}
            <RecentOrdersDropdown navFg={navFg} iconTextColor={iconTextColor} />

            {showCartIcon && (
              <button
                type="button"
                onClick={openCart}
                aria-label="Open cart"
                className={`wn-btn wn-lift wn-in wn-focus relative grid h-9 w-9 place-items-center rounded-full sm:h-10 sm:w-10 ${
                  bump ? 'wn-bump' : ''
                }`}
                style={delay(340)}
              >
                <ShoppingCart size={19} />

                {totalItems > 0 && (
                  <span
                    key={totalItems}
                    className="wn-pop absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none shadow-md"
                    style={{
                      backgroundColor: navBg,
                      color: navFg,
                      boxShadow: `0 0 0 2px ${navFg}`,
                    }}
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
              className="wn-btn wn-lift wn-menu wn-in wn-focus grid h-9 w-9 place-items-center rounded-full sm:h-10 sm:w-10"
              style={delay(400)}
            >
              <span className="wn-burger flex flex-col items-end gap-[4px]">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}