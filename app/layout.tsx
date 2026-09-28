import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "sonner";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

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
  position="top-center"
  offset={16}
  gap={10}
  visibleToasts={3}
  duration={3500}
  style={{ '--width': '380px' } as React.CSSProperties}
  icons={{
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={2.25} />,
    error:   <XCircle className="h-5 w-5 text-rose-600" strokeWidth={2.25} />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600" strokeWidth={2.25} />,
    info:    <Info className="h-5 w-5 text-sky-600" strokeWidth={2.25} />,
    loading: <Loader2 className="h-5 w-5 animate-spin text-neutral-500" strokeWidth={2.25} />,
  }}
  toastOptions={{
    unstyled: true,
    classNames: {
      toast:
        'flex w-full max-w-[92vw] items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] backdrop-blur-xl',
      icon: 'flex shrink-0 items-center justify-center',
      content: 'flex min-w-0 flex-col',
      title: 'text-[14px] font-semibold leading-tight tracking-tight',
      description: 'mt-0.5 text-[13px] leading-snug opacity-70',
      actionButton:
        'ml-auto shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-700',
      cancelButton:
        'ml-auto shrink-0 rounded-lg bg-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-300',
      default: 'border-neutral-200/80 bg-white/90 text-neutral-900',
      success: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-950',
      error:   'border-rose-200/80 bg-rose-50/90 text-rose-950',
      warning: 'border-amber-200/80 bg-amber-50/90 text-amber-950',
      info:    'border-sky-200/80 bg-sky-50/90 text-sky-950',
      loading: 'border-neutral-200/80 bg-white/90 text-neutral-900',
    },
  }}
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
