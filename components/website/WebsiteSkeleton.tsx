'use client'

export function WebsiteSkeleton() {
  return (
    <div className="min-h-screen bg-white font-sans text-neutral-800">
      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-100 bg-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:h-20 md:px-8">
          {/* Left: logo pill + icon circle */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 animate-pulse rounded-full bg-neutral-200 sm:h-10 sm:w-36 md:h-11 md:w-44" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-neutral-100 sm:h-10 sm:w-10" />
          </div>

          {/* Center: search bar pill */}
          <div className="hidden flex-1 justify-center px-6 md:flex">
            <div className="h-10 w-full max-w-md animate-pulse rounded-full bg-neutral-100" />
          </div>

          {/* Right: icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100 sm:h-9 sm:w-9" />
            <div className="relative">
              <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100 sm:h-9 sm:w-9" />
              <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full bg-red-400 sm:h-4 sm:w-4" />
            </div>
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-100 sm:h-9 sm:w-9" />
          </div>
        </div>
      </header>

      {/* ─── Hero banner ────────────────────────────────────────────────────── */}
      <section className="px-4 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8">
        <div className="relative mx-auto aspect-[3.3/1] w-full max-w-[1400px] overflow-hidden rounded-2xl border border-neutral-100 sm:rounded-3xl">
          {/* Banner background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-100 animate-pulse" />

          {/* Side chevron placeholders */}
          <div className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm sm:left-6 sm:h-11 sm:w-11 md:h-12 md:w-12">
            <div className="h-5 w-5 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
          </div>
          <div className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/60 backdrop-blur-sm sm:right-6 sm:h-11 sm:w-11 md:h-12 md:w-12">
            <div className="h-5 w-5 rounded-full border-2 border-neutral-300 border-t-transparent animate-spin" />
          </div>

          {/* Carousel pagination dots */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-6 sm:gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="h-1.5 w-6 rounded-full bg-white sm:w-8" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* ─── Section title + product cards ──────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-8">
        {/* Heading rows */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2 w-full max-w-xl">
            <div className="h-6 w-56 animate-pulse rounded bg-neutral-200 md:h-7 md:w-72" />
            <div className="h-4 w-full max-w-lg animate-pulse rounded bg-neutral-100" />
          </div>
        </div>

        {/* 3 product cards in a grid, or 2 on tablet / 1 on mobile */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
            >
              {/* Product image */}
              <div className="relative aspect-[4/3] w-full animate-pulse bg-gradient-to-br from-neutral-100 via-neutral-200 to-neutral-100" />

              {/* Text placeholders */}
              <div className="space-y-2.5 p-4 md:p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
