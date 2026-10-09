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
@keyframes wn-sheen {
  0%, 70% { transform: translateX(-120%) skewX(-18deg); }
  100%    { transform: translateX(320%) skewX(-18deg); }
}

/* One orchestrated entrance: bar drops in, then items pop in one by one */
.wn-bar { animation: wn-drop .8s cubic-bezier(.2,.9,.25,1) backwards; }
.wn-in  { animation: wn-in .55s cubic-bezier(.2,.9,.25,1) backwards; animation-delay: var(--d, 0ms); }

/* Premium bar: soft sheen sweep every few seconds */
.wn-sheen {
  position: absolute; top: 0; bottom: 0; left: 0; width: 22%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent);
  animation: wn-sheen 9s ease-in-out infinite;
}

/* Round icon buttons (light circle, dark icon) */
.wn-btn {
  background: linear-gradient(145deg, color-mix(in srgb, var(--wn-fg) 100%, white), var(--wn-fg) 55%, color-mix(in srgb, var(--wn-fg) 88%, black));
  color: var(--wn-icon);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -1px 0 rgba(0,0,0,.08),
    0 6px 14px -6px rgba(0,0,0,.45);
  transition: transform .3s cubic-bezier(.3,1.7,.5,1), box-shadow .3s ease;
}
.wn-btn:hover {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.6),
    0 14px 28px -10px color-mix(in srgb, var(--wn-fg) 75%, transparent),
    0 0 0 5px color-mix(in srgb, var(--wn-fg) 22%, transparent);
}
.wn-lift:hover  { transform: translateY(-2px) scale(1.08); }
.wn-lift:active { transform: scale(.92); }
.wn-bump { animation: wn-bump .6s ease; }
.wn-pop  { animation: wn-pop .4s cubic-bezier(.3,1.7,.5,1); }

/* Pills (location, phone): same contrast as the cart button */
.wn-pill {
  background: linear-gradient(145deg, color-mix(in srgb, var(--wn-fg) 100%, white), var(--wn-fg) 55%, color-mix(in srgb, var(--wn-fg) 88%, black));
  color: var(--wn-icon);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -1px 0 rgba(0,0,0,.08),
    0 6px 14px -6px rgba(0,0,0,.45);
  transition: transform .3s cubic-bezier(.3,1.7,.5,1), box-shadow .3s ease;
}
.wn-pill:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.6),
    0 14px 28px -10px color-mix(in srgb, var(--wn-fg) 75%, transparent),
    0 0 0 5px color-mix(in srgb, var(--wn-fg) 22%, transparent);
}
.wn-pill:active { transform: scale(.96); }
.wn-pill:hover .wn-pin  { animation: wn-hop .5s ease infinite; }
.wn-pill:hover .wn-ring { animation: wn-wiggle .7s ease; }
.wn-ping { animation: wn-ping 1.8s cubic-bezier(0,0,.2,1) infinite; }

/* Logo: slowly rotating ring is the one always-on motion */
.wn-logo-ring { animation: wn-spin 7s linear infinite; }

/* Hamburger that morphs on hover */
.wn-burger span {
  display: block; height: 3px; border-radius: 3px; background: currentColor;
  transition: width .3s cubic-bezier(.3,1.4,.5,1), transform .3s ease;
}
.wn-burger span:nth-child(1) { width: 18px; }
.wn-burger span:nth-child(2) { width: 18px; }
.wn-burger span:nth-child(3) { width: 12px; }
.wn-menu:hover .wn-burger span { width: 18px; }
.wn-menu:active .wn-burger span:nth-child(2) { transform: scaleX(.5); }

.wn-focus:focus-visible { outline: 2px solid var(--wn-fg); outline-offset: 3px; }

