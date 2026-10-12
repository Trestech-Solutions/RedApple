import type { Metadata } from 'next'
import { buildPageMetadata, getSiteSeo } from '@/lib/seo/site'

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteSeo()
  return buildPageMetadata({
    title: 'Our Locations',
    description: `Find a ${siteName} branch near you, with addresses, delivery areas and opening hours.`,
    path: '/website/locations',
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
