/**
 * Central, server-side SEO resolver.
 *
 * Everything is driven by the restaurant's own data from the API (the same
 * record the admin "SEO" tab edits), so every restaurant deployment
 * (NEXT_PUBLIC_RESTAURANT_ID) gets its own title / description / schema /
 * sitemap. Anything left empty in the admin falls back — in order — to:
 *   1. other restaurant data (footer title/description, category names, logo…)
 *   2. optional env overrides (NEXT_PUBLIC_SITE_NAME / NEXT_PUBLIC_SITE_DESCRIPTION)
 *   3. a neutral built-in default
 */
import { cache } from 'react'
import { headers } from 'next/headers'
import type { Metadata } from 'next'

const BASE_URL = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/+$/, '')
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID ?? '2'
const BRANCH_ID = process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID ?? '6'
const COUNTRY = process.env.NEXT_PUBLIC_COUNTRY ?? 'PK'
const LOCALE = process.env.NEXT_PUBLIC_LOCALE ?? 'en_PK'
const PLACEHOLDER_NAMES = new Set(['your restaurant name', 'restaurant name', 'restaurant', ''])

export const SEO_REVALIDATE = 600 // seconds — SEO data rarely changes

// ─── Raw API shapes (only what SEO needs) ─────────────────────────────────────

type MenuApi = {
  seo?: { meta_title?: string; meta_description?: string; insert_in_header?: string; insert_in_body?: string; insert_in_footer?: string } | null
  settings?: { merchant_logo?: string | null } | null
  footer?: { title?: string; subtitle?: string; description?: string; address?: string; logo?: string | null } | null
  footer_branch_contact?: { phone?: string; email?: string } | null
  branch?: { name?: string; branch_name?: string; address?: string; phone?: string } | null
  business_hours?: { day: string; is_open: boolean; time_from: string | null; time_to: string | null; second_start?: string | null; second_end?: string | null }[]
  social_media_links?: Record<string, string | number | null> | null
  menu?: { name?: string; status?: boolean; hide_category?: boolean }[]
  categories?: { name?: string; status?: boolean; hide_category?: boolean }[]
  pages?: { title: string; slug: string }[]
}

export type CmsPageSeo = {
  title: string
  slug: string
  subtitle?: string
  meta_title?: string
  meta_description?: string
  date_updated?: string
  is_active?: boolean
}

// ─── Fetchers (request-memoised + ISR cached) ─────────────────────────────────

export const getMenuData = cache(async (): Promise<MenuApi | null> => {
  if (!BASE_URL) return null
  try {
    const res = await fetch(`${BASE_URL}/api/storefront/menu/?branch=${BRANCH_ID}&restaurant=${RESTAURANT_ID}`, {
      next: { revalidate: SEO_REVALIDATE },
    })
    return res.ok ? ((await res.json()) as MenuApi) : null
  } catch {
    return null
  }
})

