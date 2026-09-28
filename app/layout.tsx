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
  gap={10}
  visibleToasts={3}
  duration={3500}
  style={{ '--width': 'min(400px, calc(100vw - 32px))' } as React.CSSProperties}
  icons={{
    success: (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
        <Check className="h-4 w-4 text-emerald-400" strokeWidth={3} />
      </span>
    ),
    error: (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/15 ring-1 ring-rose-400/30">
        <X className="h-4 w-4 text-rose-400" strokeWidth={3} />
      </span>
    ),
    warning: (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-400/30">
        <AlertTriangle className="h-4 w-4 text-amber-400" strokeWidth={2.5} />
      </span>
    ),
    info: (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 ring-1 ring-sky-400/30">
        <Info className="h-4 w-4 text-sky-400" strokeWidth={2.5} />
      </span>
    ),
    loading: (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
        <Loader2 className="h-4 w-4 animate-spin text-white/80" strokeWidth={2.5} />
      </span>
    ),
  }}
  toastOptions={{
    unstyled: true,
    classNames: {
      toast:
        'flex w-full items-center gap-3 rounded-full border border-white/10 bg-neutral-950/90 py-2 pl-2 pr-5 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl',
      icon: 'flex shrink-0 items-center justify-center',
      content: 'flex min-w-0 flex-1 flex-col',
      title: 'truncate text-[14px] font-semibold leading-tight tracking-tight text-white',
      description: 'mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-neutral-400',
      actionButton:
        'ml-2 shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-900 transition hover:bg-neutral-200 active:scale-95',
      cancelButton:
        'ml-2 shrink-0 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/20',
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
