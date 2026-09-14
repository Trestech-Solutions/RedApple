import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../axios';
import API_ENDPOINTS from '../endpoint';
import { getRestaurantId } from '../utils';
import type {
  ApiError,
  Branch,
  Area,
  City,
  MenuResponse,
  LocateResponse,
  FixedDeal,
  FixedDealListParams,
  OnSpotDeal,
  OnSpotDealListParams,
  StoreSettings,
  BranchByCity,
} from '../types';
import { useEffect as reactUseEffect } from 'react';

export { extractErrorMessage } from '../types';

// ─── Small helpers to normalise dual-naming (branch vs branch_id) in City/Area

export function resolveBranchId(
  obj: { branch?: number | string; branch_id?: number | string } | undefined | null,
): number | undefined {
  if (!obj) return undefined;
  if (obj.branch_id !== undefined && obj.branch_id !== null && obj.branch_id !== '') {
    const n = Number(obj.branch_id);
    if (!isNaN(n)) return n;
  }
  if (obj.branch !== undefined && obj.branch !== null && obj.branch !== '') {
    const n = Number(obj.branch);
    if (!isNaN(n)) return n;
  }
  return undefined;
}

// ─── Branches ─────────────────────────────────────────────────────────────────

export function useGetBranches(options?: {
  restaurantId?: string | number;
  onSuccess?: (data: Branch[]) => void;
  onError?: (message: string) => void;
}) {
  const restaurantId = options?.restaurantId ?? getRestaurantId();

  const query = useQuery<Branch[], ApiError>({
    queryKey: ['storefront-branches', restaurantId],
    queryFn: () =>
      api
        .get<{ results?: Branch[] } | Branch[]>(
          API_ENDPOINTS.StorefrontBrowse.getBranches,
          { params: { restaurant: restaurantId } }
        )
        .then((r) => {
          const data = r.data as { results?: Branch[] } | Branch[];
          return Array.isArray(data) ? data : data.results ?? [];
        }),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load branches';
      toast.error(msg);
      options?.onError?.(msg);
    }
  }, [query.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}

// ─── Branches by City ─────────────────────────────────────────────────────────
// GET /storefront/branches/by-city/?cityId=<id>
// Returns [{branchId, name}] for pickup branch selection after city is chosen.

export function useGetBranchesByCity(options: {
  cityId: string | number | null;
  onSuccess?: (data: BranchByCity[]) => void;
  onError?: (message: string) => void;
}) {
  const query = useQuery<BranchByCity[], ApiError>({
    queryKey: ['storefront-branches-by-city', options.cityId],
    queryFn: () =>
      api
        .get<BranchByCity[] | { results?: BranchByCity[] }>(
          API_ENDPOINTS.StorefrontBrowse.getBranchesByCity,
          { params: { cityId: options.cityId } }
        )
        .then((r) => {
          const data = r.data as BranchByCity[] | { results?: BranchByCity[] };
          return Array.isArray(data) ? data : data.results ?? [];
        }),
    enabled: !!options.cityId,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load branches';
      toast.error(msg);
      options?.onError?.(msg);
    }
  }, [query.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}

// ─── Cities — filtered by branch_id (NEW correct flow) ───────────────────────

export function useGetCitiesByBranch(options: {
  branchId: number | string | null | undefined;
  onSuccess?: (data: City[]) => void;
  onError?: (message: string) => void;
}) {
  const enabled = !!options.branchId;

  const query = useQuery<City[], ApiError>({
    queryKey: ['storefront-cities-by-branch', options.branchId],
    queryFn: () =>
      api
        .get<{ results?: City[] } | City[]>(
          API_ENDPOINTS.StorefrontBrowse.getCities,
          { params: { branch: options.branchId } }
        )
        .then((r) => {
          const data = r.data as { results?: City[] } | City[];
          return Array.isArray(data) ? data : data.results ?? [];
        }),
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load cities';
      toast.error(msg);
      options?.onError?.(msg);
    }
  }, [query.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}

// ─── Areas — filtered by city_id (NEW correct flow) ──────────────────────────

export function useGetAreasByCity(options: {
  cityId: number | string | null | undefined;
  onSuccess?: (data: Area[]) => void;
  onError?: (message: string) => void;
}) {
  const enabled = !!options.cityId;

  const query = useQuery<Area[], ApiError>({
    queryKey: ['storefront-areas-by-city', options.cityId],
    queryFn: () =>
      api
        .get<{ results?: Area[] } | Area[]>(
          API_ENDPOINTS.StorefrontBrowse.getAreas,
          { params: { city: options.cityId } }
        )
        .then((r) => {
          const data = r.data as { results?: Area[] } | Area[];
          return Array.isArray(data) ? data : data.results ?? [];
        }),
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load delivery areas';
      toast.error(msg);
      options?.onError?.(msg);
    }
  }, [query.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}

// ─── Area Detail — fetch one area by ID (returns branch_id) ────────────────────

/**
 * Imperative helper: fetch `/storefront/areas/<id>/` and return the detail.
 * This extracts the canonical `branch_id` for an area (per user flow: pick area →
 * call detail API → read branch_id → save to Redux → use in /menu/?branch=X&area=Y).
 */
export async function fetchAreaDetail(areaId: number | string): Promise<Area> {
  const res = await api.get<Area>(API_ENDPOINTS.StorefrontBrowse.getAreaDetail(areaId));
  return res.data;
}

export function useGetAreaDetail(
  areaId: number | string | null | undefined,
  options?: {
    onSuccess?: (data: Area) => void;
    onError?: (message: string) => void;
  }
) {
  const enabled = !!areaId && areaId !== '';

  const query = useQuery<Area, ApiError>({
    queryKey: ['storefront-area-detail', areaId],
    queryFn: () => fetchAreaDetail(areaId!),
    enabled,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 90,
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load area details';
      toast.error(msg);
      options?.onError?.(msg);
    }
  }, [query.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}

// ─── Legacy hooks (kept for backward compat — not used by OrderTypeModal) ─────

export function useGetAreas(options?: {
  restaurantId?: string | number;
  branchId?: string | number;
  onSuccess?: (data: Area[]) => void;
  onError?: (message: string) => void;
}) {
  const restaurantId = options?.restaurantId ?? getRestaurantId();

  const query = useQuery<Area[], ApiError>({
    queryKey: ['storefront-areas', restaurantId, options?.branchId],
    queryFn: () => {
      const params: Record<string, string | number> = { restaurant: restaurantId }
      if (options?.branchId) params.branch = options.branchId
      return api
        .get<{ results?: Area[] } | Area[]>(
          API_ENDPOINTS.StorefrontBrowse.getAreas,
          { params }
        )
        .then((r) => {
          const data = r.data as { results?: Area[] } | Area[];
          return Array.isArray(data) ? data : data.results ?? [];
        })
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load delivery areas';
      toast.error(msg);
      options?.onError?.(msg);
    }
  }, [query.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}

export function useGetCities(options?: {
  restaurantId?: string | number;
  onSuccess?: (data: City[]) => void;
  onError?: (message: string) => void;
}) {
  const restaurantId = options?.restaurantId ?? getRestaurantId();

  const query = useQuery<City[], ApiError>({
    queryKey: ['storefront-cities', restaurantId],
    queryFn: () =>
      api
        .get<{ results?: City[] } | City[]>(
          API_ENDPOINTS.StorefrontBrowse.getCities,
          { params: { restaurant: restaurantId } }
        )
        .then((r) => {
          const data = r.data as { results?: City[] } | City[];
          return Array.isArray(data) ? data : data.results ?? [];
        }),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  reactUseEffect(() => {
    if (query.data && options?.onSuccess) options.onSuccess(query.data);
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load cities';
      toast.error(msg);
      options?.onError?.(msg);
    }
  }, [query.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}

// ─── Menu ──────────────────────────────────────────────────────────────────────

const FALLBACK_BRANCH = 1;
const FALLBACK_AREA   = 1;

export function useGetMenu(params: {
  branchId: string | number | null;
  areaId?: string | number | null;
  onSuccess?: (data: MenuResponse) => void;
  onError?: (message: string) => void;
}) {
  // Treat NaN as null so we fall back to safe defaults
  const rawBranch = typeof params.branchId === 'number' && isNaN(params.branchId) ? null : params.branchId;
  const rawArea   = typeof params.areaId   === 'number' && isNaN(params.areaId)   ? null : params.areaId;

  // Use fallbacks when branch is unavailable.
  // Area: only fall back when rawArea is undefined (not set at all).
  // null means "no area" (e.g. pickup mode) — pass through as-is.
  const resolvedBranch = rawBranch ?? FALLBACK_BRANCH;
  const resolvedArea   = rawArea === undefined ? FALLBACK_AREA : rawArea;

  const enabled = true; // always fetch — we always have a resolved branch

  const query = useQuery<MenuResponse, ApiError>({
    queryKey: ['storefront-menu', resolvedBranch, resolvedArea],
    queryFn: () => {
      const queryParams: Record<string, string | number> = {
        branch: resolvedBranch,
      }
      if (resolvedArea !== null && resolvedArea !== undefined) {
        queryParams.area = resolvedArea
      }
      return api
        .get<MenuResponse>(API_ENDPOINTS.StorefrontBrowse.getMenu, { params: queryParams })
        .then((r) => {
          const data = r.data
          if (!data.menu && (data as any).categories) {
            data.menu = (data as any).categories
          }
          if (!data.menu) data.menu = []
          return data
        })
    },
    enabled,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  reactUseEffect(() => {
    if (query.data && params.onSuccess) params.onSuccess(query.data);
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  reactUseEffect(() => {
    if (query.error) {
      const msg = (query.error as ApiError)?.detail || 'Failed to load menu';
      toast.error(msg);
      params.onError?.(msg);
    }
  }, [query.error]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}

// ─── Locate ───────────────────────────────────────────────────────────────────

export async function locate(
  lat: number,
  lng: number,
  options?: { restaurantId?: string | number }
): Promise<LocateResponse> {
  const restaurantId = options?.restaurantId ?? getRestaurantId();
  const params: Record<string, string | number> = { lat, lng };
  if (restaurantId) params.restaurant = restaurantId;
  const r = await api.get<LocateResponse>(API_ENDPOINTS.StorefrontBrowse.locate, { params });
  return r.data;
}

// ─── Store Settings ──────────────────────────────────────────────────────────
// Backend does not expose a dedicated /settings endpoint; instead the global
// settings live inside MenuResponse.settings. This hook piggy-backs on useGetMenu
// and extracts just the settings block, reusing the react-query cache so we
// never issue a duplicate /menu/ request for the same branch+area.

export function useGetSettings(params?: {
  branchId?: string | number | null
  areaId?: string | number | null
  onSuccess?: (data: StoreSettings) => void
  onError?: (message: string) => void
}) {
  const bid = params?.branchId ?? null
  const aid = params?.areaId ?? null

  const menu = useGetMenu({
    branchId: bid,
    areaId: aid,
  })

  reactUseEffect(() => {
    if (menu.data?.settings && params?.onSuccess) {
      params.onSuccess(menu.data.settings)
    }
  }, [menu.data]) // eslint-disable-line react-hooks/exhaustive-deps

  reactUseEffect(() => {
    if (menu.error && params?.onError) {
      const msg = (menu.error as ApiError)?.detail || 'Failed to load settings'
      params.onError(msg)
    }
  }, [menu.error]) // eslint-disable-line react-hooks/exhaustive-deps

  const baseSettings = menu.data?.settings ?? ({} as StoreSettings)
  const branchSettings = menu.data?.branch_settings ?? ({} as Partial<StoreSettings>)
  const settings = { ...baseSettings, ...branchSettings } as StoreSettings

  return {
    ...menu,
    data: settings,
  }
}

// ─── Fixed Deals ──────────────────────────────────────────────────────────────

export function useGetFixedDeals(params: FixedDealListParams = {}) {
  const restaurantId = params.restaurant ?? getRestaurantId();

  return useQuery<FixedDeal[], ApiError>({
    queryKey: ['storefront-fixed-deals', restaurantId, params],
    queryFn: () =>
      api
        .get<{ results?: FixedDeal[] } | FixedDeal[]>(
          API_ENDPOINTS.StorefrontDeals.fixedDeals,
          { params: { restaurant: restaurantId, status: 1, ...params } }
        )
        .then((r) => {
          const data = r.data as { results?: FixedDeal[] } | FixedDeal[];
          return Array.isArray(data) ? data : data.results ?? [];
        }),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

// ─── On Spot Deals ────────────────────────────────────────────────────────────

export function useGetOnSpotDeals(params: OnSpotDealListParams = {}) {
  const restaurantId = params.restaurant ?? getRestaurantId();

  return useQuery<OnSpotDeal[], ApiError>({
    queryKey: ['storefront-on-spot-deals', restaurantId, params],
    queryFn: () =>
      api
        .get<{ results?: OnSpotDeal[] } | OnSpotDeal[]>(
          API_ENDPOINTS.StorefrontDeals.onSpotDeals,
          { params: { restaurant: restaurantId, status: 1, ...params } }
        )
        .then((r) => {
          const data = r.data as { results?: OnSpotDeal[] } | OnSpotDeal[];
          return Array.isArray(data) ? data : data.results ?? [];
        }),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}
