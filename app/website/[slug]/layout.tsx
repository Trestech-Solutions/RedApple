import type { Metadata } from 'next'
import { buildPageMetadata, getCmsPage } from '@/lib/seo/site'

// CMS pages: use the page's own SEO fields from the admin, falling back to its
// title / subtitle, then to the site-level SEO.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getCmsPage(slug)
  if (!page || page.is_active === false) {
    return buildPageMetadata({ title: 'Page not found', path: `/website/${slug}`, noindex: true })
  }
  return buildPageMetadata({
    title: page.meta_title?.trim() || page.title,
    description: page.meta_description?.trim() || page.subtitle,
    path: `/website/${page.slug || slug}`,
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
