import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import API_ENDPOINTS from '../endpoint';
import type {
  ApiError,
  OrderCreatePayload,
  OrderCreateLine,
  CheckoutResponse,
} from '../types';

export { extractErrorMessage } from '../types';

// ─── Re-export alias so old imports keep working ──────────────────────────────
export type CheckoutPayload = OrderCreatePayload;

// ─── Place Order ──────────────────────────────────────────────────────────────
// POST /api/storefront/orders/
// Body: OrderCreatePayload (branch, area, order_type, customer details, items[])
// Response: Order object (OrderSerializer)

export function useCheckout(options?: {
  onSuccess?: (data: CheckoutResponse) => void;
  onError?: (message: string) => void;
}) {
  const mutation = useMutation<CheckoutResponse, ApiError, OrderCreatePayload>({
    mutationFn: (payload) =>
      api
        .post<CheckoutResponse>(API_ENDPOINTS.StorefrontOrders.create, payload)
        .then((r) => r.data),
    onSuccess(data) {
      toast.success('Order placed successfully!');
      options?.onSuccess?.(data);
    },
    onError(err) {
      const e = err as ApiError;
      const msg =
        typeof e.detail === 'string'
          ? e.detail
          : Array.isArray(Object.values(e)[0])
            ? (Object.values(e)[0] as string[])[0]
            : 'Failed to place order. Please try again.';
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    checkout:      mutation.mutate,
    checkoutAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Build order payload ───────────────────────────────────────────────────────
/**
 * Converts the Redux cart items array + checkout form values into the
 * one-shot OrderCreatePayload the backend expects.
 *
 * Cart items whose `id` starts with "fixed_deal_" or "on_spot_deal_" are
 * mapped to the appropriate line type; everything else is a regular "item".
 */
export function buildOrderPayload(params: {
  branch: number;
  area?: number | null;
  order_type: 'delivery' | 'pickup' | 'dinein';
  customer_name: string;
  customer_phone: string;
  customer_city?: string;
  customer_address?: string;
  customer_landmark?: string;
  customer_instructions?: string;
  is_gift?: boolean;
  send_gift?: { receipt_name: string; gift_message: string; receipt_number: string };
  cartItems: {
    id: string;
    productId: number | null;
    quantity: number;
    variantId?: number | null;
    sizeFk?: number | null;
    specialInstructions?: string;
    // deal group selections (on_spot_deal) — now populated from CartItem.groupSelections
    groupSelections?: { group: number; options: number[] }[];
  }[];
}): OrderCreatePayload {
  const safeCartItems = params.cartItems ?? [];
  const lines: OrderCreateLine[] = safeCartItems
    .map((cartItem): OrderCreateLine | null => {
      if (typeof cartItem.id === 'string' && cartItem.id.startsWith('fixed_deal_')) {
        const dealId = parseInt(cartItem.id.replace('fixed_deal_', ''), 10);
        if (!dealId) return null;
        return {
          type:     'fixed_deal',
          deal:     dealId,
          quantity: cartItem.quantity,
          notes:    cartItem.specialInstructions || '',
        };
      }

      if (typeof cartItem.id === 'string' && cartItem.id.startsWith('on_spot_deal_')) {
        const dealId = parseInt(cartItem.id.replace('on_spot_deal_', ''), 10);
        if (!dealId) return null;
        return {
          type:       'on_spot_deal',
          deal:       dealId,
          quantity:   cartItem.quantity,
          notes:      cartItem.specialInstructions || '',
          // Pass the saved group selections from the cart item
          selections: (cartItem.groupSelections ?? []).map((gs) => ({
            group:   gs.group,
            options: gs.options,
          })),
        };
      }

      // Regular menu item
      if (!cartItem.productId) return null;
      return {
        type:     'item',
        item:     cartItem.productId,
        size:     cartItem.sizeFk ?? cartItem.variantId ?? null,
        quantity: cartItem.quantity,
        notes:    cartItem.specialInstructions || '',
        addons:   [],
      };
    })
    .filter((line): line is OrderCreateLine => line !== null);

  return {
    branch:                 params.branch,
    area:                   params.area ?? null,
    order_type:             params.order_type,
    customer_name:          params.customer_name,
    customer_phone:         params.customer_phone,
    customer_city:          params.customer_city,
    customer_address:       params.customer_address,
    customer_landmark:      params.customer_landmark,
    customer_instructions:  params.customer_instructions,
    ...(params.is_gift ? {
      is_gift:   true,
      send_gift: params.send_gift,
    } : {}),
    items:                  lines,
  };
}

/** Legacy alias — keep old call-sites compiling. */
export const buildCheckoutPayload = buildOrderPayload;

// ─── Legacy compat exports ─────────────────────────────────────────────────────
export const useCheckoutGuest     = useCheckout;
export const useCheckoutLoggedIn  = useCheckout;
export const buildGuestPayload    = buildOrderPayload;
export const buildLoggedInPayload = buildOrderPayload;

// ─── Get Order detail ──────────────────────────────────────────────────────────
// GET /api/storefront/orders/<id>/
export function useGetOrder(params: { orderId: string | number | null }) {
  // Not using useQuery here — orders are fetched once on the receipt page
  // and the response is already returned from the create mutation.
  // Keeping this as a plain async helper; call it from a component effect if needed.
  const fetch = async () => {
    if (!params.orderId) return null;
    const res = await api.get<CheckoutResponse>(
      API_ENDPOINTS.StorefrontOrders.detail(params.orderId)
    );
    return res.data;
  };
  return { fetch, data: undefined as CheckoutResponse | undefined, isLoading: false, error: null };
}
