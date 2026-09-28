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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
    </svg>
  )
}
function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function YoutubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}
function TiktokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  )
}
function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}
function SnapchatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.004 2C8.707 2 6.5 4.388 6.5 7.5v.8c-.3.1-.6.1-.9.2-.4.1-.6.4-.5.8.1.3.3.5.6.5h.1c-.2.3-.4.6-.7.9-.6.7-1.5 1.8-1.5 3.1 0 .2.1.4.3.5.5.2 1 .3 1.4.4.2.7.8 1.2 1.5 1.2.3 0 .6-.1.8-.2.5.6 1.3 1.3 2.4 1.7.2.5.4 1 .5 1.5H10c-.4 0-.8.3-.8.8s.3.8.8.8h4c.4 0 .8-.3.8-.8s-.3-.8-.8-.8h-.5c.1-.5.3-1 .5-1.5 1.1-.4 1.9-1.1 2.4-1.7.3.1.5.2.8.2.7 0 1.3-.5 1.5-1.2.5-.1.9-.2 1.4-.4.2-.1.3-.3.3-.5 0-1.3-.9-2.4-1.5-3.1-.3-.3-.5-.6-.7-.9h.1c.3 0 .5-.2.6-.5.1-.4-.1-.7-.5-.8-.3-.1-.6-.1-.9-.2V7.5C17.5 4.388 15.3 2 12.004 2z" />
    </svg>
  )
}
function PinterestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  )
}
function WhatsappIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
      className="group flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/70 bg-white text-neutral-500 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:rotate-3 hover:rounded-2xl hover:border-transparent hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)] hover:shadow-lg hover:shadow-[var(--color-primary)]/25 sm:h-10 sm:w-10"
    >
      {icon}
    </a>
  )
}

function mergeSocial(
  footerLinks: Record<string, string> | undefined,
  menuLinks: { facebook_link?: string; instagram_link?: string; twitter_link?: string; youtube_link?: string; tiktok_link?: string; linkedin_link?: string; snapchat_link?: string; pinterest_link?: string; whatsapp_link?: string } | undefined
) {
  return {
    facebook:  footerLinks?.facebook  || footerLinks?.facebook_link  || menuLinks?.facebook_link  || '',
    instagram: footerLinks?.instagram || footerLinks?.instagram_link || menuLinks?.instagram_link || '',
    twitter:   footerLinks?.twitter   || footerLinks?.x              || footerLinks?.twitter_link || menuLinks?.twitter_link   || '',
    youtube:   footerLinks?.youtube   || footerLinks?.youtube_link   || menuLinks?.youtube_link   || '',
    tiktok:    footerLinks?.tiktok    || footerLinks?.tiktok_link    || menuLinks?.tiktok_link    || '',
    linkedin:  footerLinks?.linkedin  || footerLinks?.linkedin_link  || menuLinks?.linkedin_link  || '',
    snapchat:  footerLinks?.snapchat  || footerLinks?.snapchat_link  || menuLinks?.snapchat_link  || '',
    pinterest: footerLinks?.pinterest || footerLinks?.pinterest_link || menuLinks?.pinterest_link || '',
    whatsapp:  footerLinks?.whatsapp  || footerLinks?.whatsapp_link  || menuLinks?.whatsapp_link  || '',
  }
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="relative inline-block text-xs font-bold uppercase tracking-wider text-neutral-400">
      {children}
      <span className="absolute -bottom-1.5 left-0 h-[3px] w-6 rounded-full bg-[var(--color-primary)] sm:left-1/2 sm:-translate-x-1/2" />
    </h4>
  )
}

