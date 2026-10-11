'use client'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store'

/**
 * `fallback` is shown until the persisted cart is restored from localStorage.
 * It's also what the server renders (rehydration only happens in the browser),
 * so pass a skeleton here — with `null` the prerendered HTML was blank and
 * phones stared at a white screen until all JS had loaded.
 */
export function ReduxProvider({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <Provider store={store}>
      <PersistGate loading={fallback} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
