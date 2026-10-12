import type { Metadata } from 'next'
import { buildPageMetadata, getSiteSeo } from '@/lib/seo/site'

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteSeo()
  return buildPageMetadata({
    title: 'Submit a Complaint',
    description: `Tell ${siteName} about a problem with your order — we will make it right.`,
    path: '/website/complaint',
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
