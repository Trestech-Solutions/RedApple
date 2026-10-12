'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Keeps the active category button centred inside a horizontally scrolling nav.
 * Scrolls the nav itself (not the page), so it can't fight the page scroll.
 */
export function useKeepActiveVisible(ref: RefObject<HTMLElement | null>, activeId: string | number) {
  useEffect(() => {
    const box = ref.current
    if (!box) return
    const el = box.querySelector<HTMLElement>(`[data-cat-id="${String(activeId).replace(/"/g, '\\"')}"]`)
    if (!el) return
    const left = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    box.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' })
  }, [ref, activeId])
}
