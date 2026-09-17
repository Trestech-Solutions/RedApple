'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useStoreSettings } from '@/lib/hooks/useCart'
import { useGetMenu } from '@/api/client/browse'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'

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

// ─── Social icon SVGs ──────────────────────────────────────────────────────

function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
    </svg>
  )
}
function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
function TwitterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function YoutubeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}
function TiktokIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  )
}
function LinkedinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
function SnapchatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.004 2C8.707 2 6.5 4.388 6.5 7.5v.8c-.3.1-.6.1-.9.2-.4.1-.6.4-.5.8.1.3.3.5.6.5h.1c-.2.3-.4.6-.7.9-.6.7-1.5 1.8-1.5 3.1 0 .2.1.4.3.5.5.2 1 .3 1.4.4.2.7.8 1.2 1.5 1.2.3 0 .6-.1.8-.2.5.6 1.3 1.3 2.4 1.7.2.5.4 1 .5 1.5H10c-.4 0-.8.3-.8.8s.3.8.8.8h4c.4 0 .8-.3.8-.8s-.3-.8-.8-.8h-.5c.1-.5.3-1 .5-1.5 1.1-.4 1.9-1.1 2.4-1.7.3.1.5.2.8.2.7 0 1.3-.5 1.5-1.2.5-.1.9-.2 1.4-.4.2-.1.3-.3.3-.5 0-1.3-.9-2.4-1.5-3.1-.3-.3-.5-.6-.7-.9h.1c.3 0 .5-.2.6-.5.1-.4-.1-.7-.5-.8-.3-.1-.6-.1-.9-.2V7.5C17.5 4.388 15.3 2 12.004 2z" />
    </svg>
  )
}
function PinterestIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  )
}
function WhatsappIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  if (!href?.trim()) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-600 transition-colors hover:border-[#E08A3C]/50 hover:bg-[#E08A3C]/10 hover:text-[#C1531B]"
    >
      {icon}
    </a>
  )
}

const FOOTER_LINKS = [
  { href: '/website/privacy', label: 'Privacy Policy' },
  { href: '/website/faqs', label: 'Faqs' },
  { href: '/website/blogs', label: 'Blogs' },
]

export function WebsiteFooter() {
  const [expanded, setExpanded] = useState(false)
  const { settings } = useStoreSettings()
  const { branchId, areaId } = useStoreLocation()
  const { data: menuData } = useGetMenu({ branchId, areaId })

  const social = menuData?.social_media_links

  const androidIcon = resolveMediaUrl(settings.android_icon)
  const iosIcon = resolveMediaUrl(settings.ios_icon)
  const androidLink = settings.android_app_link?.trim() || ''
  const iosLink = settings.ios_app_link?.trim() || ''
  const showApps = (androidLink || iosLink) && Boolean(settings.android_icon || settings.ios_icon)
  const merchantLogo = resolveMediaUrl(settings.merchant_logo)

  const hasSocial =
    social &&
    Object.values(social).some((v) => typeof v === 'string' && v.trim() !== '')

  return (
    <footer className="bg-[var(--color-tertiary)]">
      {/* SEO content */}
      <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-5 sm:pt-14 md:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl md:text-[28px]">
          Discover Authentic BBQ, Karahi &amp; Matka Biryani in Karachi – Angeethi PK
        </h2>
        <h3 className="mt-2 text-base font-medium text-neutral-500 sm:text-lg">
          Flavor-Packed Kabab &amp; Tikka Rice in Karachi
        </h3>

        <div
          className={`relative mt-4 overflow-hidden text-sm leading-relaxed text-neutral-600 transition-all duration-300 sm:text-[15px] ${
            expanded ? 'max-h-[2000px]' : 'max-h-[3.2rem]'
          }`}
        >
          <p className="max-w-3xl">
            If you crave flavorful and traditional BBQ, Angeethi PK proudly stands as one of
            the top spots in the city. Famous for serving Kabab Rice in Karachi, the menu
            offers perfectly grilled kababs paired with aromatic rice. Food lovers admire the
            Spicy Kabab Rice Karachi option, seasoned to elevate every bite. Alongside this,
            juicy Tikka Rice in Karachi brings tender chicken tikka on a bed of fluffy rice,
            ideal for a hearty meal any time of day.
          </p>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#C1531B] hover:text-[#a3430f]"
        >
          {expanded ? 'Show Less' : 'Show More'}
          <ChevronDown
            size={15}
            className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* ember divider */}
      <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-[#C1531B]/25 to-transparent sm:mt-14" />

      {/* Main footer band */}
      <div className="bg-[var(--color-tertiary)]">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-5 sm:py-14 md:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.8fr_1fr]">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200">
                  <Image
                    src={merchantLogo}
                    alt="Angeethi"
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-xl font-semibold tracking-tight text-neutral-900">Angeethi</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500">
                Roshan Tower, Shop no 6 &amp; 7, Tipu Sultan Rd, Karachi, 75350
              </p>

              {showApps && (
                <div className="mt-5 flex items-center gap-3">
                  {androidLink && (
                    <a
                      href={androidLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Get it on Google Play"
                    >
                      <Image
                        src={androidIcon}
                        alt="Google Play"
                       width={106}
                        height={106}
                        className="object-contain"
                      />
                    </a>
                  )}
                  {iosLink && (
                    <a
                      href={iosLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Download on the App Store"
                    >
                      <Image
                        src={iosIcon}
                        alt="App Store"
                        width={106}
                        height={106}
                        className="object-contain"
                      />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">Contact</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-600">
                <li>
                  <a href="tel:03092772497" className="hover:text-[#C1531B]">03092772497</a>
                </li>
                <li>
                  <a href="mailto:angeethiofficial@gmail.com" className="hover:text-[#C1531B]">
                    angeethiofficial@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">Explore</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-neutral-600">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-[#C1531B]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            {hasSocial && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-900">Follow Us</h4>
                <div className="mt-4 flex flex-wrap gap-2">
                  <SocialLink href={social?.facebook_link ?? ''} label="Facebook" icon={<FacebookIcon />} />
                  <SocialLink href={social?.instagram_link ?? ''} label="Instagram" icon={<InstagramIcon />} />
                  <SocialLink href={social?.twitter_link ?? ''} label="Twitter" icon={<TwitterIcon />} />
                  <SocialLink href={social?.youtube_link ?? ''} label="YouTube" icon={<YoutubeIcon />} />
                  <SocialLink href={social?.tiktok_link ?? ''} label="TikTok" icon={<TiktokIcon />} />
                  <SocialLink href={social?.linkedin_link ?? ''} label="LinkedIn" icon={<LinkedinIcon />} />
                  <SocialLink href={social?.snapchat_link ?? ''} label="Snapchat" icon={<SnapchatIcon />} />
                  <SocialLink href={social?.pinterest_link ?? ''} label="Pinterest" icon={<PinterestIcon />} />
                  <SocialLink href={social?.whatsapp_link ?? ''} label="WhatsApp" icon={<WhatsappIcon />} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-center gap-1 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:gap-2">
            <span>© {new Date().getFullYear()} Angeethi. All Rights Reserved.</span>
            <span className="hidden sm:inline">·</span>
            <span>
              Powered by{' '}
              <Link
                href="https://trestechsolutions.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-700 hover:text-[#C1531B]"
              >
                Trestech
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}