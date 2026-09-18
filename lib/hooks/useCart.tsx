'use client'

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'
import { toast } from 'sonner'
import { getCartToken, setCartToken as persistToken } from '@/api/utils'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
  addItem as reduxAddItem,
  removeItem as reduxRemoveItem,
  updateQuantity as reduxUpdateQuantity,
  clearCart as reduxClearCart,
  setCartToken as reduxSetCartToken,
  setItems as reduxSetItems,
  openCart as reduxOpenCart,
  closeCart as reduxCloseCart,
  type CartItem,
} from '@/redux/slices/cartSlice'
import {
  setUser as reduxSetUser,
  logout as reduxLogout,
  type AuthUser,
} from '@/redux/slices/authSlice'
import {
  setOrderType as reduxSetOrderType,
  setLocation as reduxSetLocation,
  setBranch as reduxSetBranch,
  setAreaId as reduxSetAreaId,
  openLocationModal as reduxOpenLocationModal,
  closeLocationModal as reduxCloseLocationModal,
  type OrderType,
} from '@/redux/slices/orderSlice'
import { useGetSettings, useGetMenu } from '@/api/client/browse'
import type { StoreSettings } from '@/api/types'
import { useStoreLocation } from './useStoreLocation'
import { useEffect } from 'react'

export type { CartItem, AuthUser, OrderType }

export interface SavedAddress {
  id: string
  line1: string
  city: string
}

interface CartContextType {
  user: AuthUser | null
  setUser: (u: AuthUser | null) => void

  addresses: SavedAddress[]
  addAddress: (a: Omit<SavedAddress, 'id'>) => void
  removeAddress: (id: string) => void

  orderType: OrderType
  setOrderType: (type: OrderType) => void
  location: string
  setLocation: (loc: string) => void
  branch: string
  setBranch: (b: string | number) => void
  branchId: number | null
  areaId: number | null
  setAreaId: (id: number | null) => void

  locationModalOpen: boolean
  openLocationModal: () => void
  closeLocationModal: () => void

  items: CartItem[]
  addItem: (
    item: Omit<CartItem, 'quantity' | 'cartItemId'> & {
      variantId?: number | null
      sizeFk?: number | null
      specialInstructions?: string
      dealSummary?: string
      quantity?: number
    }
  ) => void
  removeItem: (item: CartItem) => void
  updateQuantity: (item: CartItem, quantity: number) => void
  clearCart: () => void
  isCartLoading: boolean

  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void

  totalItems: number
  subtotal: number
  cartToken: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function generateCartToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'local-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()

  const user             = useAppSelector((s) => s.auth.user)
  const reduxItems       = useAppSelector((s) => s.cart.items)
  const isCartOpen       = useAppSelector((s) => s.cart.isCartOpen)
  const reduxCartToken   = useAppSelector((s) => s.cart.cartToken)
  const orderType        = useAppSelector((s) => s.order.orderType)
  const location         = useAppSelector((s) => s.order.location)
  const branch           = useAppSelector((s) => s.order.branch)
  const branchId         = useAppSelector((s) => s.order.branchId)
  const areaId           = useAppSelector((s) => s.order.areaId)
  const locationModalOpen = useAppSelector((s) => s.order.locationModalOpen)

  const addresses: SavedAddress[] = []

  const setUser = useCallback(
    (u: AuthUser | null) => {
      if (u) dispatch(reduxSetUser(u))
      else dispatch(reduxLogout())
    },
    [dispatch]
  )

  const setOrderType = useCallback(
    (type: OrderType) => dispatch(reduxSetOrderType(type)),
    [dispatch]
  )
  const setLocation = useCallback(
    (loc: string) => {
      dispatch(reduxSetLocation(loc))
      dispatch(reduxSetItems([]))
      dispatch(reduxSetCartToken(null))
      persistToken(null)
    },
    [dispatch]
  )
  const setBranch  = useCallback((b: string | number) => dispatch(reduxSetBranch(b)), [dispatch])
  const setAreaId  = useCallback((id: number | null) => dispatch(reduxSetAreaId(id)), [dispatch])

  const numericBranch      = branchId ?? (branch ? Number(branch) : undefined)
  const numericBranchValid = numericBranch !== undefined && !isNaN(numericBranch)

