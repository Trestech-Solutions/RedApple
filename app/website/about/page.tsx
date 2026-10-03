'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useGetAboutUs } from '@/api/client/content'
import { useStoreSettings } from '@/lib/hooks/useCart'

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''

function resolveMedia(path?: string | null): string | null {
  if (!path || path.trim() === '') return null
  if (path.startsWith('http')) return path
  const base = MEDIA_BASE.replace(/\/+$/, '').replace(/\/api$/i, '')
  return base ? `${base}${path}` : null
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-64 sm:h-80 bg-neutral-200" />
      <div className="mx-auto max-w-[860px] px-4 py-14 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-neutral-100" style={{ width: `${85 - i * 6}%` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutUsPage() {
  const { data: about, isLoading } = useGetAboutUs()
  const { settings } = useStoreSettings()

  const primaryColor = settings.primary_color || '#000000'

  if (isLoading) return <Skeleton />

  // If no about us data configured, show a simple fallback
  if (!about) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-center px-4">
        <div>
          <p className="text-neutral-500 text-sm">About Us page is not set up yet.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold underline" style={{ color: primaryColor }}>
            Back to menu
          </Link>
        </div>
      </div>
    )
  }

  const bannerUrl = resolveMedia(about.banner_image)
  const imageUrl  = resolveMedia(about.image)
  const pageTitle = about.page_title || 'About Us'
  const subtitle  = about.subtitle   || ''

  return (
    <div className="min-h-screen font-sans text-neutral-800">

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <section className="relative h-56 overflow-hidden sm:h-72 md:h-80">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={pageTitle}
            fill
            priority
            className="object-cover object-center brightness-50"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: primaryColor, opacity: 0.85 }} />
        )}
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
          <h1 className="text-3xl font-extrabold sm:text-4xl md:text-5xl drop-shadow-lg">
            {pageTitle}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">{subtitle}</p>
          )}
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      {(about.content || imageUrl) && (
        <section className="mx-auto max-w-[900px] px-4 py-12 md:px-8">
          <div className={`gap-10 ${imageUrl ? 'md:grid md:grid-cols-[1fr_320px]' : ''}`}>
            {/* Text */}
            {about.content && (
              <div
                className="prose prose-neutral max-w-none text-[15px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: about.content }}
              />
            )}

            {/* Side image */}
            {imageUrl && (
              <div className="mt-8 md:mt-0">
                <div className="overflow-hidden rounded-2xl shadow-md">
                  <Image
                    src={imageUrl}
                    alt={pageTitle}
                    width={320}
                    height={400}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Extra sections ────────────────────────────────────────────────── */}
      {about.sections && about.sections.length > 0 && (
        <section className="mx-auto max-w-[900px] px-4 pb-14 md:px-8">
          <div className="space-y-10">
            {about.sections.map((sec, i) => (
              <div key={i} className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
                {sec.title && (
                  <h2
                    className="mb-3 text-xl font-bold"
                    style={{ color: primaryColor }}
                  >
                    {sec.title}
                  </h2>
                )}
                <div
                  className="prose prose-neutral max-w-none text-[15px] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sec.content }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="py-14 text-center text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-2xl font-extrabold sm:text-3xl">Taste the difference</h2>
        <p className="mt-2 text-sm text-white/80">Order now and experience it yourself.</p>
        <Link href="/">
          <button className="mt-6 rounded-full bg-white px-8 py-3 text-sm font-bold transition-opacity hover:opacity-90"
            style={{ color: primaryColor }}>
            Order Now
          </button>
        </Link>
      </section>
    </div>
  )
}
