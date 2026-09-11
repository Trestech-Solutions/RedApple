// components/website/WebsiteNavbar.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MapPin, Phone, Menu, ShoppingCart, MessageCircle,
} from 'lucide-react'
import { useCart, useStoreSettings } from '@/lib/hooks/useCart'
import { UserDropdown } from '@/components/website/UserDropdown'

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

interface WebsiteNavbarProps {
  onLoginClick: () => void
  onCorporateClick: () => void
  onMenuClick: () => void
}

export function WebsiteNavbar({
  onLoginClick,
  onCorporateClick,
  onMenuClick,
}: WebsiteNavbarProps) {
  const pathname = usePathname()
  const { totalItems, openCart, location, openLocationModal } = useCart()
  const { settings } = useStoreSettings()

  const navBg = settings.navbar_color || '#000000'
  const navFg = settings.foreground_color || '#ffffff'
  const headerBg = settings.merchant_header_background || ''
  const iconTextColor = headerBg || navBg

  const logoSrc = resolveMediaUrl(settings.merchant_logo)
  const logoLeftAlign = Boolean(settings.logo_left_align)
  const logoFit = Boolean(settings.logo_fit_to_navbar)
  const logoLink = settings.logo_link && settings.logo_link.trim() !== ''
    ? settings.logo_link
    : '/'
  const logoIsExternal = /^https?:\/\//i.test(logoLink)

  const showPhone = settings.show_navbar !== false && !settings.hide_phone_from_header
  const showCartIcon = settings.show_cart_icon !== false
  const phoneIconType = settings.phone_icon_type || 'none'

  const handleLocationClick = () => {
    openLocationModal()
  }

  const isHome = pathname === '/' || pathname === '/website/home'
  const isAbout = pathname === '/website/about'
  const isOverlap = !isAbout

  const { logoSize, logoImgSize, logoBottom } = (() => {
    if (logoFit) {
      return {
        logoSize: 'h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12',
        logoImgSize: 48,
        logoBottom: '',
      }
    }
    return isOverlap
      ? {
          logoSize: 'h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24',
          logoImgSize: 96,
          logoBottom: '-bottom-6 sm:-bottom-8 lg:-bottom-10 xl:-bottom-12',
        }
      : {
          logoSize: 'h-14 w-14 sm:h-16 sm:w-16',
          logoImgSize: 64,
          logoBottom: '',
        }
  })()

  const logoWrapperBase = `z-40 flex ${logoSize} items-center justify-center rounded-full shadow-xl overflow-hidden ${logoBottom}`
  const LogoElement = (
    logoLeftAlign
      ? (
          <div className={`${logoWrapperBase} relative shrink-0`}>
            <Image
              src={logoSrc}
              alt="Logo"
              width={logoImgSize}
              height={logoImgSize}
              className="object-contain"
              loading="eager"
              priority
            />
          </div>
        )
      : (
          <div className={`absolute left-1/2 -translate-x-1/2 ${logoWrapperBase}`}>
            <Image
              src={logoSrc}
              alt="Logo"
              width={logoImgSize}
              height={logoImgSize}
              className="object-contain"
              loading="eager"
              priority
            />
          </div>
        )
  )

  const LogoLinked = logoIsExternal
    ? (
        <a href={logoLink} target="_blank" rel="noopener noreferrer">
          {LogoElement}
        </a>
      )
    : (
        isHome ? LogoElement : <Link href={logoLink}>{LogoElement}</Link>
      )

  const PhoneIconEl =
    phoneIconType === 'whatsapp'
      ? <MessageCircle size={16} style={{ color: iconTextColor }} />
      : <Phone size={16} style={{ color: iconTextColor }} />
  const phoneHref =
    phoneIconType === 'whatsapp'
      ? 'https://wa.me/923366655786'
      : 'tel:021111022022'

  return (
    <header
      className="relative text-white"
      style={{
        backgroundColor: navBg,
        color: navFg,
        ...(headerBg ? { backgroundImage: `url("${headerBg}")`, backgroundSize: 'cover' } : {}),
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 md:gap-4 md:px-8 md:py-2.5">

        <div className={`flex items-center gap-2 sm:gap-3 ${logoLeftAlign ? '' : ''}`}>
          {logoLeftAlign && LogoLinked}

          <button
            onClick={handleLocationClick}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
            style={{ backgroundColor: navFg, color: iconTextColor }}
          >
            <MapPin size={14} className="sm:hidden" />
            <MapPin size={16} className="hidden sm:block" />

            <span className="hidden text-left leading-tight sm:block">
              Change Location<br />
              <span className="font-normal">
                {location || 'NED University'}
              </span>
            </span>

            <span className="max-w-[110px] truncate text-left leading-tight sm:hidden">
              {location || 'NED University'}
            </span>
          </button>

          {showPhone && (
            <a
              href={phoneHref}
              target={phoneIconType === 'whatsapp' ? '_blank' : undefined}
              rel={phoneIconType === 'whatsapp' ? 'noopener noreferrer' : undefined}
              className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium sm:flex"
              style={{ backgroundColor: navFg, color: iconTextColor }}
            >
              {phoneIconType !== 'none' && PhoneIconEl}
              {phoneIconType === 'none' && <Phone size={16} style={{ color: iconTextColor }} />}
              <span style={{ color: iconTextColor }}>
                021-111-022-022
              </span>
            </a>
          )}
        </div>

        {!logoLeftAlign && LogoLinked}

        <div className="flex-1" />

        <div className="flex items-center gap-1 sm:gap-2">
          {settings.enable_user_login !== false && (
            <div
              className="relative rounded-full p-1.5 transition-colors hover:opacity-90 sm:p-2"
              style={{ backgroundColor: navFg, color: iconTextColor }}
            >
              <UserDropdown onLoginClick={onLoginClick} />
            </div>
          )}

          {showCartIcon && (
            <button
              onClick={openCart}
              aria-label="Open cart"
              className="relative rounded-full p-1.5 transition-colors hover:opacity-90 sm:p-2"
              style={{ backgroundColor: navFg, color: iconTextColor }}
            >
              <ShoppingCart size={20} className="sm:hidden" />
              <ShoppingCart size={22} className="hidden sm:block" />

              {totalItems > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold sm:h-5 sm:w-5 sm:text-[10px]"
                  style={{ backgroundColor: navBg, color: navFg }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          )}

          <button
            aria-label="Open menu"
            onClick={onMenuClick}
            className="rounded-full p-1 hover:opacity-90 sm:p-0 sm:p-2"
            style={{ backgroundColor: navFg, color: iconTextColor }}
          >
            <Menu size={20} className="sm:hidden" />
            <Menu size={22} className="hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  )
}