export const getCmsPages = cache(async (): Promise<{ id: number; title: string; slug: string; sort_order?: number }[]> => {
  if (!BASE_URL) return []
  try {
    const res = await fetch(`${BASE_URL}/api/storefront/storefront/pages/?restaurant=${RESTAURANT_ID}`, {
      next: { revalidate: SEO_REVALIDATE },
    })
    const data = res.ok ? await res.json() : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
})

export async function getCmsPage(slug: string): Promise<CmsPageSeo | null> {
  if (!BASE_URL) return null
  try {
    const res = await fetch(
      `${BASE_URL}/api/storefront/storefront/pages/${encodeURIComponent(slug)}/?restaurant=${RESTAURANT_ID}`,
      { next: { revalidate: SEO_REVALIDATE } },
    )
    return res.ok ? ((await res.json()) as CmsPageSeo) : null
  } catch {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clean = (s?: string | null) => (s ?? '').replace(/\s+/g, ' ').trim()
const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`)

function absoluteMedia(path?: string | null): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return path.startsWith('/') && BASE_URL ? `${BASE_URL.replace(/\/api$/i, '')}${path}` : ''
}

export async function getSiteUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (env) return env.replace(/\/+$/, '')
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    if (host) {
      const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
      return `${proto}://${host}`
    }
  } catch { /* outside a request */ }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

// ─── Resolved SEO ─────────────────────────────────────────────────────────────

export type SiteSeo = {
  siteUrl: string
  siteName: string
  title: string
  description: string
  keywords: string[]
  logo: string
  phone: string
  address: string
  cuisines: string[]
  sameAs: string[]
  hours: { day: string; opens: string; closes: string }[]
  seoRaw: NonNullable<MenuApi['seo']> | null
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

export const getSiteSeo = cache(async (): Promise<SiteSeo> => {
  const [data, siteUrl] = await Promise.all([getMenuData(), getSiteUrl()])
  const seo = data?.seo ?? null
  const footer = data?.footer ?? null

  const metaTitle = clean(seo?.meta_title)
  const metaDesc = clean(seo?.meta_description)

  // Brand name: env → footer title (unless it is the default placeholder) → tail of the SEO title
  // ("Discover BBQ in Karachi – Angeethi PK" → "Angeethi PK") → generic.
  const footerName = clean(footer?.title)
  const titleTail = metaTitle.split(/\s[–—|\-]\s/).pop() ?? ''
  const siteName =
    clean(process.env.NEXT_PUBLIC_SITE_NAME) ||
    (!PLACEHOLDER_NAMES.has(footerName.toLowerCase()) ? footerName : '') ||
    (titleTail && titleTail !== metaTitle ? titleTail : '') ||
    clean(data?.branch?.name) ||
    'Restaurant'

  const categories = (data?.menu ?? data?.categories ?? [])
    .filter((c) => c.status !== false && c.hide_category !== true)
    .map((c) => clean(c.name))
    .filter(Boolean)

  const title = metaTitle || clip(`${siteName} – Order Online${footer?.subtitle ? ` | ${clean(footer.subtitle)}` : ''}`, 70)

  const description =
    metaDesc ||
    clean(footer?.description) ||
    clean(footer?.subtitle) ||
    clean(process.env.NEXT_PUBLIC_SITE_DESCRIPTION) ||
    `Order online from ${siteName}${categories.length ? ` — ${categories.slice(0, 5).join(', ')} and more` : ''}. Fast delivery and easy pickup.`

  const social = data?.social_media_links ?? {}
  const sameAs = Object.entries(social)
    .filter(([k, v]) => k.endsWith('_link') && typeof v === 'string' && /^https?:\/\//i.test(v) && !/yourpage/i.test(v) && !/wa\.me\/1?0{6,}/.test(v))
    .map(([, v]) => v as string)

  const hours = (data?.business_hours ?? []).flatMap((h) => {
    const day = DAY_NAMES[h.day]
    if (!day || !h.is_open || !h.time_from || !h.time_to) return []
    const out = [{ day, opens: h.time_from.slice(0, 5), closes: h.time_to.slice(0, 5) }]
    if (h.second_start && h.second_end) out.push({ day, opens: h.second_start.slice(0, 5), closes: h.second_end.slice(0, 5) })
    return out
  })

  return {
    siteUrl,
    siteName,
    title,
    description: clip(description, 300),
    keywords: [siteName, ...categories.slice(0, 12), 'order online', 'food delivery'].filter(Boolean),
    logo: absoluteMedia(data?.settings?.merchant_logo) || absoluteMedia(footer?.logo),
    phone: clean(data?.footer_branch_contact?.phone) || clean(data?.branch?.phone),
    address: clean(footer?.address) || clean(data?.branch?.address),
    cuisines: categories.slice(0, 8),
    sameAs,
    hours,
    seoRaw: seo,
  }
})

// ─── Metadata builders ────────────────────────────────────────────────────────

export const SEO_LOCALE = LOCALE
export const SEO_COUNTRY = COUNTRY
const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === 'true' // staging switch

/** Site-wide default metadata (root layout) */
export async function buildRootMetadata(): Promise<Metadata> {
  const s = await getSiteSeo()
  const images = s.logo ? [{ url: s.logo, alt: s.siteName }] : undefined
  return {
    metadataBase: new URL(s.siteUrl),
    title: { default: s.title, template: `%s | ${s.siteName}` },
    description: s.description,
    applicationName: s.siteName,
    keywords: s.keywords,
    alternates: { canonical: '/' },
    robots: NOINDEX
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    icons: {
      icon: [{ url: s.logo || '/favicon-fallback.png' }],
      apple: [{ url: s.logo || '/apple-fallback.png' }],
    },
    openGraph: { type: 'website', siteName: s.siteName, title: s.title, description: s.description, url: '/', locale: LOCALE, images },
    twitter: { card: images ? 'summary' : 'summary', title: s.title, description: s.description, images: images?.map((i) => i.url) },
  }
}

/** Per-route metadata with fallbacks to the site-level SEO */
export async function buildPageMetadata(opts: {
  title?: string
  description?: string
  path: string
  noindex?: boolean
}): Promise<Metadata> {
  const s = await getSiteSeo()
  const title = clean(opts.title)
  const description = clean(opts.description) || s.description
  const fullTitle = title ? `${title} | ${s.siteName}` : s.title
  const images = s.logo ? [{ url: s.logo, alt: s.siteName }] : undefined
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: opts.path },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: { type: 'website', siteName: s.siteName, title: fullTitle, description, url: opts.path, locale: LOCALE, images },
    twitter: { card: 'summary', title: fullTitle, description, images: images?.map((i) => i.url) },
  }
}
