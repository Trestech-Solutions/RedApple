// CategoryDesigns — shared types for all category nav variants

export type CategoryIcon =
  | { type: 'image'; value: string }
  | { type: 'iconify'; value: string }

export interface CategoryNavProps {
  categories: {
    id: string
    label: string
    icon: CategoryIcon
    badge?: string
  }[]
  activeCategoryId: string
  onSelect: (categoryId: string) => void
}
