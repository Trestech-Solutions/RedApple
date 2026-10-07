'use client'

import { useStoreSettings } from '@/lib/hooks/useCart'
import { Cat1 } from '@/components/CategoryDesigns/Cat1'
import { Cat2 } from '@/components/CategoryDesigns/Cat2'
import { Cat3 } from '@/components/CategoryDesigns/Cat3'

export type { CategoryNavProps, CategoryIcon } from '@/components/CategoryDesigns/shared'

export function CategoryNav(
  props: import('@/components/CategoryDesigns/shared').CategoryNavProps
) {
  const { settings } = useStoreSettings()

  const design =
    (settings.category_design as string | undefined) ?? 'category-3'

  if (design === 'category-1') {
    return <Cat1 {...props} />
  }

  if (design === 'category-2') {
    return <Cat2 {...props} />
  }

  if (design === 'category-3') {
    return <Cat3 {...props} />
  }

  return <Cat3 {...props} />
}