@media (min-width: 400px) {
  .wn-burger span:nth-child(1) { width: 20px; }
  .wn-burger span:nth-child(2) { width: 20px; }
  .wn-burger span:nth-child(3) { width: 14px; }
  .wn-menu:hover .wn-burger span { width: 20px; }
}
@media (min-width: 640px) {
  .wn-burger span:nth-child(1) { width: 22px; }
  .wn-burger span:nth-child(2) { width: 22px; }
  .wn-burger span:nth-child(3) { width: 15px; }
  .wn-menu:hover .wn-burger span { width: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .wn-bar, .wn-in, .wn-bump, .wn-pop, .wn-logo-ring, .wn-ping, .wn-sheen,
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
  const navBg              = settings.navbar_color                || '#000000'
  const pillBg             = settings.foreground_color            || '#ffffff'
  const navbarTextColor    = settings.merchant_header_background  || settings.foreground_color  || '#FBD00E'
  const headerBg           = settings.merchant_header_background  || ''
  // Icons sit on light circles (pillBg), so they take the brand text colour (merchant_header_background).
  const iconTextColor      = navbarTextColor

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

  /* ---------- logo (responsive across all breakpoints) ---------- */
  const logoBox = logoFit
    ? 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-9 sm:h-10 sm:w-10'
    : 'h-15 w-15 min-[400px]:h-14 min-[400px]:w-14 sm:h-[72px] sm:w-[72px] md:h-[88px] md:w-[88px] lg:h-[104px] lg:w-[104px]'
  const logoImgSize = logoFit ? 56 : 144
  const logoSpacer = logoFit
    ? 'w-10 sm:w-12'
    : 'w-14 min-[400px]:w-16 sm:w-24 md:w-28 lg:w-[120px]'
  const logoY = logoFit ? 'top-1/2' : 'top-full'
  const ringGradient = `conic-gradient(from 0deg, ${pillBg}, transparent 30%, ${pillBg} 55%, transparent 80%, ${pillBg})`

  const LogoElement = (
    <div className="wn-in" style={delay(80)}>
      <div className="relative rounded-full p-[2px] sm:p-[3px] lg:p-1">
        {/* soft glow + crisp ring, both rotating */}
        <span
          aria-hidden
          className="wn-logo-ring absolute inset-0 rounded-full opacity-70 blur-[8px]"
          style={{ background: ringGradient }}
        />
        <span
          aria-hidden
          className="wn-logo-ring absolute inset-0 rounded-full"
          style={{ background: ringGradient }}
        />
        <span
          className={`relative grid ${logoBox} place-items-center overflow-hidden rounded-full shadow-[0_12px_28px_-10px_rgba(0,0,0,.65)] ring-2 ring-white/40 sm:shadow-[0_16px_34px_-10px_rgba(0,0,0,.65)]`}
          style={{ backgroundColor: pillBg }}
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

  /* ---------- bar surface (no shade gradient) ---------- */
  const barSurface: CSSProperties = {
    backgroundColor: navBg,
    backgroundImage: headerBg ? `url("${headerBg}")` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backdropFilter: 'blur(18px) saturate(180%)',
    WebkitBackdropFilter: 'blur(18px) saturate(180%)',
    border: `1px solid color-mix(in srgb, ${pillBg} 28%, transparent)`,
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,.28)',
      'inset 0 -1px 0 rgba(0,0,0,.25)',
      '0 18px 40px -16px rgba(0,0,0,.55)',
      '0 2px 6px rgba(0,0,0,.15)',
    ].join(', '),
  }

  const themeVars = {
    '--wn-fg':   pillBg,
    '--wn-bg':   navBg,
    '--wn-icon': iconTextColor,
  } as CSSProperties

  return (
    <header
      className="relative z-30 w-full px-1.5 pt-1.5 min-[400px]:px-2 min-[400px]:pt-2 sm:px-3 sm:pt-2.5 md:px-4 md:pt-3"
      style={{ ...themeVars, color: navbarTextColor }}
    >
      <style dangerouslySetInnerHTML={{ __html: NAVBAR_CSS }} />

      <div className="wn-bar relative mx-auto max-w-[1400px] rounded-full">
        {/* Surface layer: background lives here so dropdowns aren't affected */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
          style={barSurface}
        >
          <span className="wn-sheen" />
        </div>

        {/* Floating logo: centre sits on the bar's bottom edge, so half hangs onto the page */}
        <div
          className={`pointer-events-none absolute z-20 -translate-y-1/2 ${logoY} ${
            logoLeftAlign ? 'left-2 min-[400px]:left-2.5 sm:left-4' : 'inset-x-0 flex justify-center'
          }`}
        >
          <div className="pointer-events-auto">{LogoLinked}</div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center gap-2 px-2 py-2 min-[400px]:gap-2.5 min-[400px]:px-2.5 min-[400px]:py-2.5 sm:gap-3 sm:px-3 sm:py-3 md:gap-3.5 md:px-3.5">
          {/* Left cluster */}
          <div className="flex min-w-0 flex-1 basis-0 items-center gap-2 min-[400px]:gap-2.5">
            {logoLeftAlign && <div aria-hidden className={`${logoSpacer} shrink-0`} />}

            {/* ── Location pill ── */}
            <button
              type="button"
              onClick={() => openLocationModal()}
              aria-label="Change location"
              className="wn-pill wn-in wn-focus flex min-w-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-left ring-1 ring-inset ring-black/5 min-[400px]:py-2 sm:gap-2.5 sm:pr-4"
              style={delay(160)}
            >
              <span
                className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full min-[400px]:h-9 min-[400px]:w-9 sm:h-10 sm:w-10"
                style={{ backgroundColor: 'color-mix(in srgb, var(--wn-icon) 14%, transparent)' }}
              >
                <MapPin size={16} strokeWidth={2.4} className="wn-pin min-[400px]:hidden" />
                <MapPin size={19} strokeWidth={2.3} className="wn-pin hidden min-[400px]:block sm:hidden" />
                <MapPin size={21} strokeWidth={2.2} className="wn-pin hidden sm:block" />
                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                  <span className="wn-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-black/10" />
                </span>
              </span>

              {/* sm and up: two lines */}
              <span className="hidden min-w-0 leading-tight sm:block">
                <span className="block text-[11px] font-medium uppercase tracking-[0.12em] opacity-60">
                  Deliver to
                </span>
                <span className="block max-w-[120px] truncate text-sm font-bold md:max-w-[170px]">
                  {locationLabel}
                </span>
              </span>

              {/* mobile: one line */}
              <span className="max-w-[90px] truncate text-[11px] font-bold min-[400px]:max-w-[85px] min-[400px]:text-xs sm:hidden">
                {locationLabel}
              </span>
            </button>

            {/* ── Phone / WhatsApp pill ── */}
            {showPhone && (
              <a
                href={phoneHref}
                target={isWhatsapp ? '_blank' : undefined}
                rel={isWhatsapp ? 'noopener noreferrer' : undefined}
                aria-label={isWhatsapp ? 'Chat on WhatsApp' : 'Call us'}
                className="wn-pill wn-in wn-focus hidden shrink-0 items-center gap-2.5 rounded-full p-1.5 ring-1 ring-inset ring-black/5 sm:flex lg:py-1.5 lg:pl-1.5 lg:pr-4"
                style={delay(240)}
              >
                <span
                  className="wn-ring grid h-10 w-10 shrink-0 place-items-center rounded-full"
                  style={{
                    backgroundColor: isWhatsapp
                      ? 'color-mix(in srgb, #25D366 24%, transparent)'
                      : 'color-mix(in srgb, var(--wn-icon) 14%, transparent)',
                    color: isWhatsapp ? '#128C7E' : 'inherit',
                  }}
                >
                  {isWhatsapp ? <MessageCircle size={20} strokeWidth={2.2} /> : <Phone size={20} strokeWidth={2.2} />}
                </span>
                <span className="hidden text-sm font-bold tracking-wide lg:inline">
                  021-111-022-022
                </span>
              </a>
            )}
          </div>

          {/* Center logo spacer (only when logo centered, on smaller screens) */}
          {!logoLeftAlign && <div aria-hidden className={`${logoSpacer} shrink-0 lg:hidden`} />}

          {/* Right cluster */}
          <div className="flex shrink-0 items-center justify-end gap-1.5 min-[400px]:gap-2 sm:gap-2.5">
            {settings.enable_user_login !== false && (
              <div
                className="wn-btn wn-in relative flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full px-2 py-1 min-[400px]:min-h-11 min-[400px]:min-w-11 sm:min-h-12 sm:min-w-12 sm:px-2.5"
                style={delay(280)}
              >
                <UserDropdown onLoginClick={onLoginClick} />
              </div>
            )}

            {/* Recent orders: only renders when cookie has order IDs */}
            <RecentOrdersDropdown navFg={navbarTextColor} iconTextColor={iconTextColor} />

            {/* ── Cart icon ── */}
            {showCartIcon && (
              <button
                type="button"
                onClick={openCart}
                aria-label="Open cart"
                data-cart-target="true"
                className={`wn-btn wn-lift wn-in wn-focus relative grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset ring-black/5 min-[400px]:h-11 min-[400px]:w-11 sm:h-12 sm:w-12 ${
                  bump ? 'wn-bump' : ''
                }`}
                style={delay(340)}
              >
                <ShoppingCart size={18} strokeWidth={2.4} className="min-[400px]:hidden" />
                <ShoppingCart size={21} strokeWidth={2.3} className="hidden min-[400px]:block sm:hidden" />
                <ShoppingCart size={23} strokeWidth={2.2} className="hidden sm:block" />

                {totalItems > 0 && (
                  <span
                    key={totalItems}
                    className="wn-pop absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-extrabold leading-none shadow-md min-[400px]:h-5 min-[400px]:min-w-5 min-[400px]:text-[11px]"
                    style={{
                      backgroundColor: navBg,
                      color: navbarTextColor,
                      boxShadow: `0 0 0 2px ${navbarTextColor}`,
                    }}
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>
            )}

            {/* ── Menu icon ── */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={onMenuClick}
              className="wn-btn wn-lift wn-menu wn-in wn-focus grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset ring-black/5 min-[400px]:h-11 min-[400px]:w-11 sm:h-12 sm:w-12"
              style={delay(400)}
            >
              <span className="wn-burger flex flex-col items-center gap-[4px] min-[400px]:gap-[5px]">
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