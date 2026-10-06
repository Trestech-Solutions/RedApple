'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import {
  MapPin, Phone, User, Menu, ShoppingCart,
  Search, ArrowUp, MessageCircle, Clock, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'
import { AuthModal } from '@/components/auth/AuthModal'
import { CorporateOrderModal } from '@/components/website/CorporateOrderModal'
import { MenuDrawer } from '@/components/website/MenuDrawer'
import { UserDropdown } from '@/components/website/UserDropdown'
import { getPostBySlug, getRelatedPosts } from '@/lib/data/blog-posts'

export default function BlogDetailPage() {
  const pathname = usePathname()
  const router = useRouter()
  const { totalItems, openCart, location, openLocationModal } = useCart()
  const [authModalOpen, setAuthModalOpen]           = useState(false)
  const [corporateModalOpen, setCorporateModalOpen] = useState(false)
  const [menuOpen, setMenuOpen]                     = useState(false)
  const [relatedStart, setRelatedStart]             = useState(0)

  const isCheckout = pathname === '/website/checkout'
  const handleLocationClick = () => {
    if (isCheckout) router.push('/')
    else openLocationModal()
  }

  const params   = useParams()
  const slug     = typeof params.slug === 'string' ? params.slug : ''
  const post     = getPostBySlug(slug)
  const related  = getRelatedPosts(slug, 6)

  const visibleRelated = related.slice(relatedStart, relatedStart + 3)

  const prevRelated = () => setRelatedStart((p) => Math.max(0, p - 3))
  const nextRelated = () => setRelatedStart((p) => (p + 3 < related.length ? p + 3 : p))

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-neutral-700">Post not found.</p>
          <Link href="/website/blog" className="mt-4 inline-block text-sm text-[#000000] hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans text-neutral-800">

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <header className="bg-[#000000] text-white relative relative">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-2.5 md:px-8">
          <button onClick={handleLocationClick} className="flex items-center gap-2 rounded bg-[#ffffff] px-3 py-1.5 text-xs font-semibold text-neutral-900">
              <MapPin size={16} />
              <span className="text-left leading-tight">
                Change Location<br />
                <span className="font-normal">{location || 'NED University'}</span>
              </span>
            </button>

          <a href="tel:021111022022" className="hidden items-center gap-2 text-sm font-medium sm:flex">
            <Phone size={16} />
            021-111-022-022
          </a>

          {/* Logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 -bottom-12 z-40 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl overflow-hidden border-4 border-white"
          >
            <Image
              src="https://assets.indolj.io/upload/1776252259-1652698752-uk-1.jpg"
              alt="United King"
              width={96}
              height={96}
              className="object-contain"
            />
          </Link>

          <div className="flex-1" />

          <div className="hidden items-center gap-4 text-sm md:flex">
            <UserDropdown onLoginClick={() => setAuthModalOpen(true)} />
            <span className="text-white/50">|</span>
            <button
              onClick={() => setCorporateModalOpen(true)}
              className="rounded bg-[#ffffff] px-3 py-1.5 text-xs font-semibold text-neutral-900"
            >
              Corporate &amp; Special Event Orders
            </button>
          </div>

          <button onClick={openCart} aria-label="Open cart" className="relative rounded-full p-2 hover:bg-white/10 transition-colors">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ffffff] text-[10px] font-bold text-neutral-900">
                {totalItems}
              </span>
            )}
          </button>

          <button aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* ── Hero Image ──────────────────────────────────────────────────── */}
      <section className="relative h-72 overflow-hidden sm:h-96">
        <Image
          src={post.image}
          alt={post.title}
          fill
          priority
          className="object-cover object-center"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-8 md:px-12">
          <span className="mb-2 inline-block text-xs font-bold tracking-widest text-[#ffffff]">
            {post.category}
          </span>
          <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-4xl">
            {post.title}
          </h1>
          <div className="mt-3 flex items-center gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1.5"><Calendar size={13} />{post.date}</span>
            <span className="flex items-center gap-1.5"><Clock size={13} />{post.readTime}</span>
          </div>
        </div>
      </section>

      {/* ── Article Body ────────────────────────────────────────────────── */}
      <article className="mx-auto max-w-[780px] px-4 py-12 md:px-8">
        {/* Back link */}
        <Link href="/website/blog" className="mb-8 inline-flex items-center gap-1.5 text-sm text-[#000000] hover:underline">
          <ChevronLeft size={16} />
          Back to Blog
        </Link>

        <div className="mt-6 space-y-5">
          {post.content.map((section, i) => {
            if (section.type === 'heading') {
              return (
                <h2 key={i} className="pt-3 text-xl font-bold text-neutral-900">
                  {section.text}
                </h2>
              )
            }
            if (section.type === 'list') {
              return (
                <ul key={i} className="list-disc space-y-1.5 pl-6 text-sm leading-relaxed text-neutral-700">
                  {section.items?.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )
            }
            return (
              <p key={i} className="text-[15px] leading-relaxed text-neutral-700">
                {section.text}
              </p>
            )
          })}
        </div>
      </article>

      {/* ── Related Posts ───────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-4 pb-16 md:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-neutral-900">Related posts</h3>
            <div className="flex gap-2">
              <button
                onClick={prevRelated}
                disabled={relatedStart === 0}
                aria-label="Previous"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-[#000000] hover:text-[#000000] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextRelated}
                disabled={relatedStart + 3 >= related.length}
                aria-label="Next"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-[#000000] hover:text-[#000000] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRelated.map((rp) => (
              <Link
                key={rp.slug}
                href={`/website/blog/${rp.slug}`}
                className="group flex flex-col rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={rp.image}
                    alt={rp.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="mb-1 text-[10px] font-bold tracking-widest text-[#000000]">{rp.category}</p>
                  <h4 className="flex-1 text-sm font-bold leading-snug text-neutral-900 group-hover:text-[#000000] transition-colors">
                    {rp.title}
                  </h4>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">
                    <Clock size={12} />
                    <span>{rp.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative overflow-visible bg-[#000000] pt-16 text-white rounded-tl-3xl rounded-tr-3xl">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-4 pb-10 md:grid-cols-4 md:px-8">
          <div>
            <div className="mb-3 overflow-hidden rounded-full w-16 h-16 border-2 border-[#ffffff]">
              <Image src="https://assets.indolj.io/upload/1776252259-1652698752-uk-1.jpg" alt="United King" width={64} height={64} className="object-contain" />
            </div>
            <p className="text-xs italic text-[#ffffff]">the Food Kingdom</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold">Information</h4>
            <p className="mb-3 text-sm">021-111-022-022</p>
            <ul className="space-y-2 text-sm text-white/90">
              <li><Link href="/website/about" className="hover:underline">About Us</Link></li>
              <li><Link href="/website/complaint" className="hover:underline">Submit Complaint</Link></li>
              <li><Link href="/website/contact" className="hover:underline">Contact Us</Link></li>
            </ul>
          </div>

          <div className="relative flex justify-center md:justify-start">
            <div className="absolute -top-16 w-28 sm:w-36">
              <Image
                src="https://unitedkingonline.com/_next/image?url=%2Fassets%2Fimages%2Funitedking%2Fmobile-mockup.png&w=2048&q=75"
                alt="App preview"
                width={144}
                height={280}
                className="w-full object-contain drop-shadow-2xl"
              />
            </div>
            <div className="h-44 w-28 sm:w-36" />
          </div>

          <div>
            <h4 className="mb-3 text-lg font-bold">Get The App!</h4>
            <p className="mb-4 text-sm text-white/90">Easy, Fast and Convenient.</p>
            <div className="flex flex-col gap-2">
              <a href="https://apps.apple.com/us/app/united-king/id1616868468" target="_blank" rel="noopener noreferrer" className="rounded-md bg-black px-4 py-2 text-left text-xs text-white hover:bg-neutral-800 transition-colors">Download on App Store</a>
              <a href="https://play.google.com/store/apps/details?id=com.indolj.unitedking" target="_blank" rel="noopener noreferrer" className="rounded-md bg-black px-4 py-2 text-left text-xs text-white hover:bg-neutral-800 transition-colors">GET IT ON Google Play</a>
            </div>
          </div>
        </div>

        <div className="flex items-center mb-20 justify-between border-t border-white/20 px-4 py-4 text-xs text-white/80 md:px-8">
          <button aria-label="Search" className="rounded-full bg-white/10 p-2"><Search size={16} /></button>
          <p className="text-center">
            Powered by Trestech &nbsp;|&nbsp;
            <a href="#" className="hover:underline">Privacy</a> &nbsp;
            <a href="#" className="hover:underline">Faqs</a>
          </p>
          <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="rounded-full bg-white/10 p-2">
            <ArrowUp size={16} />
          </button>
        </div>
      </footer>

      <a
        href="https://wa.me/923366655786"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform"
      >
        <MessageCircle size={26} fill="white" />
      </a>

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} onGuestContinue={() => setAuthModalOpen(false)} />}
      {corporateModalOpen && <CorporateOrderModal onClose={() => setCorporateModalOpen(false)} />}
      <MenuDrawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLoginClick={() => setAuthModalOpen(true)}
      />
    </div>
  )
}
