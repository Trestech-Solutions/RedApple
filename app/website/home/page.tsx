'use client'

import { useState, useEffect as reactUseEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import {
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  useCart, useRegisterProductId, useStoreSettings,
} from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'
import { CategoryNav } from '@/components/website/CategoryNav'
import { SearchBar } from '@/components/website/SearchBar'
import { ProductGrid } from '@/components/product/ProductGrid'
import { CATEGORIES as FALLBACK_CATS, ALL_PRODUCTS as FALLBACK_PRODS, type Category } from '@/lib/data/website-products'
import { useGetMenu } from '@/api/client/browse'
import { isDealActiveNowPKT } from '@/utils/dealTime'
import type { ProductData } from '@/components/product/ProductCard'
import type { MenuResponse, MenuItem, MenuFixedDeal, MenuOnSpotDeal, MenuBanner } from '@/api/types'

const DEFAULT_ICON = 'solar:cup-hot-bold-duotone'
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop'
const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''

/** Resolves a relative /media/... path to a full URL. Pass-through for absolute URLs. */
function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path || path.trim() === '') return undefined
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) {
    const base = MEDIA_BASE.replace(/\/+$/, '').replace(/\/api$/i, '')
    if (!base) return undefined
    return `${base}${path}`
  }
  return path
}

type CategoryIcon = { type: 'image'; value: string } | { type: 'iconify'; value: string }

function resolveIcon(icon: unknown): CategoryIcon {
  if (typeof icon === 'string' && icon.trim() !== '') {
    const url = resolveMediaUrl(icon)
    if (url) return { type: 'image', value: url }
  }
  return { type: 'iconify', value: DEFAULT_ICON }
}

type ResolvedCategory = Omit<Category, 'icon'> & { icon: CategoryIcon; banner?: string }

/**
 * Normalizes a discount_type string from the API into a fixed set of buckets.
 * The API sends "percentage" (not "percent"), and may also send "fixed"/"flat" —
 * this handles all known variants instead of doing an exact string match.
 */
function normalizeDiscountType(raw: unknown): 'percent' | 'fixed' | 'unknown' {
  const t = String(raw ?? '').toLowerCase().trim()
  if (t.startsWith('percent')) return 'percent'   // matches "percent" AND "percentage"
  if (t === 'fixed' || t === 'flat' || t === 'amount') return 'fixed'
  return 'unknown'
}

/**
 * Convert an Item (from the menu API) into a ProductData for the UI.
 * `item.id` is the ID to send as `item` when calling POST /storefront/cart/items/.
 * `price_at_branch` is used when available (branch override), else `front_price`.
 */
