'use client'

import type { SubCategory } from '@/lib/data/website-products'

interface SubCategoryNavProps {
  subCategories: SubCategory[]
  activeSubCategoryId: string
  onSelect: (subCategoryId: string) => void
}

export function SubCategoryNav({ subCategories, activeSubCategoryId, onSelect }: SubCategoryNavProps) {
  return (
    <div className="bg-[#ffffff] py-3 sticky top-[66px] z-20 sm:top-[76px] md:top-[96px] lg:top-[116px]">
      <div className="mx-auto max-w-[1400px] px-3 md:px-8 sm:px-4">
        <div className="flex gap-2 justify-start sm:justify-center overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 sm:pb-0 sm:gap-3">
          {subCategories.map((sub) => {
            const isActive = sub.id === activeSubCategoryId
            return (
              <button
                key={sub.id}
                onClick={() => onSelect(sub.id)}
                className={`snap-start shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-all sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-base md:px-6 md:py-3 ${
                  isActive
                    ? 'bg-[#ffffff] text-neutral-900'
                    : 'bg-[#fdf1d3] text-[#000000]'
                }`}
              >
                {sub.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}