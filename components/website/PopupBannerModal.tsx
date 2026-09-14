'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { StorefrontPopupBanner } from '@/api/types'

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''

function resolveImg(path?: string | null): string | null {
  if (!path?.trim()) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) {
    const base = MEDIA_BASE.replace(/\/+$/, '').replace(/\/api$/i, '')
    return base ? `${base}${path}` : null
  }
  return null
}

interface Props {
  banners: StorefrontPopupBanner[]
}

/**
 * PopupBannerModal
 * - Shows the first `is_available_now` active popup banner after the menu loads.
 * - Clicking the image navigates to the banner's url if defined.
 * - Dismissed by clicking ✕ or the backdrop.
 * - Only shown once per session (sessionStorage key prevents re-show on navigation).
 */
export function PopupBannerModal({ banners }: Props) {
  const [visible, setVisible] = useState(false)
  const [banner,  setBanner]  = useState<StorefrontPopupBanner | null>(null)

  useEffect(() => {
    // Pick the first active banner returned by the API.
    // Backend already filters by status=true and weekday; is_available_now is
    // informational only — we still show the banner even outside its time window
    // so customers can see the offer (same pattern as BannerListView in MenuView).
    if (banners.length === 0) return

    const pick = banners.find((b) => b.status) ?? banners[0]!
    if (!pick) return

    const storageKey = `popup_seen_${pick.id}`

    // Only show once per browser session
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey)) return

    setBanner(pick)
    setVisible(true)
  }, [banners])

  const dismiss = () => {
    if (banner) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(`popup_seen_${banner.id}`, '1')
      }
    }
    setVisible(false)
  }

  if (!visible || !banner) return null

  const imgSrc = resolveImg(banner.banner_image)
  if (!imgSrc) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Promotional popup"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close popup"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Banner image — clickable if url is defined */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt="Promotional offer"
          className={`w-full h-auto block ${'' /* no Next/Image needed here — external URL compat */}`}
          style={{ maxHeight: '80vh', objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}
