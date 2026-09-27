'use client'

/**
 * Drop-in replacement for the hero carousel `<section>` block in HomePage
 * (the one rendered inside `{heroActive && (...)}`).
 *
 * What changed vs. your original:
 *  - Touch/swipe support on mobile (drag left/right to change slide) —
 *    previously arrows only worked on sm+ and there was no way to swipe.
 *  - Subtle Ken Burns (slow zoom) on the active slide only, paused on the
 *    inactive ones, for a much less static feel.
 *  - Autoplay pauses on hover/touch and resumes after you stop
 *    interacting, instead of fighting the user while they're dragging.
 *  - Arrows now show on all breakpoints (small ghost circles on mobile,
 *    full glass circles from sm+) instead of being hidden below sm.
 *  - Dots are tappable, with a filled progress bar on the active one so
 *    users get a sense of autoplay timing.
 *  - Same aspect-ratio-follows-image-ratio behavior you had, kept intact.
 *
 * Usage: import HeroCarousel and render
 *   <HeroCarousel slides={HERO_SLIDES} backgroundColor={settings.background_color}
 *     backgroundImage={resolvedBgImage} hidePaymentBadge={settings.hide_payment_card_logo_from_banner} />
 * in place of the old inline hero <section>. It owns its own currentSlide /
 * slideRatios state internally.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type HeroSlide = {
  id: string
  image: string
  title?: string
  heading?: string
  headingColor?: string
  description?: string
  descriptionColor?: string
  link?: string
}

const AUTOPLAY_MS = 4500

export function HeroCarousel({
  slides,
  backgroundColor,
  backgroundImage,
  hidePaymentBadge,
}: {
  slides: HeroSlide[]
  backgroundColor?: string
  backgroundImage?: string
  hidePaymentBadge?: boolean
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideRatios, setSlideRatios] = useState<Record<string, number>>({})
  const [isPaused, setIsPaused] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goToSlide = useCallback(
    (index: number) => {
      if (slides.length === 0) return
      setCurrentSlide((index + slides.length) % slides.length)
    },
    [slides.length]
  )

  // Autoplay — paused while the user is interacting
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % slides.length), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [slides.length, isPaused])

  useEffect(() => {
    if (slides.length === 0) setCurrentSlide(0)
  }, [slides.length])

  const pauseThenResume = () => {
    setIsPaused(true)
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setIsPaused(false), 2500)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]!.clientX
    touchDeltaX.current = 0
    setIsPaused(true)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    touchDeltaX.current = e.touches[0]!.clientX - touchStartX.current
  }
  const onTouchEnd = () => {
    const delta = touchDeltaX.current
    if (Math.abs(delta) > 40) {
      if (delta < 0) goToSlide(currentSlide + 1)
      else goToSlide(currentSlide - 1)
    }
    touchStartX.current = null
    touchDeltaX.current = 0
    pauseThenResume()
  }

  if (slides.length === 0) return null

  return (
    <section
      className="px-3 py-3 sm:px-6 sm:py-6 md:px-10 md:py-8"
      style={{
        backgroundColor: backgroundColor || '',
        backgroundImage: backgroundImage ? `url("${backgroundImage}")` : '',
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundAttachment: 'fixed',
      }}
    >
      <div
        className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] transition-[aspect-ratio] duration-500 ease-out sm:rounded-3xl"
        style={{ aspectRatio: slideRatios[slides[currentSlide]?.id ?? ''] ?? 3.3 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((s, i) => {
          const isActive = i === currentSlide
          const isExternal = s.link && /^https?:\/\//i.test(s.link)
          const Wrapper: React.FC<{ children: React.ReactNode }> = s.link
            ? ({ children }) =>
                isExternal ? (
                  <a href={s.link!} target="_blank" rel="noopener noreferrer" className="absolute inset-0 block">
                    {children}
                  </a>
                ) : (
                  <a href={s.link!} className="absolute inset-0 block">
                    {children}
                  </a>
                )
            : ({ children }) => <>{children}</>

          return (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'z-10 opacity-100' : 'z-0 opacity-0'
              }`}
            >
              <Wrapper>
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className={`absolute inset-0 transition-transform duration-[6000ms] ease-out ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}
                  >
                    <Image
                      src={s.image}
                      alt={s.title || s.heading || 'slide'}
                      fill
                      priority={i === 0}
                      className="object-contain object-center"
                      onLoadingComplete={(img) => {
                        if (!img.naturalWidth || !img.naturalHeight) return
                        const ratio = img.naturalWidth / img.naturalHeight
                        setSlideRatios((prev) => (prev[s.id] === ratio ? prev : { ...prev, [s.id]: ratio }))
                      }}
                    />
                  </div>
                </div>
              </Wrapper>
            </div>
          )
        })}

        {/* Prev / Next arrows — visible on every breakpoint, larger from sm+ */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => {
                goToSlide(currentSlide - 1)
                pauseThenResume()
              }}
              aria-label="Previous"
              className="group absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-md ring-1 ring-white/25 transition-all duration-300 hover:scale-110 hover:bg-white/30 active:scale-95 sm:left-5 sm:h-11 sm:w-11 md:h-12 md:w-12"
            >
              <ChevronLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-0.5 sm:hidden" />
              <ChevronLeft size={20} className="hidden transition-transform duration-300 group-hover:-translate-x-0.5 sm:block md:hidden" />
              <ChevronLeft size={24} className="hidden transition-transform duration-300 group-hover:-translate-x-0.5 md:block" />
            </button>
            <button
              onClick={() => {
                goToSlide(currentSlide + 1)
                pauseThenResume()
              }}
              aria-label="Next"
              className="group absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur-md ring-1 ring-white/25 transition-all duration-300 hover:scale-110 hover:bg-white/30 active:scale-95 sm:right-5 sm:h-11 sm:w-11 md:h-12 md:w-12"
            >
              <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 sm:hidden" />
              <ChevronRight size={20} className="hidden transition-transform duration-300 group-hover:translate-x-0.5 sm:block md:hidden" />
              <ChevronRight size={24} className="hidden transition-transform duration-300 group-hover:translate-x-0.5 md:block" />
            </button>
          </>
        )}

        {/* Pagination — active dot fills like a progress bar over the autoplay interval */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 backdrop-blur-md sm:bottom-5 sm:gap-2 sm:px-3">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  goToSlide(i)
                  pauseThenResume()
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`relative h-1.5 overflow-hidden rounded-full bg-white/30 transition-all duration-300 ${
                  i === currentSlide ? 'w-6 sm:w-8' : 'w-1.5 hover:bg-white/50'
                }`}
              >
                {i === currentSlide && !isPaused && (
                  <span
                    key={`${currentSlide}-${isPaused}`}
                    className="absolute inset-y-0 left-0 rounded-full bg-white"
                    style={{
                      animation: `hero-dot-fill ${AUTOPLAY_MS}ms linear forwards`,
                    }}
                  />
                )}
                {i === currentSlide && isPaused && (
                  <span className="absolute inset-0 rounded-full bg-white" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Secure payments badge */}
        {!hidePaymentBadge && (
          <div className="absolute bottom-3 right-2 z-20 hidden rounded-lg bg-white/95 px-2.5 py-1.5 shadow-md backdrop-blur-sm sm:bottom-5 sm:right-5 sm:flex sm:flex-col sm:gap-1 sm:px-4 sm:py-2">
            <span className="text-[8px] font-bold tracking-wide text-neutral-700 sm:text-[10px]">
              SECURE PAYMENTS
            </span>
            <div className="flex gap-1 sm:gap-2">
              <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[8px] font-bold text-blue-700 sm:px-2 sm:text-[10px]">
                VISA
              </span>
              <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[8px] font-bold text-orange-600 sm:px-2 sm:text-[10px]">
                MasterCard
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes hero-dot-fill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  )
}