export function WebsiteFooter() {
  const [expanded, setExpanded] = useState(false)
  const { settings } = useStoreSettings()
  const { branchId, areaId } = useStoreLocation()
  const { data: menuData } = useGetMenu({ branchId, areaId })

  const footer = menuData?.footer
  const branchContact = menuData?.footer_branch_contact

  const restaurantName = footer?.title?.trim() || (menuData?.branch as any)?.name || 'Restaurant'

  const seoTitle = footer?.subtitle?.trim() || ''
  const seoDesc  = footer?.description?.trim() || ''

  const address = footer?.address?.trim() || (menuData?.branch as any)?.address?.trim() || ''

  const phone = branchContact?.phone?.trim() || (menuData?.branch as any)?.phone?.trim() || ''
  const email = branchContact?.email?.trim() || ''

  const linkGroups = Array.isArray(footer?.link_groups) ? footer!.link_groups : []
  const footerButtons = Array.isArray(footer?.buttons) ? footer!.buttons : []

  const androidIcon = resolveMediaUrl(settings.android_icon)
  const iosIcon     = resolveMediaUrl(settings.ios_icon)
  const androidLink = settings.android_app_link?.trim() || ''
  const iosLink     = settings.ios_app_link?.trim() || ''
  const showApps    = (androidLink || iosLink) && Boolean(settings.android_icon || settings.ios_icon)

  const footerLogoRaw = footer?.logo?.trim() ? footer.logo : null
  const merchantLogo  = resolveMediaUrl(footerLogoRaw || settings.merchant_logo)

  const social    = mergeSocial(footer?.social_links, menuData?.social_media_links)
  const hasSocial = Object.values(social).some((v) => v.trim() !== '')

  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-[var(--color-tertiary)]">
      {/* soft ambient glow accents */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-56 w-56 rounded-full bg-[var(--color-primary)]/10 blur-3xl sm:h-72 sm:w-72" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-[var(--color-primary)]/5 blur-3xl sm:h-72 sm:w-72" />

      {/* top curved accent strip */}
      <div className="relative h-1.5 w-full overflow-hidden sm:h-2">
        <div className="h-full w-full rounded-b-[1.25rem] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent sm:rounded-b-[2rem]" />
      </div>

      {/* SEO content block */}
      {(seoTitle || seoDesc) && (
        <div className="relative mx-auto max-w-[1400px] px-4 pt-10 sm:px-5 sm:pt-16 sm:text-center md:px-8">
          {seoTitle && (
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-2xl md:text-[28px]">
              {seoTitle}
            </h2>
          )}

          {seoDesc && (
            <>
              <div
                className={`relative mt-4 max-w-3xl overflow-hidden text-sm leading-relaxed text-neutral-500 transition-all duration-300 ease-in-out sm:mx-auto sm:text-[15px] ${
                  expanded ? 'max-h-[2000px]' : 'max-h-[3.2rem]'
                }`}
              >
                <p>{seoDesc}</p>
                {!expanded && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[var(--color-tertiary)] to-transparent" />
                )}
              </div>

              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 px-3.5 py-1.5 text-sm font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/20"
              >
                {expanded ? 'Show Less' : 'Show More'}
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
            </>
          )}
        </div>
      )}

      {/* Main footer band as a floating rounded card */}
      <div className="relative mx-auto max-w-[1400px] px-3 pb-4 pt-8 sm:px-5 sm:pt-10 md:px-8">
        <div className="relative rounded-[1.5rem] border border-neutral-900/5 bg-white/60 p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:rounded-[2rem] sm:p-8 md:p-10">

          <div className={`grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 sm:text-center ${
            linkGroups.length > 0
              ? 'lg:grid-cols-[1.3fr_1fr_repeat(var(--lg-cols,1),0.8fr)_1fr]'
              : 'lg:grid-cols-[1.3fr_1fr_1fr]'
          }`}
          style={{ '--lg-cols': linkGroups.length } as React.CSSProperties}
          >

            {/* ── Brand ── */}
            <div className="flex flex-col items-start sm:items-center">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl shadow-md ring-2 ring-[var(--color-primary)]/10 sm:h-14 sm:w-14">
                  <Image
                    src={merchantLogo}
                    alt={restaurantName}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                  {restaurantName}
                </span>
              </div>

              {address && (
                <p className="mt-5 max-w-xs text-sm leading-relaxed text-neutral-500">
                  {address}
                </p>
              )}

              {showApps && (
                <div className="mt-6 flex flex-wrap items-center gap-3 sm:justify-center">
                  {androidLink && (
                    <a
                      href={androidLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Get it on Google Play"
                      className="overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      <Image src={androidIcon} alt="Google Play" width={106} height={106} className="h-20 w-20 object-contain sm:h-[106px] sm:w-[106px]" />
                    </a>
                  )}
                  {iosLink && (
                    <a
                      href={iosLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Download on the App Store"
                      className="overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      <Image src={iosIcon} alt="App Store" width={106} height={106} className="h-20 w-20 object-contain sm:h-[106px] sm:w-[106px]" />
                    </a>
                  )}
                </div>
              )}

              {!showApps && footerButtons.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 sm:justify-center">
                  {footerButtons.map((btn) => (
                    <a
                      key={btn.url}
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full border-2 border-[var(--color-primary)]/15 bg-[var(--color-primary)]/5 px-4 py-2 text-xs font-semibold text-[var(--color-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary)]/10"
                    >
                      {btn.text}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* ── Contact ── */}
            {(phone || email) && (
              <div className="flex flex-col items-start sm:items-center">
                <SectionHeading>Contact</SectionHeading>
                <ul className="mt-6 space-y-3 text-sm text-neutral-600">
                  {phone && (
                    <li>
                      <a href={`tel:${phone}`} className="transition-colors hover:text-[var(--color-primary)]">
                        {phone}
                      </a>
                    </li>
                  )}
                  {email && (
                    <li>
                      <a href={`mailto:${email}`} className="transition-colors hover:text-[var(--color-primary)]">
                        {email}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* ── Dynamic link groups ── */}
            {linkGroups.map((group) => (
              <div key={group.heading} className="flex flex-col items-start sm:items-center">
                <SectionHeading>{group.heading}</SectionHeading>
                <ul className="mt-6 space-y-3 text-sm text-neutral-600">
                  {group.links.map((link) => (
                    <li key={link.url}>
                      <Link href={link.url} className="transition-colors hover:text-[var(--color-primary)]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* ── Social ── */}
            {hasSocial && (
              <div className="flex flex-col items-start sm:items-center">
                <SectionHeading>Follow Us</SectionHeading>
                <div className="mt-6 flex flex-wrap gap-2.5 sm:justify-center">
                  <SocialLink href={social.facebook}  label="Facebook"  icon={<FacebookIcon />} />
                  <SocialLink href={social.instagram} label="Instagram" icon={<InstagramIcon />} />
                  <SocialLink href={social.twitter}   label="Twitter"   icon={<TwitterIcon />} />
                  <SocialLink href={social.youtube}   label="YouTube"   icon={<YoutubeIcon />} />
                  <SocialLink href={social.tiktok}    label="TikTok"    icon={<TiktokIcon />} />
                  <SocialLink href={social.linkedin}  label="LinkedIn"  icon={<LinkedinIcon />} />
                  <SocialLink href={social.snapchat}  label="Snapchat"  icon={<SnapchatIcon />} />
                  <SocialLink href={social.pinterest} label="Pinterest" icon={<PinterestIcon />} />
                  <SocialLink href={social.whatsapp}  label="WhatsApp"  icon={<WhatsappIcon />} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    {/* Bottom bar */}
<div className="relative mx-auto max-w-[1400px] px-4 pb-8 sm:px-5 md:px-8">
  <div className="flex flex-col items-center justify-center gap-2.5 border-t border-neutral-900/10 pt-7 text-center text-xs text-neutral-500 sm:flex-row sm:gap-3 sm:text-sm">
    <span>© {currentYear} {restaurantName}. All Rights Reserved</span>
    <span className="flex items-center gap-1.5">
      Powered by
      <Link
        href="https://trestechsolutions.com"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex items-center rounded-full bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 px-3 py-1 text-sm font-extrabold tracking-tight ring-1 ring-blue-500/20 transition-all duration-300 hover:scale-105 hover:ring-blue-500/50 hover:shadow-[0_6px_20px_-6px_rgba(59,130,246,0.55)]"
      >
        <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Trestech
        </span>
      </Link>
    </span>
  </div>
</div>
    </footer>
  )
}