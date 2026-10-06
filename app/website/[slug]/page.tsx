'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useGetPageBySlug } from '@/api/client/content'
import { useStoreSettings } from '@/lib/hooks/useCart'

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''

function resolveMedia(path?: string | null): string | null {
  if (!path || path.trim() === '') return null
  if (path.startsWith('http')) return path
  const base = MEDIA_BASE.replace(/\/+$/, '').replace(/\/api$/i, '')
  return base ? `${base}${path}` : null
}

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

export default function DynamicPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const { data: page, isLoading } = useGetPageBySlug(slug)
  const { settings } = useStoreSettings()

  const primaryColor = settings.primary_color || '#000000'

  if (isLoading) return <Skeleton />

  if (!page) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-center px-4">
        <div>
          <p className="text-2xl font-bold text-neutral-800 mb-2">404</p>
          <p className="text-neutral-500 text-sm">Page not found.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold underline" style={{ color: primaryColor }}>
            Back to menu
          </Link>
        </div>
      </div>
    )
  }

  const bannerUrl = resolveMedia(page.banner_image)
  const imageUrl  = resolveMedia(page.image)
  const pageTitle = page.title || page.slug
  const subtitle  = page.subtitle   || ''

  return (
    <div className="min-h-screen font-sans text-neutral-800">

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

      {(page.content || imageUrl) && (
        <section className="mx-auto max-w-[900px] px-4 py-12 md:px-8">
          <div className={`gap-10 ${imageUrl ? 'md:grid md:grid-cols-[1fr_320px]' : ''}`}>
            {page.content && (
              <div
                className="prose prose-neutral max-w-none text-[15px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            )}

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

      {page.sections && page.sections.length > 0 && (
        <section className="mx-auto max-w-[900px] px-4 pb-14 md:px-8">
          <div className="space-y-10">
            {page.sections.map((section, idx) => (
              (section.title || section.content) && (
                <div key={idx} className="rounded-2xl border border-neutral-100 bg-white p-6 md:p-8 shadow-sm">
                  {section.title && (
                    <h2 className="mb-3 text-xl font-bold text-neutral-900 md:text-2xl">
                      {section.title}
                    </h2>
                  )}
                  {section.content && (
                    <div
                      className="prose prose-neutral max-w-none text-[15px] leading-relaxed text-neutral-700"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  )}
                </div>
              )
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
