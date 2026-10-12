import type { MetadataRoute } from 'next'
import { getCmsPages, getSiteUrl } from '@/lib/seo/site'

export const revalidate = 600

/** Fully dynamic: core storefront pages + every CMS page the restaurant has published. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [base, pages] = await Promise.all([getSiteUrl(), getCmsPages()])
  const now = new Date()

  const core: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/website/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/website/faqs`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/website/locations`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/website/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ]

  const seen = new Set(core.map((c) => c.url))
  const cms: MetadataRoute.Sitemap = pages
    .filter((p) => p.slug)
    .map((p) => ({ url: `${base}/website/${p.slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.4 }))
    .filter((p) => !seen.has(p.url))

  return [...core, ...cms]
}
