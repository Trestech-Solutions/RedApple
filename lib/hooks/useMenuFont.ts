'use client'

import { useEffect } from 'react'

const LINK_ID = 'menu-font-family-link'

/** Keeps only characters that can appear in a font name; blocks CSS / URL injection from the settings value. */
function cleanName(raw: string): string {
  return raw.replace(/["'`;{}()<>\\]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Applies the store's `menu_font_family` setting site-wide.
 *
 * - Loads the first family in the list from Google Fonts (tries weights 400–700, then falls back to the
 *   font's default weight for single-weight fonts like "Permanent Marker").
 * - Overrides `--font-poppins` on <html>, which body and the product cards already use as their font,
 *   so every page (and portaled modals/drawers) picks the font up with Poppins kept as the fallback.
 * Empty / unset → Poppins stays as is.
 */
export function useMenuFont(fontFamily?: string | null) {
  useEffect(() => {
    const names = (fontFamily ?? '')
      .split(',')
      .map(cleanName)
      .filter(Boolean)
    if (names.length === 0) return

    const root = document.documentElement
    // next/font defines --font-poppins via a class, so read the computed value to keep real Poppins as fallback
    const original = getComputedStyle(root).getPropertyValue('--font-poppins').trim()
    const previous = root.style.getPropertyValue('--font-poppins')
    const stack = names.map((n) => (/^[\w-]+$/.test(n) ? n : `"${n}"`)).join(', ')
    root.style.setProperty('--font-poppins', `${stack}, ${original || 'Poppins'}, ui-sans-serif, system-ui, sans-serif`)

    // Load the primary family from Google Fonts (skip generic keywords)
    const primary = names[0]!
    const generic = ['serif', 'sans-serif', 'monospace', 'cursive', 'system-ui', 'ui-sans-serif']
    let link: HTMLLinkElement | null = null
    if (!generic.includes(primary.toLowerCase())) {
      const family = encodeURIComponent(primary).replace(/%20/g, '+')
      const build = (weights: boolean) => {
        const el = document.createElement('link')
        el.id = LINK_ID
        el.rel = 'stylesheet'
        el.href = `https://fonts.googleapis.com/css2?family=${family}${weights ? ':wght@400;500;600;700' : ''}&display=swap`
        return el
      }
      document.getElementById(LINK_ID)?.remove()
      link = build(true)
      // Single-weight fonts reject the weight range → retry with the default weight only
      link.onerror = () => {
        link?.remove()
        link = build(false)
        document.head.appendChild(link)
      }
      document.head.appendChild(link)
    }

    return () => {
      if (previous) root.style.setProperty('--font-poppins', previous)
      else root.style.removeProperty('--font-poppins')
      link?.remove()
    }
  }, [fontFamily])
}
