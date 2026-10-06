'use client'

import { useStoreSettings } from '@/lib/hooks/useCart'
import { Card1 } from '@/components/CardDesigns/Card1'
import { Card2 } from '@/components/CardDesigns/Card2'
import { Card3 } from '@/components/CardDesigns/Card3'
import { Card4 } from '@/components/CardDesigns/Card4'

// Re-export types so existing importers keep working
export type { ProductData, ProductCardProps, SizeMeta } from '@/components/CardDesigns/shared'

export function ProductCard({
  product,
  onOpen,
}: import('@/components/CardDesigns/shared').ProductCardProps) {
  const { settings } = useStoreSettings()
  const design = (settings.product_card_design as string | undefined) ?? 'card-1'

  if (design === 'card-2') return <Card2 product={product} onOpen={onOpen} />
  if (design === 'card-3') return <Card3 product={product} onOpen={onOpen} />
  if (design === 'card-4') return <Card4 product={product} onOpen={onOpen} />
  return <Card1 product={product} onOpen={onOpen} />
}
