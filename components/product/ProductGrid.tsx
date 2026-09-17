'use client'

import { useEffect, useState } from 'react'
import { ProductCard, type ProductData } from './ProductCard'
import { ProductDetailModal } from './ProductDetailModal'
import { ShoppingBag } from 'lucide-react'
import { useStoreSettings } from '@/lib/hooks/useCart'

interface ProductGridProps {
  products: ProductData[]
  searchQuery: string
}

export function ProductGrid({ products, searchQuery }: ProductGridProps) {
  const [selected, setSelected] = useState<ProductData | null>(null)
  const { settings } = useStoreSettings()
  const design = (settings.product_card_design as string | undefined) ?? 'card-1'

  // card-1 = horizontal list (1→2→3→4 cols as width grows)
  // card-2/card-3 = portrait grid (2→3→4→5→6 cols, denser since cards are smaller)
  const gridClass = design === 'card-1'
    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-3 xl:gap-6'
    : 'grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-3 xl:grid-cols-5 xl:gap-6 2xl:grid-cols-6'

  useEffect(() => {
    if (!selected) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [selected])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center sm:py-16 md:py-20">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 sm:mb-4 sm:h-14 sm:w-14 md:h-16 md:w-16">
          <ShoppingBag size={20} className="text-neutral-400 sm:hidden" />
          <ShoppingBag size={24} className="text-neutral-400 hidden sm:block md:hidden" />
          <ShoppingBag size={28} className="text-neutral-400 hidden md:block" />
        </div>
        <p className="font-semibold text-neutral-700 text-sm sm:text-base">No products found</p>
        <p className="mt-1 text-xs text-neutral-400 sm:text-sm">
          {searchQuery ? `No results for "${searchQuery}"` : 'No products in this category yet'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={`${gridClass} items-stretch`}>
        {products.map((p) => (
          <div key={p.id} className="h-full">
            <ProductCard product={p} onOpen={setSelected} />
          </div>
        ))}
      </div>

      {selected && (
        <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}