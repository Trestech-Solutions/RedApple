import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/site'

// /website/home and / render the same page — point search engines at "/"
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ path: '/' })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