function itemToProduct(
  item: MenuItem & {
    description?: string | null
    _from_dish?: boolean
    _dish_tag?: string | null
    _dish_discount?: string | null
    _from_label?: boolean
  },
  categoryId: string,
  idPairs: Array<{ clientId: string; numericId: number }>,
  products: (ProductData & { categoryId: string; subCategoryId: string; branchIds: string[] | '*' })[]
) {
  const clientId = String(item.id)
  idPairs.push({ clientId, numericId: item.id })

  // ── Size-level (size_prices) handling ─────────────────────────────────────
  const rawSizes = (item.size_prices ?? []).filter(
    (sp) => sp && typeof sp.size_name === 'string' && sp.size_name.length > 0
  )
  const sizes: ProductData['sizes'] = rawSizes.map((sp) => {
    const priceNum      = Math.round(parseFloat(sp.price || '0') || 0)
    const discountVal   = parseFloat(String(sp.discount ?? ''))
    const hasDiscount   = !isNaN(discountVal) && discountVal > 0
    const dType         = normalizeDiscountType(sp.discount_type)

    let originalPrice: number | undefined
    let discountLabel: string | undefined
    let hasDiscountTag  = false

    if (hasDiscount) {
      if (dType === 'fixed') {
        // fixed → size_prices.discount holds the *original price* (e.g. 120 when price=100)
        const orig = Math.round(discountVal)
        if (orig > priceNum && priceNum > 0) {
          originalPrice  = orig
          const saveAmt  = orig - priceNum
          const savePct  = Math.round((saveAmt / orig) * 100)
          discountLabel  = savePct > 0 ? `${savePct}% OFF` : `Rs.${saveAmt} OFF`
          hasDiscountTag = true
        }
      } else if (dType === 'percent') {
        // percent/percentage → discount = percentage off (e.g. 20 means 20% off price)
        const pct        = discountVal
        const origNum    = priceNum / Math.max(0.0001, 1 - pct / 100)
        originalPrice    = Math.round(origNum)
        discountLabel    = `${Math.round(pct)}% OFF`
        hasDiscountTag   = true
      } else {
        // Unknown/legacy discount type — treat discount as original price if bigger
        const orig = Math.round(discountVal)
        if (orig > priceNum && priceNum > 0) {
          originalPrice = orig
          discountLabel = `Rs.${orig - priceNum} OFF`
          hasDiscountTag = true
        }
      }
    }

    return {
      sizeId: Number(sp.id),
      sizeFk: Number(sp.size),
      sizeName: sp.size_name,
      price: priceNum,
      originalPrice,
      discountLabel,
      hasDiscountTag,
    }
  })
  const hasSizes = sizes.length > 0

  // ── Item-level price resolution ────────────────────────────────────────────
  // Base: prefer size[0] price if sizes exist, else price_at_branch, else front_price
  let priceInt: number
  if (hasSizes) {
    priceInt = sizes[0]!.price
  } else {
    const rawPrice   = item.price_at_branch || item.front_price || '0'
    const priceFloat = parseFloat(rawPrice)
    priceInt         = isNaN(priceFloat) ? 0 : Math.round(priceFloat)
  }

  const frontPriceNum = item.front_price ? parseFloat(item.front_price) : NaN
  const hasPriceDiff  = !hasSizes &&
                        !isNaN(frontPriceNum) &&
                        item.price_at_branch != null &&
                        item.price_at_branch !== item.front_price

  // ── Item-level discount (item_discount + item_discount_type) ───────────────
  // Only applied when NO size-level data exists; size-level discount takes priority.
  const itemDiscountStr  = String(item.item_discount ?? '')
  const itemDiscountVal  = parseFloat(itemDiscountStr)
  const itemDiscountRaw  = !isNaN(itemDiscountVal) && itemDiscountVal > 0
  const itemDiscountType = normalizeDiscountType(item.item_discount_type)
  const showTag          = Boolean(item.show_discount_tag)

  let itemOriginalPrice: string | undefined
  let itemDiscountLabel: string | undefined
  if (itemDiscountRaw && showTag && !hasSizes) {
    if (itemDiscountType === 'fixed') {
      // item_discount = original price
      const orig = Math.round(itemDiscountVal)
      if (orig > priceInt && priceInt > 0) {
        const saveAmt = orig - priceInt
        const savePct = Math.round((saveAmt / orig) * 100)
        itemOriginalPrice = String(orig)
        itemDiscountLabel = savePct > 0 ? `${savePct}% OFF` : `Rs.${saveAmt} OFF`
      }
    } else if (itemDiscountType === 'percent') {
      const pct     = itemDiscountVal
      const origNum = priceInt / Math.max(0.0001, 1 - pct / 100)
      itemOriginalPrice = String(Math.round(origNum))
      itemDiscountLabel = `${Math.round(pct)}% OFF`
    } else {
      // Unknown type — best-effort fallback, same rule as size-level
      const orig = Math.round(itemDiscountVal)
      if (orig > priceInt && priceInt > 0) {
        itemOriginalPrice = String(orig)
        itemDiscountLabel = `Rs.${orig - priceInt} OFF`
      }
    }
  }

  // Combined originalPrice + discount label: size (if available) > item-level
  const combinedOriginal = hasSizes
    ? (sizes[0]!.originalPrice != null ? String(sizes[0]!.originalPrice) : undefined)
    : (hasPriceDiff ? String(Math.round(frontPriceNum)) : (itemOriginalPrice ?? undefined))

  const combinedDiscount = hasSizes
    ? (sizes[0]!.discountLabel)
    : (itemDiscountLabel ?? (item._dish_discount || undefined))

  const resolvedImage = resolveMediaUrl(item.feature_image) || PLACEHOLDER_IMAGE

  products.push({
    id:            clientId,
    productId:     item.id,
    categoryId,
    subCategoryId: categoryId,
    branchIds:     '*',
    name:          item.name,
    description:   item.description || '',
    timeDuration:  item.time_duration || undefined,
    price:         String(priceInt),
    originalPrice: combinedOriginal,
    fromLabel:     Boolean(item._from_label),
    options:       hasSizes ? sizes.map((s) => s.sizeName) : [],
    tag:           item._dish_tag || undefined,
    discount:      combinedDiscount,
    image:         resolvedImage,
    sizes:         hasSizes ? sizes : undefined,
  })
}

