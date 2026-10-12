import type { Metadata } from 'next'
import { buildPageMetadata, getSiteSeo } from '@/lib/seo/site'

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteSeo()
  return buildPageMetadata({
    title: 'FAQs',
    description: `Answers to frequently asked questions about ordering, delivery and payments at ${siteName}.`,
    path: '/website/faqs',
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
