import { persistor } from '@/redux/store'

/**
 * Full page load (not client-side routing) so every hook re-reads cookies and
 * storage fresh — e.g. guest recent orders reappear right after sign-out.
 * Flushes redux-persist first; otherwise the reload can restore the old auth
 * state, which useCart then copies back into localStorage.
 */
export function hardNavigate(href?: string): void {
  if (typeof window === 'undefined') return
  persistor.flush().finally(() => {
    if (href) window.location.href = href
    else window.location.reload()
  })
}