function transformMenu(menu: MenuResponse | undefined): {
  categories: ResolvedCategory[]
  products: (ProductData & { categoryId: string; subCategoryId: string; branchIds: string[] | '*' })[]
  idPairs: Array<{ clientId: string; numericId: number }>
} {
  const menuArr = menu?.menu ?? menu?.categories ?? []

  if (menuArr.length === 0) {
    const idPairs        = FALLBACK_PRODS.map((p, i) => ({ clientId: p.id, numericId: p.productId ?? i + 1 }))
    const productsWithId = FALLBACK_PRODS.map((p, i) => ({ ...p, productId: p.productId ?? i + 1 }))
    const categories: ResolvedCategory[] = FALLBACK_CATS.map((c) => ({ ...c, icon: resolveIcon(c.icon) }))
    return { categories, products: productsWithId, idPairs }
  }

  const products: (ProductData & { categoryId: string; subCategoryId: string; branchIds: string[] | '*' })[] = []
  const idPairs: Array<{ clientId: string; numericId: number }> = []

  const categories: ResolvedCategory[] = menuArr
    .filter((cat) => cat.status !== false && cat.hide_category !== true)
    .map((cat) => {
      const catId  = String(cat.id)
      const icon   = resolveIcon(cat.icon)
      const banner = resolveMediaUrl(cat.banner)

      // ── PRIMARY: use `items[]` — Item records injected by MenuView ──────────
      const itemRecords = cat.items ?? []
      if (itemRecords.length > 0) {
        itemRecords
          .filter((it) => it.status !== false && (it.status as unknown) !== 0)
          .forEach((it) => itemToProduct(it, catId, idPairs, products))

        return {
          id:            catId,
          label:         cat.name,
          icon,
          banner,
          badge:         cat.badge || undefined,
          subCategories: [{ id: catId, label: 'All Items' }],
        }
      }

      // ── FALLBACK A: dish_detail[] — show Dish cards using Dish fields ──
      // If Dish records have base_price they become orderable (productId = d.id).
      // Otherwise they fall back to display-only (Coming Soon overlay).
      const dishes = cat.dish_detail ?? []
      if (dishes.length > 0) {
        dishes
          .filter((d) => d.status !== false)
          .forEach((d) => {
            const clientId = String(d.id)
            const basePriceFloat = parseFloat(String(d.base_price ?? '0'))
            const basePriceInt   = isNaN(basePriceFloat) ? 0 : Math.round(basePriceFloat)
            const hasRealPrice   = basePriceInt > 0
            const origPriceFloat = d.original_price ? parseFloat(String(d.original_price)) : NaN
            const hasOrigPrice   = !isNaN(origPriceFloat) && Math.round(origPriceFloat) > basePriceInt && basePriceInt > 0

            const dishImage = resolveMediaUrl((d as unknown as { image?: string | null }).image)
            const hasImage  = !!dishImage

            idPairs.push({ clientId, numericId: d.id })
            products.push({
              id:            clientId,
              productId:     hasRealPrice ? d.id : (null as unknown as number),
              categoryId:    catId,
              subCategoryId: catId,
              branchIds:     '*' as const,
              name:          d.name,
              description:   d.description || '',
              price:         String(basePriceInt),
              originalPrice: hasOrigPrice ? String(Math.round(origPriceFloat)) : undefined,
              fromLabel:     Boolean(d.from_label),
              options:       (d.options ?? []).map((o) => o.name),
              tag:           d.tag || undefined,
              discount:      d.discount || undefined,
              image:         hasImage ? dishImage! : PLACEHOLDER_IMAGE,
            })
          })

        return {
          id:            catId,
          label:         cat.name,
          icon,
          banner,
          badge:         cat.badge || undefined,
          subCategories: [{ id: catId, label: 'All Items' }],
        }
      }

      // ── FALLBACK: legacy sub_categories shape ─────────────────────────────
      const subCats: Category['subCategories'] = (cat.sub_categories ?? []).map((sc) => {
        const subId = sc.slug || String(sc.id)
        ;(sc.products ?? []).forEach((p) => {
          const clientId   = p.slug || String(p.id)
          const priceFloat = parseFloat(p.base_price || '0')
          const priceInt   = isNaN(priceFloat) ? 0 : Math.round(priceFloat)
          idPairs.push({ clientId, numericId: p.id })
          products.push({
            id: clientId, productId: p.id, categoryId: catId, subCategoryId: subId,
            branchIds: p.branch_ids === '*' || !p.branch_ids ? '*' : (p.branch_ids as (string | number)[]).map(String),
            name: p.name, description: p.description || '',
            price: String(priceInt),
            originalPrice: p.original_price ? String(Math.round(parseFloat(String(p.original_price)))) : undefined,
            fromLabel: !!p.from_label,
            options: (p.options ?? []).map((o) => o.name),
            tag: p.tag || undefined, discount: p.discount || undefined,
            image: resolveMediaUrl(p.image) || PLACEHOLDER_IMAGE,
          })
        })
        return { id: subId, label: sc.name }
      })

      return {
        id:            catId,
        label:         cat.name,
        icon,
        banner,
        badge:         cat.badge || undefined,
        subCategories: subCats.length > 0 ? subCats : [{ id: `${catId}-all`, label: 'All Items' }],
      }
    })

  // ── Inject Fixed Deals into their respective categories ─────────────────────
  const fixedDeals = (menu?.fixed_deals ?? []) as MenuFixedDeal[]
  fixedDeals
    .filter((d) => (d.status === true || d.status === 1) && isDealActiveNowPKT(d.start_time, d.end_time))
    .forEach((deal) => {
      const catId = String(deal.category)
      const clientId = `fixed_deal_${deal.id}`
      const image = resolveMediaUrl(deal.feature_image) || PLACEHOLDER_IMAGE
      const finalPriceNum = Math.round(parseFloat(deal.final_price || '0'))
      const origPriceNum  = Math.round(parseFloat(deal.price || '0'))
      const hasDiscount   = finalPriceNum < origPriceNum && origPriceNum > 0
      const savePct       = hasDiscount ? Math.round(((origPriceNum - finalPriceNum) / origPriceNum) * 100) : 0

      // Build included items list from items_detail
      const includedItems = (deal.items_detail ?? []).map((di) => ({
        name: di.item_detail?.name ?? `Item ${di.item}`,
        qty:  di.quantity,
      }))

      // Build description from items if none provided
      const description = deal.description ||
        (includedItems.length > 0
          ? includedItems.map((i) => `${i.qty}x ${i.name}`).join(' • ')
          : '')

      products.push({
        id:            clientId,
        productId:     null,
        categoryId:    catId,
        subCategoryId: catId,
        branchIds:     '*' as const,
        name:          deal.name,
        description,
        price:         String(origPriceNum),
        originalPrice: hasDiscount ? String(origPriceNum) : undefined,
        discount:      hasDiscount ? `${savePct}% OFF` : undefined,
        image,
        options:       [],
        tag:           'Fixed Deal',
        dealType:      'fixed_deal',
        dealMeta: {
          dealId:        deal.id,
          finalPrice:    deal.final_price,
          isAvailableNow: deal.is_available_now,
          includedItems: includedItems.length > 0 ? includedItems : undefined,
        },
      })
    })

  // ── Inject On Spot Deals into their respective categories ────────────────────
  const onSpotDeals: MenuOnSpotDeal[] = menu?.on_spot_deals ?? []
  onSpotDeals
    .filter((d) => (d.status === true || d.status === 1) && isDealActiveNowPKT(d.start_time, d.end_time))
    .forEach((deal) => {
      const catId = String(deal.category)
      const clientId = `on_spot_deal_${deal.id}`
      const image = resolveMediaUrl(deal.feature_image) || PLACEHOLDER_IMAGE
      const finalPriceNum = Math.round(parseFloat(deal.final_price || '0'))
      const origPriceNum  = Math.round(parseFloat(deal.price || '0'))
      const hasDiscount   = finalPriceNum < origPriceNum && origPriceNum > 0
      const savePct       = hasDiscount ? Math.round(((origPriceNum - finalPriceNum) / origPriceNum) * 100) : 0
      const timeWindow    = deal.start_time && deal.end_time
        ? `${deal.start_time.slice(0, 5)} – ${deal.end_time.slice(0, 5)}`
        : null

      // Build groups with full option objects for modal rendering
      const groups = (deal.groups_detail ?? []).map((g) => ({
        name:       g.name,
        isRequired: g.is_required,
        selectQty:  g.select_quantity,
        options: g.options.map((o) => {
          // addon_items: item is null, use addon_detail.name
          if (o.item === null && 'addon_detail' in o && o.addon_detail) {
            return {
              id:     (o as { addon: number }).addon,  // use addon id as unique key
              name:   o.addon_detail.name,
              qty:    o.quantity,
              maxQty: o.max_quantity,   // null = capped only by group's selectQty
            }
          }
          // normal_dish: use item_detail.name
          return {
            id:     o.id,
            name:   (o.item_detail as { name?: string } | null | undefined)?.name ?? `Item ${o.item}`,
            qty:    o.quantity,
            maxQty: o.max_quantity,     // null = capped only by group's selectQty
          }
        }),
      }))

      // Build included fixed items
      const includedItems = (deal.items_detail ?? []).map((di) => ({
        name: di.item_detail?.name ?? `Item ${di.item}`,
        qty:  di.quantity,
      }))

      products.push({
        id:            clientId,
        productId:     null,
        categoryId:    catId,
        subCategoryId: catId,
        branchIds:     '*' as const,
        name:          deal.name,
        description:   deal.description || '',
        price:         String(origPriceNum),
        originalPrice: hasDiscount ? String(origPriceNum) : undefined,
        discount:      hasDiscount ? `${savePct}% OFF` : undefined,
        image,
        options:       [],
        tag:           'On Spot Deal',
        dealType:      'on_spot_deal',
        dealMeta: {
          dealId:       deal.id,
          finalPrice:   deal.final_price,
          timeWindow,
          isAvailableNow: deal.is_available_now,
          includedItems: includedItems.length > 0 ? includedItems : undefined,
          groups:        groups.length > 0 ? groups : undefined,
        },
      })
    })

  return { categories, products, idPairs }
}

