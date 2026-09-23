'use client'

import { useState, useEffect } from 'react'
import { OrderTypeModal } from './OrderTypeModal'
import { useCart } from '@/lib/hooks/useCart'

/**
 * Single owner of OrderTypeModal.
 * - First visit (no location saved) -> shows modal
 * - openLocationModal() from anywhere -> shows modal
 */
export function WebsiteBootstrap() {
  const { location, locationModalOpen, closeLocationModal } = useCart()
  const [showOnce, setShowOnce] = useState(false)

  useEffect(() => {
    if (!location) setShowOnce(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (location) setShowOnce(false)
  }, [location])

  if (!(showOnce || locationModalOpen)) return null

  return (
    <OrderTypeModal
      onClose={() => {
        setShowOnce(false)
        closeLocationModal()
      }}
    />
  )
}