import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "sonner";

// ─── SEO from API ─────────────────────────────────────────────────────────────

const BASE_URL      = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/+$/, '')
const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID ?? '2'

// Fallback branch: use 1 (or whatever the default is)
const FALLBACK_BRANCH = process.env.NEXT_PUBLIC_DEFAULT_BRANCH_ID ?? '6'

type SeoData = {
  meta_title: string
  meta_description: string
  insert_in_header: string
  insert_in_body: string
  insert_in_footer: string
} | null

async function fetchSeo(): Promise<SeoData> {
  try {
    const url = `${BASE_URL}/api/storefront/menu/?branch=${FALLBACK_BRANCH}&restaurant=${RESTAURANT_ID}`
    const res = await fetch(url, {
      // Revalidate every 10 minutes — SEO data rarely changes
      next: { revalidate: 600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const seo = data?.seo
    if (!seo) return null
    return {
      meta_title:       seo.meta_title       ?? '',
      meta_description: seo.meta_description ?? '',
      insert_in_header: seo.insert_in_header ?? '',
      insert_in_body:   seo.insert_in_body   ?? '',
      insert_in_footer: seo.insert_in_footer ?? '',
    }
  } catch {
    return null
  }
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const seo = await fetchSeo()

  const title       = seo?.meta_title?.trim()       || 'Restaurant'
  const description = seo?.meta_description?.trim() || ''

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
    },
  }
}

// ─── Viewport ────────────────────────────────────────────────────────────────

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seo = await fetchSeo()

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {/* insert_in_header — injected via Script afterInteractive (Next.js handles placement) */}
        {seo?.insert_in_header?.trim() && (
          <Script
            id="seo-header-inject"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: seo.insert_in_header }}
          />
        )}

        {/* insert_in_body — e.g. GTM noscript, chat widgets */}
        {seo?.insert_in_body?.trim() && (
          <Script
            id="seo-body-inject"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: seo.insert_in_body }}
          />
        )}

        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
            />
          </AuthProvider>
        </QueryProvider>

        {/* insert_in_footer — e.g. analytics, heatmaps */}
        {seo?.insert_in_footer?.trim() && (
          <Script
            id="seo-footer-inject"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{ __html: seo.insert_in_footer }}
          />
        )}

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