/** Skeleton for the hero carousel while the menu (and branch/area context) is loading. */
function HeroSkeleton() {
  return (
    <section className="bg-black px-4 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8">
      <div className="relative mx-auto h-[20vh] w-full max-w-[1400px] overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 sm:h-[40vh] sm:rounded-3xl md:h-[55vh] lg:h-[70vh] xl:h-[75vh]">
        <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-white/10 sm:h-12" />
          <div className="h-40 w-40 animate-pulse rounded-full bg-white/10 sm:h-52 sm:w-52" />
          <div className="h-3 w-72 max-w-[80%] animate-pulse rounded bg-white/10" />
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-6 sm:gap-2">
          <span className="h-1.5 w-6 rounded-full bg-white/40 sm:w-8" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        </div>

        <button
          disabled
          aria-hidden
          className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/40 sm:left-6 sm:h-11 sm:w-11 md:h-12 md:w-12"
        >
          <ChevronLeft size={18} className="sm:hidden" />
          <ChevronLeft size={20} className="hidden sm:block md:hidden" />
          <ChevronLeft size={24} className="hidden md:block" />
        </button>
        <button
          disabled
          aria-hidden
          className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/40 sm:right-6 sm:h-11 sm:w-11 md:h-12 md:w-12"
        >
          <ChevronRight size={18} className="sm:hidden" />
          <ChevronRight size={20} className="hidden sm:block md:hidden" />
          <ChevronRight size={24} className="hidden md:block" />
        </button>
      </div>
    </section>
  )
}

