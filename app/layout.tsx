import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { Toaster } from "sonner";
import { AlertTriangle, Check, CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";

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
  offset={20}
  gap={12}
  visibleToasts={3}
  duration={3500}
  style={{ '--width': 'min(460px, calc(100vw - 32px))' } as React.CSSProperties}
  icons={{
    success: (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
        <Check className="h-5 w-5 text-white" strokeWidth={3} />
      </span>
    ),
    error: (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
        <X className="h-5 w-5 text-white" strokeWidth={3} />
      </span>
    ),
    warning: (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
        <AlertTriangle className="h-5 w-5 text-white" strokeWidth={2.75} />
      </span>
    ),
    info: (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
        <Info className="h-5 w-5 text-white" strokeWidth={2.75} />
      </span>
    ),
    loading: (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
        <Loader2 className="h-5 w-5 animate-spin text-white/80" strokeWidth={2.5} />
      </span>
    ),
  }}
  toastOptions={{
    unstyled: true,
    classNames: {
      toast:
        'flex w-full items-center gap-3.5 rounded-[26px] border py-3 pl-3 pr-6 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl',
      icon: 'flex shrink-0 items-center justify-center',
      content: 'flex min-w-0 flex-1 flex-col',
      title: 'text-[16px] font-bold leading-tight tracking-tight text-white',
      description: 'mt-1 line-clamp-2 text-[14px] leading-snug text-white/80',
      actionButton:
        'ml-2 shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-900 transition hover:bg-neutral-100 active:scale-95',
      cancelButton:
        'ml-2 shrink-0 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30',
      default: 'border-green bg-green',
      success: 'border-emerald-300/30 bg-emerald-600/95',
      error:   'border-rose-300/30 bg-rose-600/95',
      warning: 'border-amber-200/40 bg-amber-500/95',
      info:    'border-sky-300/30 bg-sky-600/95',
      loading: 'border-white/10 bg-neutral-900/95',
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
