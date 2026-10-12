import { useQuery } from '@tanstack/react-query'
import api from '../axios'
import API_ENDPOINTS from '../endpoint'
import { getRestaurantId } from '../utils'
import type { StorefrontPage, StorefrontPageLink } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StorefrontAboutUs = {
  id: number
  restaurant: number
  page_title: string
  subtitle: string
  content: string
  banner_image: string | null
  image: string | null
  sections: { title: string; content: string }[]
  meta_title: string
  meta_description: string
  is_active: boolean
}

export type StorefrontFAQ = {
  id: number
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  category: number | null
  category_name: string | null
}

export type StorefrontFAQGroup = {
  id: number | null
  name: string
  is_active: boolean
  faqs: StorefrontFAQ[]
}

// ─── useGetAboutUs ────────────────────────────────────────────────────────────

export function useGetAboutUs() {
  const restaurantId = getRestaurantId()

  return useQuery<StorefrontAboutUs | null>({
    queryKey: ['storefront-about-us', restaurantId],
    queryFn: async () => {
      const r = await api.get<StorefrontAboutUs | Record<string, never>>(
        API_ENDPOINTS.StorefrontContent.aboutUs,
        { params: { restaurant: restaurantId } }
      )
      const data = r.data
      if (!data || Object.keys(data).length === 0) return null
      return data as StorefrontAboutUs
    },
    staleTime: 1000 * 60 * 10,
  })
}

// ─── useGetFAQs ───────────────────────────────────────────────────────────────

export function useGetFAQs() {
  const restaurantId = getRestaurantId()

  return useQuery<StorefrontFAQGroup[]>({
    queryKey: ['storefront-faqs', restaurantId],
    queryFn: () =>
      api
        .get<StorefrontFAQGroup[]>(API_ENDPOINTS.StorefrontContent.faqs, {
          params: { restaurant: restaurantId },
        })
        .then((r) => r.data ?? []),
    staleTime: 1000 * 60 * 10,
  })
}

// ─── useGetPages ──────────────────────────────────────────────────────────────

type PagesListOpts = {
  showInFooter?: boolean
  showInMenu?: boolean
}

export function useGetPages(opts: PagesListOpts = {}) {
  const restaurantId = getRestaurantId()

  // One request (shared cache) serves both the footer and the menu; each
  // consumer filters on the show_in_footer / show_in_menu flags it needs.
  return useQuery<StorefrontPageLink[], unknown, StorefrontPageLink[]>({
    queryKey: ['storefront-pages', restaurantId],
    queryFn: () =>
      // Optional content: if the endpoint is unavailable just show no extra links
      // (no retries, no error state in the footer/menu).
      api
        .get<StorefrontPageLink[]>(API_ENDPOINTS.StorefrontContent.pages, { params: { restaurant: restaurantId } })
        .then((r) => (Array.isArray(r.data) ? r.data : []))
        .catch(() => [] as StorefrontPageLink[]),
    select: (pages) =>
      pages
        .filter((p) => (!opts.showInFooter || p.show_in_footer) && (!opts.showInMenu || p.show_in_menu))
        .sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0)),
    staleTime: 1000 * 60 * 10,
    retry: false,
  })
}

// ─── useGetPageBySlug ─────────────────────────────────────────────────────────

export function useGetPageBySlug(slug: string | undefined) {
  const restaurantId = getRestaurantId()
  const enabled = !!slug

  return useQuery<StorefrontPage | null>({
    queryKey: ['storefront-page', restaurantId, slug],
    queryFn: async () => {
      try {
        const r = await api.get<StorefrontPage>(
          API_ENDPOINTS.StorefrontContent.pageDetail(slug!),
          { params: { restaurant: restaurantId } }
        )
        return r.data ?? null
      } catch (e: any) {
        if (e?.response?.status === 404) return null
        throw e
      }
    },
    enabled,
    staleTime: 1000 * 60 * 10,
  })
}