/** Skeleton for nav rows + product grid area while the menu is loading. */
function ContentSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-neutral-100">
            <div className="h-32 w-full animate-pulse bg-neutral-100 sm:h-40" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type HeroSlide = {
  id: string
  image: string
  title?: string
  heading?: string
  headingColor?: string
  description?: string
  descriptionColor?: string
  link?: string
}

/** Build hero slides from branch banners first, falling back to legacy settings.slide_image_N.
 *  Returns an empty array if nothing is available — the hero section is then hidden.
 *  Priority: 1) menu.banners (branch-wise banners — only if currently active), 2) settings.slide_image_N
 */
function buildHeroSlides(
  settings: ReturnType<typeof useStoreSettings>['settings'],
  banners: MenuBanner[] | undefined,
): HeroSlide[] {
  // 1) Branch-wise banners from menu API — only active (status + is_available_now) with an image
  if (banners && banners.length > 0) {
    const fromBanners = banners
      .filter((b) => b.status === true && b.is_available_now === true)
      .map((b) => {
        const img = resolveMediaUrl(b.banner_image)
        if (!img) return null
        return {
          id: `banner-${b.id}`,
          image: img,
          title: b.title || undefined,
          link: b.url && b.url.trim() !== '' ? b.url : undefined,
        }
      })
      .filter((s) => s !== null) as HeroSlide[]
    if (fromBanners.length > 0) return fromBanners
  }

  // 2) Settings legacy slides (slide_image_1..4, heading/description/color/link per slide)
  const indices: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4]
  const fromSettings = indices
    .map((i) => {
      const img = resolveMediaUrl(
        (settings as any)[`slide_image_${i}`] as string | null | undefined,
      )
      if (!img) return null
      return {
        id: `settings-slide-${i}`,
        image: img,
        heading: (settings as any)[`heading_text_${i}`] as string | undefined,
        headingColor: (settings as any)[`heading_color_${i}`] as string | undefined,
        description: (settings as any)[`description_text_${i}`] as string | undefined,
        descriptionColor: (settings as any)[`description_color_${i}`] as string | undefined,
        link: (settings as any)[`slide_link_${i}`] as string | undefined,
      }
    })
    .filter((s) => s !== null) as HeroSlide[]

  return fromSettings
}

