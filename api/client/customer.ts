import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect as reactUseEffect } from 'react';
import api from '../axios';
import API_ENDPOINTS from '../endpoint';
import { buildUrl } from '../utils';
import type {
  ApiError,
  RegisterPayload,
  CustomerLoginResponse,
  CustomerProfile,
  UpdateCustomerPayload,
  CustomerAddress,
  AddAddressPayload,
  UpdateAddressPayload,
  OrderHistoryItem,
  Order,
  OrderFeedbackPayload,
  ContactUsPayload,
  ComplaintPayload,
} from '../types';

export { extractErrorMessage } from '../types';

const PROFILE_QUERY_KEY = ['storefront-customer-profile'];
const ADDRESSES_QUERY_KEY = ['storefront-customer-addresses'];
const ORDER_HISTORY_QUERY_KEY = ['storefront-customer-orders'];

// ─── Login ────────────────────────────────────────────────────────────────────

export type LoginPayload = {
  restaurant: number;  // required by CustomerLoginSerializer
  phone: string;
  password: string;
};

export function useLogin(options?: {
  onSuccess?: (data: CustomerLoginResponse) => void;
  onError?: (message: string) => void;
}) {
  const mutation = useMutation<CustomerLoginResponse, ApiError, LoginPayload>({
    mutationFn: (payload) =>
      api
        .post<CustomerLoginResponse>(API_ENDPOINTS.StorefrontCustomerAuth.login, payload)
        .then((r) => r.data),
    onSuccess(data) {
      toast.success('Logged in successfully');
      options?.onSuccess?.(data);
    },
    onError(err) {
      const e = err as ApiError;
      const msg =
        e.detail ||
        (Array.isArray(Object.values(e)[0])
          ? (Object.values(e)[0] as string[])[0]
          : 'Login failed. Please check your credentials.');
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function useRegister(options?: {
  onSuccess?: (data: CustomerLoginResponse) => void;
  onError?: (message: string) => void;
}) {
  const mutation = useMutation<CustomerLoginResponse, ApiError, RegisterPayload>({
    mutationFn: (payload) =>
      api
        .post<CustomerLoginResponse>(API_ENDPOINTS.StorefrontCustomerAuth.register, payload)
        .then((r) => r.data),
    onSuccess(data) {
      toast.success('Registered successfully');
      options?.onSuccess?.(data);
    },
    onError(err) {
      const e = err as ApiError;
      const msg =
        e.detail ||
        (Array.isArray(Object.values(e)[0])
          ? (Object.values(e)[0] as string[])[0]
          : 'Registration failed. Please try again.');
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    register: mutation.mutate,
    registerAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export function useRefreshToken(options?: {
  onSuccess?: (data: { access: string; refresh?: string }) => void;
  onError?: (message: string) => void;
}) {
  const mutation = useMutation<
    { access: string; refresh?: string },
    ApiError,
    { refresh: string }
  >({
    mutationFn: (payload) =>
      api
        .post<{ access: string; refresh?: string }>(
          API_ENDPOINTS.StorefrontCustomerAuth.refreshToken,
          payload
        )
        .then((r) => r.data),
    onSuccess(data) {
      options?.onSuccess?.(data);
    },
    onError(err) {
      const msg = (err as ApiError)?.detail || 'Token refresh failed';
      options?.onError?.(msg);
    },
  });

  return {
    refreshToken: mutation.mutate,
    refreshTokenAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Get Customer (me) ────────────────────────────────────────────────────────

export function useGetMyProfile(options?: {
  onSuccess?: (data: CustomerProfile) => void;
  onError?: (message: string) => void;
  enabled?: boolean;
}) {
  const query = useQuery<CustomerProfile, ApiError>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () =>
      api
        .get<CustomerProfile>(API_ENDPOINTS.StorefrontCustomerAuth.getMyProfile)
        .then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: options?.enabled ?? true,
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]);

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load profile';
      options?.onError?.(msg);
    }
  }, [query.error]);

  return query;
}

// ─── Update Customer (me) ─────────────────────────────────────────────────────

export function useUpdateMyProfile(options?: {
  onSuccess?: (data: CustomerProfile) => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation<CustomerProfile, ApiError, UpdateCustomerPayload>({
    mutationFn: (payload) =>
      api
        .put<CustomerProfile>(
          API_ENDPOINTS.StorefrontCustomerAuth.updateMyProfile,
          payload
        )
        .then((r) => r.data),
    onSuccess(data) {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      options?.onSuccess?.(data);
    },
    onError(err) {
      const msg = (err as ApiError)?.detail || 'Failed to update profile';
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    updateProfile: mutation.mutate,
    updateProfileAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Delete Customer ──────────────────────────────────────────────────────────

export function useDeleteCustomer(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const mutation = useMutation<void, ApiError, void>({
    mutationFn: () =>
      api.delete(API_ENDPOINTS.StorefrontCustomerAuth.deleteCustomer).then(() => undefined),
    onSuccess() {
      toast.success('Account deleted');
      options?.onSuccess?.();
    },
    onError(err) {
      const msg = (err as ApiError)?.detail || 'Failed to delete account';
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    deleteCustomer: mutation.mutate,
    deleteCustomerAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Get Addresses ────────────────────────────────────────────────────────────

export function useGetAddresses(options?: {
  onSuccess?: (data: CustomerAddress[]) => void;
  onError?: (message: string) => void;
  enabled?: boolean;
}) {
  const query = useQuery<CustomerAddress[], ApiError>({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: () =>
      api
        .get<{ results?: CustomerAddress[] } | CustomerAddress[]>(
          API_ENDPOINTS.StorefrontCustomerAuth.getAddresses
        )
        .then((r) => {
          const data = r.data as { results?: CustomerAddress[] } | CustomerAddress[];
          return Array.isArray(data) ? data : data.results ?? [];
        }),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    enabled: options?.enabled ?? true,
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]);

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load addresses';
      options?.onError?.(msg);
    }
  }, [query.error]);

  return query;
}

// ─── Add Address ──────────────────────────────────────────────────────────────

export function useAddAddress(options?: {
  onSuccess?: (data: CustomerAddress) => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation<CustomerAddress, ApiError, AddAddressPayload>({
    mutationFn: (payload) =>
      api
        .post<CustomerAddress>(API_ENDPOINTS.StorefrontCustomerAuth.addAddress, payload)
        .then((r) => r.data),
    onSuccess(data) {
      toast.success('Address added');
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
      options?.onSuccess?.(data);
    },
    onError(err) {
      const msg = (err as ApiError)?.detail || 'Failed to add address';
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    addAddress: mutation.mutate,
    addAddressAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Update Address ───────────────────────────────────────────────────────────

export function useUpdateAddress(options?: {
  onSuccess?: (data: CustomerAddress) => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    CustomerAddress,
    ApiError,
    { customer_address_id: string | number; payload: UpdateAddressPayload }
  >({
    mutationFn: ({ customer_address_id, payload }) =>
      api
        .patch<CustomerAddress>(
          buildUrl(API_ENDPOINTS.StorefrontCustomerAuth.updateAddress, {
            customer_address_id,
          }),
          payload
        )
        .then((r) => r.data),
    onSuccess(data) {
      toast.success('Address updated');
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
      options?.onSuccess?.(data);
    },
    onError(err) {
      const msg = (err as ApiError)?.detail || 'Failed to update address';
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    updateAddress: mutation.mutate,
    updateAddressAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Delete Address ───────────────────────────────────────────────────────────

export function useDeleteAddress(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    void,
    ApiError,
    { customer_address_id: string | number }
  >({
    mutationFn: ({ customer_address_id }) =>
      api
        .delete(
          buildUrl(API_ENDPOINTS.StorefrontCustomerAuth.deleteAddress, {
            customer_address_id,
          })
        )
        .then(() => undefined),
    onSuccess() {
      toast.success('Address deleted');
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
      options?.onSuccess?.();
    },
    onError(err) {
      const msg = (err as ApiError)?.detail || 'Failed to delete address';
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    deleteAddress: mutation.mutate,
    deleteAddressAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Get Order History ────────────────────────────────────────────────────────

/**
 * Normalize the raw Order object returned by `/storefront/customers/orders/`
 * into the flat `OrderHistoryItem` shape that the list UI expects.
 *
 * Backend sends a full `Order` serializer with keys like `order_number`,
 * `created_at`, `grand_total`; the list consumes `order_no`, `placed_at`,
 * `total`, etc. This bridges the two WITHOUT any backend changes.
 */
function normalizeOrderHistoryEntry(raw: any): OrderHistoryItem {
  const r = (raw ?? {}) as any;
  // Order id + numbering
  const id       = Number(r.id) || 0;
  const orderNo  = String(r.order_no ?? r.order_number ?? r.order_no ?? `#${id}`);
  // Dates
  const placedAt = String(r.placed_at ?? r.created_at ?? '');
  const estDel   = r.estimated_delivery_at ?? null;
  const delAt    = r.delivered_at ?? null;
  // Totals — prefer grand_total, fall back to total
  const total    = String(
    r.total ?? r.grand_total ?? r.subtotal ?? '0',
  );
  // Order meta
  const orderType    = String(r.order_type ?? '');
  const branchName   = r.branch_name ?? null;
  const statusRaw    = String(r.status ?? 'Pending');
  // Normalize status capitalization so isActiveOrder() Set checks match
  const status = statusRaw.length > 0
    ? statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase()
    : 'Pending';
  // Payment method may or may not be present on the history serializer —
  // fall back to a sensible placeholder instead of `undefined` so the row
  // doesn't render an empty string.
  const paymentMethod = String(
    r.payment_method ?? r.paymentMode ?? r.payment ?? '—',
  );
  // Item count from nested items array (present in the full serializer) or
  // the dedicated items_count field if the backend ever adds it.
  const itemsCount = Number.isFinite(Number(r.items_count))
    ? Number(r.items_count)
    : Array.isArray(r.items) ? r.items.length : 0;

  return {
    id,
    order_no:              orderNo,
    order_type:            orderType,
    status,
    total,
    placed_at:             placedAt,
    estimated_delivery_at: estDel,
    delivered_at:          delAt,
    branch_name:           branchName,
    payment_method:        paymentMethod,
    items_count:           itemsCount,
  };
}

export function useGetOrderHistory(options?: {
  onSuccess?: (data: OrderHistoryItem[]) => void;
  onError?: (message: string) => void;
  enabled?: boolean;
  userId?: string | number | null;
}) {
  const query = useQuery<OrderHistoryItem[], ApiError>({
    // Scope the cache key per user so switching accounts or logging in/out
    // always fetches fresh data instead of reusing a stale/errored result.
    queryKey: [...ORDER_HISTORY_QUERY_KEY, options?.userId ?? 'me'],
    queryFn: () =>
      api
        .get<{ results?: any[] } | any[]>(
          API_ENDPOINTS.StorefrontCustomerAuth.getOrderHistory
        )
        .then((r) => {
          const raw = r.data as { results?: any[] } | any[];
          const list: any[] = Array.isArray(raw) ? raw : raw.results ?? [];
          return list.map(normalizeOrderHistoryEntry);
        }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    enabled: options?.enabled ?? true,
    retry: false,   // Don't retry 401/403 — user simply isn't logged in
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]);

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load order history';
      options?.onError?.(msg);
    }
  }, [query.error]);

  return query;
}

// ─── Legacy helpers (getCustomer / updateCustomer / deleteCustomer) ───────────

export function useGetCustomer(options?: {
  onSuccess?: (data: CustomerProfile) => void;
  onError?: (message: string) => void;
}) {
  return useGetMyProfile(options);
}

export function useUpdateCustomer(options?: {
  onSuccess?: (data: CustomerProfile) => void;
  onError?: (message: string) => void;
}) {
  return useUpdateMyProfile(options);
}

// ─── Submit Contact-Us Message ────────────────────────────────────────────────

export function useSubmitContactUs(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const mutation = useMutation<{ id: number }, ApiError, ContactUsPayload>({
    mutationFn: (payload) =>
      api
        .post<{ id: number }>(API_ENDPOINTS.StorefrontPublic.contactUs, payload)
        .then((r) => r.data),
    onSuccess() {
      toast.success('Your message has been sent. We will get back to you shortly.');
      options?.onSuccess?.();
    },
    onError(err) {
      const msg = (err as ApiError)?.detail || 'Failed to send message. Please try again.';
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    submitContactUs: mutation.mutate,
    submitContactUsAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Submit Complaint ─────────────────────────────────────────────────────────

export function useSubmitComplaint(options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) {
  const mutation = useMutation<{ id: number }, ApiError, ComplaintPayload>({
    mutationFn: (payload) =>
      api
        .post<{ id: number }>(API_ENDPOINTS.StorefrontPublic.complaints, payload)
        .then((r) => r.data),
    onSuccess() {
      toast.success('Your complaint has been submitted. Our team will review it shortly.');
      options?.onSuccess?.();
    },
    onError(err) {
      const msg = (err as ApiError)?.detail || 'Failed to submit complaint. Please try again.';
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    submitComplaint: mutation.mutate,
    submitComplaintAsync: mutation.mutateAsync,
    ...mutation,
  };
}

// ─── Submit Order Feedback ────────────────────────────────────────────────────

export function useSubmitOrderFeedback(
  orderId: number | string,
  options?: {
    onSuccess?: (order: Order) => void;
    onError?: (message: string) => void;
  }
) {
  const queryClient = useQueryClient();

  const mutation = useMutation<Order, ApiError, OrderFeedbackPayload>({
    mutationFn: (payload) =>
      api
        .patch<Order>(API_ENDPOINTS.StorefrontOrders.feedback(orderId), payload)
        .then((r) => r.data),
    onSuccess(order) {
      toast.success('Thank you for your feedback!');
      // Invalidate order detail so the updated stars/comment reflect
      queryClient.invalidateQueries({ queryKey: ['storefront-order', String(orderId)] });
      queryClient.invalidateQueries({ queryKey: ORDER_HISTORY_QUERY_KEY });
      options?.onSuccess?.(order);
    },
    onError(err) {
      const msg = (err as ApiError)?.detail || 'Failed to submit feedback. Please try again.';
      toast.error(msg);
      options?.onError?.(msg);
    },
  });

  return {
    submitFeedback: mutation.mutate,
    submitFeedbackAsync: mutation.mutateAsync,
    ...mutation,
  };
}
