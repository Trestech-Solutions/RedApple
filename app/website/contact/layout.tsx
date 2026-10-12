import type { Metadata } from 'next'
import { buildPageMetadata, getSiteSeo } from '@/lib/seo/site'

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteSeo()
  return buildPageMetadata({
    title: 'Contact Us',
    description: `Get in touch with ${siteName} — call, email or send us a message.`,
    path: '/website/contact',
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
