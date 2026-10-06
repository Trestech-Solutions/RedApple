'use client'

import { useStoreSettings } from '@/lib/hooks/useCart'
import { Modal1 } from '@/components/OrderTypeModalDesigns/Modal1'
import { Modal2 } from '@/components/OrderTypeModalDesigns/Modal2'
import { Modal3 } from '@/components/OrderTypeModalDesigns/Modal3'

// Re-export legacy type & constant so existing importers keep working
export type { BranchInfo } from '@/components/OrderTypeModalDesigns/_hooks'
export { FALLBACK_BRANCHES, UK_BRANCHES } from '@/components/OrderTypeModalDesigns/_hooks'

interface OrderTypeModalProps {
  onClose: () => void
}

export function OrderTypeModal({ onClose }: OrderTypeModalProps) {
  const { settings } = useStoreSettings()
  const design = (settings.order_modal_design as string | undefined) ?? 'modal-1'

  if (design === 'modal-2') return <Modal2 onClose={onClose} />
  if (design === 'modal-3') return <Modal3 onClose={onClose} />
  return <Modal1 onClose={onClose} />
}