  const addItem = useCallback(
    (
      item: Omit<CartItem, 'quantity' | 'cartItemId'> & {
        variantId?: number | null
        sizeFk?: number | null
        specialInstructions?: string
        quantity?: number
      }
    ) => {
      const requestedQty = item.quantity ?? 1

      // Deals use string ids like "fixed_deal_1" / "on_spot_deal_1"
      const isDeal =
        typeof item.id === 'string' &&
        (item.id.startsWith('fixed_deal_') || item.id.startsWith('on_spot_deal_'))

      const coercedId        = Number(item.id)
      const numericProductId = Number.isFinite(coercedId) && coercedId > 0 ? coercedId : null

      if (!numericBranchValid) {
        toast.error('Please select a branch first')
        dispatch(reduxOpenLocationModal())
        return
      }

      // Deals don't have a numeric product id — they are identified by their
      // string id prefix. Allow them through without the numeric check.
      if (!isDeal && numericProductId === null) {
        toast.error('This item is not available for ordering yet')
        return
      }

      dispatch(reduxAddItem({ ...item, quantity: requestedQty, cartItemId: null }))
      toast.success('Item added to cart')
      dispatch(reduxOpenCart())
    },
    [dispatch, numericBranchValid]
  )

  const removeItem = useCallback(
    (item: CartItem) => {
      dispatch(reduxRemoveItem({ id: item.id, selectedOption: item.selectedOption }))
      toast.success('Item removed from cart')
    },
    [dispatch]
  )

  const updateQuantity = useCallback(
    (item: CartItem, quantity: number) => {
      dispatch(
        reduxUpdateQuantity({ id: item.id, selectedOption: item.selectedOption, quantity })
      )
    },
    [dispatch]
  )

  const clearCart = useCallback(() => {
    dispatch(reduxClearCart())
    persistToken(null)
  }, [dispatch])

  const items: CartItem[] = reduxItems

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal   = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  let effectiveCartToken = reduxCartToken ?? getCartToken()
  if (!effectiveCartToken && items.length > 0) {
    effectiveCartToken = generateCartToken()
    dispatch(reduxSetCartToken(effectiveCartToken))
    persistToken(effectiveCartToken)
  }
  const cartToken = effectiveCartToken