export default function HomePage() {
  const { branch } = useCart()
  const { branchId: reduxBranchId, areaId: reduxAreaId } = useStoreLocation()
  const { settings } = useStoreSettings()
  const registerProductId = useRegisterProductId()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Use storeLocationSlice as canonical source for branchId/areaId
  const numericBranch = reduxBranchId ?? (branch ? Number(branch) : null)
  const numericArea   = reduxAreaId

  const { data: menu, isLoading } = useGetMenu({
    branchId: numericBranch,
    areaId: numericArea,
  })

  // ── Hero slides priority: 1) menu.banners, 2) settings.slide_image_N (empty = hide hero) ──
  const HERO_SLIDES = useMemo(
    () => buildHeroSlides(settings, menu?.banners),
    [settings, menu?.banners],
  )

  const heroActive = HERO_SLIDES.length > 0

  const { categories, products, idPairs } = useMemo(() => transformMenu(menu), [menu])

  // Register product IDs after render — never during render
  reactUseEffect(() => {
    idPairs.forEach(({ clientId, numericId }) => registerProductId(clientId, numericId))
  }, [idPairs, registerProductId])

  const [activeCategoryId, setActiveCategoryId] = useState<string>(() =>
    categories[0]?.id ?? FALLBACK_CATS[0].id
  )

  reactUseEffect(() => {
    if (categories.length === 0) return
    const c = categories.find((cc) => cc.id === activeCategoryId)
    if (!c) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  const goToSlide = useCallback((index: number) => {
    if (HERO_SLIDES.length === 0) return
    setCurrentSlide((index + HERO_SLIDES.length) % HERO_SLIDES.length)
  }, [HERO_SLIDES.length])

  reactUseEffect(() => {
    if (HERO_SLIDES.length === 0) {
      setCurrentSlide(0)
      return
    }
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % HERO_SLIDES.length), 4500)
    return () => clearInterval(t)
  }, [HERO_SLIDES.length])

  const handleCategoryChange = (catId: string) => {
    const cat = categories.find((c) => c.id === catId)
    if (!cat) return
    setActiveCategoryId(catId)
    setSearchQuery('')
    if (typeof document !== 'undefined') {
      const el = document.getElementById(`category-${catId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? categories[0] ?? FALLBACK_CATS[0],
    [categories, activeCategoryId]
  )

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchBranch = !numericBranch || p.branchIds === '*' || p.branchIds.includes(String(numericBranch))
      const matchSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchBranch && matchSearch
    })
  }, [searchQuery, branch, products])

  // ── Loading state: show skeleton instead of fallback data ────────────────
  // IMPORTANT: this check happens AFTER all hooks above, so hook order never changes.
  if (isLoading) {
    return (
      <div className="min-h-screen font-sans text-neutral-800">
        <HeroSkeleton />
        <ContentSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans text-neutral-800">
      {/* Hero carousel — only rendered when banners or legacy slides are available */}
      {heroActive && (
        <section className="px-4 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8" style={{
          backgroundColor: settings.background_color || '',
          backgroundImage: settings.menu_page_background_image ? `url("${settings.menu_page_background_image}")` : '',
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          backgroundAttachment: 'fixed',
        }}>
        <div className="relative mx-auto h-[20vh] w-full max-w-[1400px] overflow-hidden rounded-2xl border border-white/10 sm:h-[40vh] sm:rounded-3xl md:h-[55vh] lg:h-[70vh] xl:h-[75vh]">
          {HERO_SLIDES.map((s, i) => {
            const isActive = i === currentSlide
            const isExternal = s.link && /^https?:\/\//i.test(s.link)
            const Wrapper: React.FC<{ children: React.ReactNode }> = s.link
              ? ({ children }) =>
                  isExternal
                    ? (
                        <a href={s.link!} target="_blank" rel="noopener noreferrer" className="absolute inset-0 block">{children}</a>
                      )
                    : (
                        <a href={s.link!} className="absolute inset-0 block">{children}</a>
                      )
              : ({ children }) => <>{children}</>
            return (
              <div
                key={s.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <Wrapper>
                  <Image src={s.image} alt={s.title || s.heading || 'slide'} fill priority={i === 0} className="object-cover object-center" />
                  {(s.heading || s.description) && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent px-6 pb-10 sm:px-12 sm:pb-16 md:px-16">
                      {s.heading && (
                        <h2
                          className="text-2xl font-extrabold tracking-tight drop-shadow-lg sm:text-3xl md:text-5xl"
                          style={{ color: s.headingColor || '#ffffff' }}
                        >
                          {s.heading}
                        </h2>
                      )}
                      {s.description && (
                        <p
                          className="mt-2 max-w-2xl text-sm font-medium leading-snug drop-shadow sm:text-base md:text-lg"
                          style={{ color: s.descriptionColor || '#f5f5f5' }}
                        >
                          {s.description}
                        </p>
                      )}
                    </div>
                  )}
                </Wrapper>
              </div>
            )
          })}

          {/* Prev / Next arrows — floating circular, inset from the card edges */}
          <button
            onClick={() => goToSlide(currentSlide - 1)}
            aria-label="Previous"
            className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:left-6 sm:h-11 sm:w-11 md:h-12 md:w-12"
          >
            <ChevronLeft size={18} className="sm:hidden" />
            <ChevronLeft size={20} className="hidden sm:block md:hidden" />
            <ChevronLeft size={24} className="hidden md:block" />
          </button>
          <button
            onClick={() => goToSlide(currentSlide + 1)}
            aria-label="Next"
            className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-6 sm:h-11 sm:w-11 md:h-12 md:w-12"
          >
            <ChevronRight size={18} className="sm:hidden" />
            <ChevronRight size={20} className="hidden sm:block md:hidden" />
            <ChevronRight size={24} className="hidden md:block" />
          </button>

          {/* Pagination dots — centered pill style at bottom */}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-6 sm:gap-2">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'w-6 bg-white sm:w-8' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Secure payments badge — respect hide_payment_card_logo_from_banner */}
          {settings.hide_payment_card_logo_from_banner !== true && (
            <div className="absolute bottom-4 right-3 z-20 hidden rounded-md bg-white/95 px-2 py-1 shadow-md sm:bottom-6 sm:right-6 sm:flex sm:flex-col sm:gap-1 sm:px-4 sm:py-2">
              <span className="text-[8px] font-bold tracking-wide text-neutral-700 sm:text-[10px]">SECURE PAYMENTS</span>
              <div className="flex gap-1 sm:gap-2">
                <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[8px] font-bold text-blue-700 sm:px-2 sm:text-[10px]">VISA</span>
                <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[8px] font-bold text-orange-600 sm:px-2 sm:text-[10px]">MasterCard</span>
              </div>
            </div>
          )}
        </div>
        </section>
      )}

      {/* Category nav — sticks right below hero */}
      <CategoryNav
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={handleCategoryChange}
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={searchQuery === '' ? 'Search dishes, sweets, bakery items...' : ''}
      />

      {searchQuery ? (
        // ── Search mode: show matching products from all categories ─────────
        <section className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                Search results &ldquo;{searchQuery}&rdquo;
              </h2>
              <p className="text-sm text-neutral-500">
                {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <ProductGrid products={filteredProducts} searchQuery={searchQuery} />
        </section>
      ) : (
        // ── Browse mode: show each category section with banner → products → repeat ──
        <div>
          {categories.map((cat) => {
            const catProducts = filteredProducts.filter((p) => p.categoryId === cat.id)
            if (catProducts.length === 0) return null

            return (
              <section
                key={cat.id}
                id={`category-${cat.id}`}
                className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 scroll-mt-28"
              >
                {/* Category Banner */}
                <div className="mb-6">
                  {cat.banner ? (
                    <div className="relative overflow-hidden rounded-2xl shadow-md">
                      <div className="relative h-32 w-full sm:h-44 md:h-52 lg:h-60 xl:h-64">
                        <Image
                          src={cat.banner}
                          alt={cat.label}
                          fill
                          priority={false}
                          className="object-cover object-center"
                          sizes="(max-width: 768px) 100vw, 1400px"
                        />
                        {/* Gradient overlay + text */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 md:p-8">
                          <h2 className="text-xl font-bold text-white drop-shadow-sm sm:text-2xl md:text-3xl lg:text-4xl">
                            {cat.label}
                          </h2>
                          <p className="mt-1 text-xs text-white/90 drop-shadow sm:text-sm md:text-base">
                            {catProducts.length} item{catProducts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 flex items-center justify-between rounded-2xl px-5 py-4 sm:px-8 sm:py-5 shadow-md" style={{
                      backgroundColor: settings.background_color || '#1f1f1f',
                      backgroundImage: settings.menu_page_background_image ? `url("${settings.menu_page_background_image}")` : '',
                      backgroundRepeat: 'repeat',
                      backgroundSize: 'auto',
                      backgroundAttachment: 'fixed',
                      backgroundBlendMode: 'overlay',
                    }}>
                      <div>
                        <h2 className="text-lg font-bold text-white sm:text-xl md:text-2xl">
                          {cat.label}
                        </h2>
                        <p className="mt-1 text-xs text-white/90 sm:text-sm">
                          {catProducts.length} item{catProducts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm sm:h-16 sm:w-16">
                        {cat.icon.type === 'image' ? (
                          <Image
                            src={cat.icon.value}
                            alt={cat.label}
                            width={48}
                            height={48}
                            className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12"
                          />
                        ) : (
                          <span
                            className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center text-3xl text-white sm:text-4xl"
                            style={{ fontFamily: 'sans-serif' }}
                          >
                            🍽️
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Products */}
                <ProductGrid products={catProducts} searchQuery="" />
              </section>
            )
          })}
        </div>
      )}

      <section className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
        <h3 className="font-serif text-2xl font-bold text-neutral-900 sm:text-3xl">
          Discover the Delightful Range at United King
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-600">
          United King is Karachi&apos;s premier bakery, offering a wide selection of cakes,
          sweets, mithai, frozen food and fast food.
        </p>
      </section>
    </div>
  )
}