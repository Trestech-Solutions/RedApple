import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo/site'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl()
  if (process.env.NEXT_PUBLIC_NOINDEX === 'true') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/website/checkout', '/website/profile', '/api/', '/_next/'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
