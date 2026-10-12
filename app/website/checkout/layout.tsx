import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/site'

// Private / transactional (or placeholder) content — keep out of search results
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ title: 'Checkout', path: '/website/checkout', noindex: true })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
