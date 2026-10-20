import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

/** One selected add-on / group-option row stored per cart item. */
export interface SelectedAddon {
  /** Group label, e.g. "Choose Your Chicken Rolls" (undefined for plain addons) */
  groupName?: string
  /** Option / addon display name */
  name: string
  /** How many of this option were selected */
  qty: number
  /** Extra charge on top of base price (0 if included) */
  extraCost?: number
}

/** Add-on picked for a regular menu item — sent as `addons` on the order line. */
export interface CartItemAddon {
  addon: number     // FoodAddon.id
  quantity: number  // per unit of the line
  /** Follow-up choice ids (FoodAddon.id from the add-on's sub_options); repeat an id to pick it twice */
  sub_addons?: number[]
}

/** Structured group selection used to build the order payload for on_spot_deals. */
export interface CartGroupSelection {
  group: number        // OnSpotDealGroup.id
  options: number[]    // selected option IDs
}

export interface CartItem {
  id: string
  productId: number | null
  cartItemId: number | null
  name: string
  price: number
  /** Pre-discount original price. When set and > price, we can show savings. */
  originalPrice?: number
  image: string
  quantity: number
  selectedOption?: string
  variantId?: number | null
  sizeFk?: number | null
  specialInstructions?: string
  dealSummary?: string
  /** Human-readable add-on/group-option rows for display in cart, checkout, and confirmation */
  selectedAddons?: SelectedAddon[]
  /** Machine-readable group selections for on_spot_deal order payload */
  groupSelections?: CartGroupSelection[]
  /** Machine-readable add-ons for a regular item order line: [{addon, quantity}] */
  itemAddons?: CartItemAddon[]
  /** Cart-row style identifier (e.g. 'highlight', 'compact') — from item.cart_style */
  cartStyle?: string
}

interface CartState {
  items: CartItem[]
  isCartOpen: boolean
  cartToken: string | null
}

const initialState: CartState = {
  items: [],
  isCartOpen: false,
  cartToken: null,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload
    },

    addItem(
      state,
      action: PayloadAction<
        Omit<CartItem, 'quantity' | 'cartItemId'> & {
          quantity?: number
          cartItemId?: number | null
          variantId?: number | null
          sizeFk?: number | null
          specialInstructions?: string
          dealSummary?: string
          selectedAddons?: SelectedAddon[]
          groupSelections?: CartGroupSelection[]
          itemAddons?: CartItemAddon[]
          originalPrice?: number
          cartStyle?: string
        }
      >
    ) {
      const { quantity = 1, cartItemId = null, ...rest } = action.payload
      const existing = state.items.find(
        (i) =>
          i.id === rest.id &&
          i.selectedOption === rest.selectedOption &&
          (i.dealSummary ?? '') === (rest.dealSummary ?? '') &&
          (i.specialInstructions ?? '') === (rest.specialInstructions ?? '') &&
          JSON.stringify(i.selectedAddons ?? []) === JSON.stringify(rest.selectedAddons ?? []) &&
          JSON.stringify(i.itemAddons ?? []) === JSON.stringify(rest.itemAddons ?? [])
      )
      if (existing) {
        existing.quantity += quantity
      } else {
        state.items.push({ ...rest, quantity, cartItemId })
      }
    },

    removeItem(
      state,
      action: PayloadAction<{
        id: string
        selectedOption?: string
        dealSummary?: string
      }>
    ) {
      const { id, selectedOption, dealSummary } = action.payload
      state.items = state.items.filter(
        (i) =>
          !(
            i.id === id &&
            i.selectedOption === selectedOption &&
            (i.dealSummary ?? '') === (dealSummary ?? '')
          )
      )
    },

    updateQuantity(
      state,
      action: PayloadAction<{
        id: string
        selectedOption?: string
        dealSummary?: string
        quantity: number
      }>
    ) {
      const { id, selectedOption, dealSummary, quantity } = action.payload
      if (quantity <= 0) {
        state.items = state.items.filter(
          (i) =>
            !(
              i.id === id &&
              i.selectedOption === selectedOption &&
              (i.dealSummary ?? '') === (dealSummary ?? '')
            )
        )
      } else {
        const item = state.items.find(
          (i) =>
            i.id === id &&
            i.selectedOption === selectedOption &&
            (i.dealSummary ?? '') === (dealSummary ?? '')
        )
        if (item) item.quantity = quantity
      }
    },

    clearCart(state) {
      state.items = []
      state.cartToken = null
    },

    setCartToken(state, action: PayloadAction<string | null>) {
      state.cartToken = action.payload
    },

    openCart(state) {
      state.isCartOpen = true
    },

    closeCart(state) {
      state.isCartOpen = false
    },
  },
})

export const {
  setItems,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setCartToken,
  openCart,
  closeCart,
} = cartSlice.actions
export default cartSlice.reducer