  const value: CartContextType = {
    user,
    setUser,
    addresses,
    addAddress:  () => {},
    removeAddress: () => {},
    orderType,
    setOrderType,
    location,
    setLocation,
    branch,
    setBranch,
    branchId,
    areaId,
    setAreaId,
    locationModalOpen,
    openLocationModal:  () => dispatch(reduxOpenLocationModal()),
    closeLocationModal: () => dispatch(reduxCloseLocationModal()),
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isCartLoading: false,
    isCartOpen,
    openCart:  () => dispatch(reduxOpenCart()),
    closeCart: () => dispatch(reduxCloseCart()),
    totalItems,
    subtotal,
    cartToken,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function useRegisterProductId() {
  return (_clientId: string, _numericId: number) => {}
}

// ──────────────────────────────────────────────────────────────────────────
// StoreSettingsProvider — exposes the StoreSettings API response globally
// with numeric helpers + sensible defaults.
// ──────────────────────────────────────────────────────────────────────────

export const DEFAULT_DELIVERY_FEE   = 200
export const DEFAULT_TAX_RATE       = 0.18

/** Helper: parse a setting that may be "100" (string) or 100 (number) or ""/null → fallback */
function toNumber(
  v: string | number | null | undefined,
  fallback: number,
): number {
  if (v === null || v === undefined || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export interface StoreSettingsDerived extends StoreSettings {
  /** delivery_charges parsed as number; fallback = 0 (use caller's default if needed) */
  deliveryFee: number
  /** packaging_charge parsed as number; fallback = 0 */
  packagingCharge: number
  /** convenience_fee parsed as number; fallback = 0 */
  convenienceFee: number
  /** free_delivery_above_subtotal parsed as number; Infinity means "never free" */
  freeDeliveryAboveSubtotal: number
  /** Tax PERCENTAGE rate parsed from `tax_number` field (e.g. "18" → 0.18).
   *  Falls back to DEFAULT_TAX_RATE when field is empty/invalid. */
  taxPercentageRate: number
  /** Tax rate for cash/COD orders as a multiplier (e.g. 0.18 for 18%). 0 = no cash tax. */
  cashTaxRate: number
  /** Tax rate for card/online orders as a multiplier (e.g. 0.18 for 18%). 0 = no card tax. */
  cardTaxRate: number
  /** delivery_time parsed as number (minutes) — global/legacy */
  deliveryTimeMinutes: number | null
  /** pickup_time parsed as number (minutes) — global/legacy */
  pickupTimeMinutes: number | null
  /** dinein_time parsed as number (minutes) — global/legacy */
  dineinTimeMinutes: number | null

  // ─── Branch-level / per-mode numeric helpers ─────────────────────────────

  daysForwardForAlwaysPreorder: number | null
  timeSlotDifferenceMinutes: number | null

  /** Delivery mode — Regular (non-preorder): delivery time minutes */
  deliveryDeliveryTimeMinutes: number | null
  /** Delivery mode — Regular (non-preorder): pickup time minutes */
  deliveryPickupTimeMinutes: number | null
  /** Delivery mode — Regular (non-preorder): dinein time minutes */
  deliveryDineinTimeMinutes: number | null
  deliveryMinimumOrder: number | null

  /** Preorder mode: delivery time minutes */
  preorderDeliveryTimeMinutes: number | null
  /** Preorder mode: pickup time minutes */
  preorderPickupTimeMinutes: number | null
  /** Preorder mode: dinein time minutes */
  preorderDineinTimeMinutes: number | null
  preorderMinimumOrder: number | null
}

interface StoreSettingsContextType {
  settings: StoreSettingsDerived
  /** Is the settings request still loading? */
  isLoading: boolean
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined)

function toPositiveNumberOrNull(
  v: string | number | null | undefined,
): number | null {
  const n = toNumber(v, NaN)
  return Number.isFinite(n) && n > 0 ? n : null
}

function deriveSettings(raw: StoreSettings | undefined): StoreSettingsDerived {
  const r = (raw ?? {}) as StoreSettings

  // Parse tax percentage from `tax_number` field:
  //   e.g. "18" → 18% → multiplier 0.18
  //   Also supports NUMBER (15) or STRING NUMBER ("15") —
  //   we coerce to string first to avoid .trim() TypeError.
  //   Empty, null, or invalid → fall back to DEFAULT_TAX_RATE (0.18).
  const taxPercentNum = (() => {
    const raw = r.tax_number
    if (raw === null || raw === undefined) return NaN
    const s = String(raw).trim()
    if (!s) return NaN
    const n = Number(s)
    return Number.isFinite(n) ? n : NaN
  })()
  const taxPercentageRate = Number.isFinite(taxPercentNum)
    ? taxPercentNum / 100
    : DEFAULT_TAX_RATE

  return {
    ...r,
    deliveryFee:               toNumber(r.delivery_charges, 0),
    packagingCharge:           toNumber(r.packaging_charge, 0),
    convenienceFee:            toNumber(r.convenience_fee, 0),
    freeDeliveryAboveSubtotal: (() => {
      const n = toNumber(r.free_delivery_above_subtotal, NaN)
      return Number.isFinite(n) && n > 0 ? n : Infinity
    })(),
    taxPercentageRate,
    cashTaxRate: (() => {
      const n = toNumber(r.cash_tax, NaN)
      return Number.isFinite(n) && n > 0 ? n / 100 : 0
    })(),
    cardTaxRate: (() => {
      const n = toNumber(r.card_tax, NaN)
      return Number.isFinite(n) && n > 0 ? n / 100 : 0
    })(),
    deliveryTimeMinutes: toPositiveNumberOrNull(r.delivery_time),
    pickupTimeMinutes:   toPositiveNumberOrNull(r.pickup_time),
    dineinTimeMinutes:   toPositiveNumberOrNull(r.dinein_time),

    daysForwardForAlwaysPreorder: toPositiveNumberOrNull(r.days_forward_for_always_preorder),
    timeSlotDifferenceMinutes:    toPositiveNumberOrNull(r.time_slot_difference_minutes),

    deliveryDeliveryTimeMinutes: toPositiveNumberOrNull(r.delivery_delivery_time),
    deliveryPickupTimeMinutes:   toPositiveNumberOrNull(r.delivery_pickup_time),
    deliveryDineinTimeMinutes:   toPositiveNumberOrNull(r.delivery_dinein_time),
    deliveryMinimumOrder:        toPositiveNumberOrNull(r.delivery_minimum_order),

    preorderDeliveryTimeMinutes: toPositiveNumberOrNull(r.preorder_delivery_time),
    preorderPickupTimeMinutes:   toPositiveNumberOrNull(r.preorder_pickup_time),
    preorderDineinTimeMinutes:   toPositiveNumberOrNull(r.preorder_dinein_time),
    preorderMinimumOrder:        toPositiveNumberOrNull(r.preorder_minimum_order),
  }
}

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const { branchId, areaId } = useCart()
  const { data, isLoading } = useGetSettings({ branchId, areaId })
  const menuQuery = useGetMenu({ branchId, areaId })
  const { setBranchDetails } = useStoreLocation()

  useEffect(() => {
    const branch = menuQuery.data?.branch
    if (branch) {
      const bLocation = branch.location ?? ''
      const bAddress = branch.address ?? bLocation
      const bMap = branch.map_location ?? ''
      const bPhone = branch.phone ?? ''
      setBranchDetails({
        branchLocation: bLocation,
        branchAddress: bAddress,
        branchMapLocation: bMap,
        branchPhone: bPhone,
      })
    }
  }, [menuQuery.data?.branch]) // eslint-disable-line react-hooks/exhaustive-deps

  const derived = useMemo(() => deriveSettings(data), [data])
  const value = useMemo<StoreSettingsContextType>(
    () => ({ settings: derived, isLoading }),
    [derived, isLoading],
  )
  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext)
  if (!ctx) throw new Error('useStoreSettings must be used within StoreSettingsProvider')
  return ctx
}
