import type { Metadata } from 'next'
import { buildPageMetadata, getSiteSeo } from '@/lib/seo/site'

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteSeo()
  return buildPageMetadata({
    title: 'About Us',
    description: `Learn about ${siteName}: our story, our food and what we stand for.`,
    path: '/website/about',
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
