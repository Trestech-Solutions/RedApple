'use client'

import { useState, useEffect as reactUseEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import {
  ChevronLeft, ChevronRight, Minus, Plus, Check,
} from 'lucide-react'
import {
  useCart, useRegisterProductId, useStoreSettings,
} from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'
import { useBusinessHours } from '@/lib/hooks/useBusinessHours'
import { useCartAnimation } from '@/lib/context/CartAnimationContext'
import { CategoryNav } from '@/components/website/CategoryNav'
import { SearchBar } from '@/components/website/SearchBar'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductDetailModal } from '@/components/product/ProductDetailModal'
import { PopupBannerModal } from '@/components/website/PopupBannerModal'
import { CATEGORIES as FALLBACK_CATS, ALL_PRODUCTS as FALLBACK_PRODS, type Category } from '@/lib/data/website-products'
import { useGetMenu } from '@/api/client/browse'
import { useGetPopupBanners } from '@/api/client/browse'
import { isDealActiveNowPKT } from '@/utils/dealTime'
import type { ProductData, SizeMeta } from '@/components/product/ProductCard'
import type { MenuResponse, MenuItem, MenuFixedDeal, MenuOnSpotDeal, MenuBanner, MenuOffer } from '@/api/types'
import { getRestaurantId } from '@/api/utils'
import { HeroCarousel } from '@/components/website/HeroCarousel'

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
  const itemDiscountStr  = String(item.item_discount ?? '')
  const itemDiscountVal  = parseFloat(itemDiscountStr)
  const itemDiscountRaw  = !isNaN(itemDiscountVal) && itemDiscountVal > 0
  const itemDiscountType = normalizeDiscountType(item.item_discount_type)
  const showTag          = Boolean(item.show_discount_tag)

  let itemOriginalPrice: string | undefined
  let itemDiscountLabel: string | undefined
  if (itemDiscountRaw && showTag && !hasSizes) {
    if (itemDiscountType === 'fixed') {
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
      const orig = Math.round(itemDiscountVal)
      if (orig > priceInt && priceInt > 0) {
        itemOriginalPrice = String(orig)
        itemDiscountLabel = `Rs.${orig - priceInt} OFF`
      }
    }
  }

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
    tag:           item.is_popular ? '🔥 Popular' : (item._dish_tag || undefined),
    discount:      combinedDiscount,
    image:         resolvedImage,
    sizes:         hasSizes ? sizes : undefined,
    textButtonColor: item.text_button_color || undefined,
    cartStyle:       item.cart_style       || undefined,
  })
}

function transformMenu(menu: MenuResponse | undefined): {
  categories: ResolvedCategory[]
  products: (ProductData & { categoryId: string; subCategoryId: string; branchIds: string[] | '*' })[]
  idPairs: Array<{ clientId: string; numericId: number }>
  popularProducts: ProductData[]
} {
  const menuArr = menu?.menu ?? menu?.categories ?? []

  if (menuArr.length === 0) {
    const idPairs        = FALLBACK_PRODS.map((p, i) => ({ clientId: p.id, numericId: p.productId ?? i + 1 }))
    const productsWithId = FALLBACK_PRODS.map((p, i) => ({ ...p, productId: p.productId ?? i + 1 }))
    const categories: ResolvedCategory[] = FALLBACK_CATS.map((c) => ({ ...c, icon: resolveIcon(c.icon) }))
    return { categories, products: productsWithId, idPairs, popularProducts: [] }
  }

  const products: (ProductData & { categoryId: string; subCategoryId: string; branchIds: string[] | '*' })[] = []
  const idPairs: Array<{ clientId: string; numericId: number }> = []
  const popularRawItems: MenuItem[] = []

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
          .filter((it) => {
            if (it.status === false || (it.status as unknown) === 0) return false
            if (it.start_time && it.end_time) {
              return isDealActiveNowPKT(it.start_time, it.end_time)
            }
            return true
          })
          .forEach((it) => {
            itemToProduct(it, catId, idPairs, products)
            if (it.is_popular) popularRawItems.push(it)
          })

        return {
          id:            catId,
          label:         cat.name,
          icon,
          banner,
          badge:         cat.badge || undefined,
          cartStyle:     cat.cart_style   || undefined,
          headerStyle:   cat.header_style || undefined,
          subCategories: [{ id: catId, label: 'All Items' }],
        }
      }

      // ── FALLBACK A: dish_detail[] ──
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
          cartStyle:     cat.cart_style   || undefined,
          headerStyle:   cat.header_style || undefined,
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
        cartStyle:     cat.cart_style   || undefined,
        headerStyle:   cat.header_style || undefined,
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

      const includedItems = (deal.items_detail ?? []).map((di) => ({
        name:            di.item_detail?.name ?? `Item ${di.item}`,
        qty:             di.quantity,
        extraCost:       di.extra_cost ? Math.round(parseFloat(di.extra_cost)) : undefined,
        availableAddons: di.available_addons_detail && di.available_addons_detail.length > 0
          ? di.available_addons_detail.map((a) => ({ id: a.id, name: a.name, price: a.price }))
          : undefined,
      }))

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

      const groups = (deal.groups_detail ?? []).map((g) => ({
        id:         g.id,
        name:       g.name,
        isRequired: g.is_required,
        selectQty:  g.select_quantity,
        options: g.options.map((o) => {
          if (o.item === null && 'addon_detail' in o && o.addon_detail) {
            return {
              id:        (o as { addon: number }).addon,
              name:      o.addon_detail.name,
              qty:       o.quantity,
              maxQty:    o.max_quantity,
              extraCost: undefined,
            }
          }
          return {
            id:        o.id,
            name:      (o.item_detail as { name?: string } | null | undefined)?.name ?? `Item ${o.item}`,
            qty:       o.quantity,
            maxQty:    o.max_quantity,
            extraCost: (o as { extra_cost?: string }).extra_cost
              ? Math.round(parseFloat((o as { extra_cost?: string }).extra_cost!))
              : undefined,
          }
        }),
      }))

      const includedItems = (deal.items_detail ?? []).map((di) => ({
        name:            di.item_detail?.name ?? `Item ${di.item}`,
        qty:             di.quantity,
        extraCost:       di.extra_cost ? Math.round(parseFloat(di.extra_cost)) : undefined,
        availableAddons: di.available_addons_detail && di.available_addons_detail.length > 0
          ? di.available_addons_detail.map((a) => ({ id: a.id, name: a.name, price: a.price }))
          : undefined,
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

  // ── Build popularProducts from menu.popular_items (server-filtered, max 4) ──
  const popularProducts: ProductData[] = (menu?.popular_items ?? []).map((item) => {
    const rawSizes = (item.size_prices ?? []).filter(
      (sp) => sp && typeof sp.size_name === 'string' && sp.size_name.length > 0
    )
    const hasSizes = rawSizes.length > 0
    const rawPrice = item.price_at_branch || item.front_price || '0'
    const priceInt = hasSizes
      ? (Math.round(parseFloat(rawSizes[0]!.price || '0')) || 0)
      : (Math.round(parseFloat(rawPrice)) || 0)

    const sizeMetas: SizeMeta[] = rawSizes.map((sp) => {
      const p = Math.round(parseFloat(sp.price || '0')) || 0
      const dv = parseFloat(String(sp.discount ?? ''))
      const hasDv = !isNaN(dv) && dv > 0
      const dt = normalizeDiscountType(sp.discount_type)
      let origPrice: number | undefined
      let discLabel: string | undefined
      let hasTag = false
      if (hasDv) {
        if (dt === 'fixed') {
          const orig = Math.round(dv)
          if (orig > p && p > 0) { origPrice = orig; discLabel = `${Math.round(((orig - p) / orig) * 100)}% OFF`; hasTag = true }
        } else if (dt === 'percent') {
          const orig = Math.round(p / Math.max(0.0001, 1 - dv / 100))
          origPrice = orig; discLabel = `${Math.round(dv)}% OFF`; hasTag = true
        }
      }
      return { sizeId: Number(sp.id), sizeFk: Number(sp.size), sizeName: sp.size_name, price: p, originalPrice: origPrice, discountLabel: discLabel, hasDiscountTag: hasTag }
    })

    return {
      id:           String(item.id),
      productId:    item.id,
      name:         item.name,
      description:  item.description || '',
      timeDuration: item.time_duration || undefined,
      price:        String(priceInt),
      image:        resolveMediaUrl(item.feature_image) || PLACEHOLDER_IMAGE,
      options:      hasSizes ? sizeMetas.map((s) => s.sizeName) : [],
      sizes:        hasSizes ? sizeMetas : undefined,
      tag:          '🔥 Popular',
      fromLabel:    false,
    } satisfies ProductData
  })

  return { categories, products, idPairs, popularProducts }
}

/** Popular carousel — edge fade masks removed so the page background image stays visible. */
function PopularSection({ products }: { products: ProductData[] }) {
  const [selected, setSelected] = useState<ProductData | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const items = products.slice(0, 50)

  const updateEdges = () => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft >= max - 4)
  }

  reactUseEffect(() => {
    updateEdges()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateEdges, { passive: true })
    window.addEventListener('resize', updateEdges)
    return () => {
      el.removeEventListener('scroll', updateEdges)
      window.removeEventListener('resize', updateEdges)
    }
  }, [items.length])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          disabled={atStart}
          className="absolute -left-1 top-[38%] z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/70 text-neutral-900 shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 disabled:pointer-events-none disabled:opacity-0 sm:flex sm:h-11 sm:w-11 lg:-left-5"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth scrollbar-hide pb-2 sm:gap-4 lg:gap-5"
        >
          {items.map((product) => (
            <div
              key={product.id}
              className="w-[44vw] min-w-[160px] max-w-[200px] shrink-0 snap-start sm:w-[26vw] sm:max-w-[220px] md:w-[21vw] lg:w-[calc((100%-3.75rem)/4)] lg:max-w-none lg:min-w-0"
            >
              <PopularItemCard product={product} onOpen={setSelected} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          disabled={atEnd}
          className="absolute -right-1 top-[38%] z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/70 text-neutral-900 shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 disabled:pointer-events-none disabled:opacity-0 sm:flex sm:h-11 sm:w-11 lg:-right-5"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>

      {selected && <ProductDetailModal product={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function PopularItemCard({ product, onOpen }: { product: ProductData; onOpen: (p: ProductData) => void }) {
  const { addItem, items, updateQuantity, removeItem } = useCart()
  const { isOpen: storeOpen, closedMessage } = useBusinessHours()
  const { triggerFly } = useCartAnimation()
  const [added, setAdded] = useState(false)

  const hasSizes      = !!product.sizes && product.sizes.length > 0
  const defaultSize   = hasSizes ? product.sizes![0]! : undefined
  const priceNum      = defaultSize ? defaultSize.price : (parseInt(product.price, 10) || 0)
  const origPriceStr  = defaultSize
    ? (defaultSize.originalPrice != null ? String(defaultSize.originalPrice) : undefined)
    : product.originalPrice
  const hasOrig       = !!origPriceStr && parseInt(origPriceStr, 10) > priceNum
  const savePct       = hasOrig ? Math.round(((parseInt(origPriceStr!, 10) - priceNum) / parseInt(origPriceStr!, 10)) * 100) : 0

  const needsSelection = hasSizes && product.sizes!.length > 1
  const isOrderable    = priceNum > 0 && product.productId != null

  const cartItem = items.find((i) =>
    hasSizes ? i.id === product.id && i.variantId === defaultSize!.sizeId : i.id === product.id
  )
  const cartQty = cartItem?.quantity ?? 0

  const btnStyle = {
    backgroundColor: 'var(--color-primary, #171717)',
    color: 'var(--color-secondary, #ffffff)',
  } as const

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOrderable) return
    if (!storeOpen) {
      import('sonner').then(({ toast }) => {
        toast.error(closedMessage ?? 'Store is currently closed')
      })
      return
    }
    if (needsSelection) { onOpen(product); return }
    addItem({
      id: product.id, productId: product.productId, name: product.name,
      price: priceNum, image: product.image,
      variantId: defaultSize?.sizeId, sizeFk: defaultSize?.sizeFk,
    })
    triggerFly(e.currentTarget as HTMLElement, product.image)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }
  const handleIncrease = (e: React.MouseEvent) => { e.stopPropagation(); if (cartItem) updateQuantity(cartItem, cartItem.quantity + 1) }
  const handleDecrease = (e: React.MouseEvent) => { e.stopPropagation(); if (!cartItem) return; if (cartItem.quantity <= 1) removeItem(cartItem); else updateQuantity(cartItem, cartItem.quantity - 1) }

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-visible rounded-2xl transition-all duration-300"
      onClick={() => onOpen(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(product) } }}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:ring-black/10"
        style={{ height: 'clamp(9rem, 42vw, 18rem)' }}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {hasOrig && savePct > 0 && (
          <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md sm:left-2 sm:top-2 sm:text-xs">
            {savePct}% OFF
          </span>
        )}
        {product.tag && !hasOrig && (
          <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-neutral-900/85 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur-sm sm:left-2 sm:top-2 sm:text-xs">
            {product.tag}
          </span>
        )}

        {isOrderable && (
          cartQty > 0 && !needsSelection ? (
            <div
              onClick={(e) => e.stopPropagation()}
              style={btnStyle}
              className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-0.5 rounded-full px-1 py-0.5 shadow-lg ring-1 ring-white/10 sm:bottom-2 sm:right-2 sm:gap-1 sm:px-1.5 sm:py-1 lg:bottom-3 lg:right-3 lg:gap-2 lg:px-2 lg:py-1.5"
            >
              <button type="button" onClick={handleDecrease} aria-label="Decrease"
                className="flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-70 sm:h-7 sm:w-7 lg:h-9 lg:w-9">
                <Minus className="h-3 w-3 lg:h-5 lg:w-5" strokeWidth={2.5} />
              </button>
              <span className="w-4 text-center text-xs font-bold sm:w-5 lg:w-7 lg:text-base">{cartQty}</span>
              <button type="button" onClick={handleIncrease} aria-label="Increase"
                className="flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-70 sm:h-7 sm:w-7 lg:h-9 lg:w-9">
                <Plus className="h-3 w-3 lg:h-5 lg:w-5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleAdd(e) }}
              aria-label="Add to cart"
              disabled={!storeOpen}
              title={!storeOpen ? (closedMessage ?? 'Store is currently closed') : undefined}
              style={added ? { color: '#ffffff' } : btnStyle}
              className={`absolute bottom-1.5 right-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-lg ring-1 ring-white/10 transition-all duration-200 sm:bottom-2 sm:right-2 sm:h-10 sm:w-10 lg:bottom-3 lg:right-3 lg:h-14 lg:w-14 ${added ? 'bg-green-600' : !storeOpen ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95'}`}
            >
              {added
                ? <Check className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7" strokeWidth={2.5} />
                : <Plus className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7" strokeWidth={2.5} />}
            </button>
          )
        )}
      </div>

      {/* Text */}
      <div className="px-0.5 pb-3 pt-2">
        <h3 className="line-clamp-2 text-[clamp(0.75rem,3vw,0.938rem)] font-bold leading-snug text-neutral-900">{product.name}</h3>
        <div className="mt-0.5 flex items-baseline gap-1">
          {hasOrig && (
            <span className="text-[clamp(0.625rem,2.5vw,0.75rem)] text-neutral-400 line-through">
              Rs.{parseInt(origPriceStr!, 10).toLocaleString()}
            </span>
          )}
          <span className="text-[clamp(0.75rem,3vw,0.938rem)] font-extrabold text-neutral-900">
            Rs. {priceNum.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
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
          <div key={i} className="overflow-hidden rounded-2xl border border-neutral-100">
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
 */
function buildHeroSlides(
  settings: ReturnType<typeof useStoreSettings>['settings'],
  banners: MenuBanner[] | undefined,
): HeroSlide[] {
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

function SectionHeader({ title, subtitle, emoji }: { title: string; subtitle?: string; emoji?: string }) {
  return (
    <div className="mb-5">
      <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
        {emoji && <span>{emoji}</span>}
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
    </div>
  )
}

export default function HomePage() {
  const { branch } = useCart()
  const { branchId: reduxBranchId, areaId: reduxAreaId } = useStoreLocation()
  const { settings } = useStoreSettings()
  const registerProductId = useRegisterProductId()
  const [searchQuery, setSearchQuery] = useState('')

  const numericBranch = reduxBranchId ?? (branch ? Number(branch) : null)
  const numericArea   = reduxAreaId

  const { data: menu, isLoading } = useGetMenu({
    branchId: numericBranch,
    areaId: numericArea,
  })

  const { data: popupBanners = [] } = useGetPopupBanners()

  const HERO_SLIDES = useMemo(
    () => buildHeroSlides(settings, menu?.banners),
    [settings, menu?.banners],
  )

  const heroActive = HERO_SLIDES.length > 0

  const { categories, products, idPairs, popularProducts } = useMemo(() => transformMenu(menu), [menu])

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

  if (isLoading) {
    return (
      <div className="min-h-screen font-sans text-neutral-800">
        <HeroSkeleton />
        <ContentSkeleton />
      </div>
    )
  }

  const resolvedBgImage = resolveMediaUrl(settings.menu_page_background_image)

  return (
    // No bg here — the layout already paints the background image
    <div className="min-h-screen font-sans text-neutral-800">
      {!isLoading && popupBanners.length > 0 && (
        <PopupBannerModal banners={popupBanners} />
      )}

      {/* Hero carousel — backgroundColor removed, image only */}
      {heroActive && (
        <HeroCarousel
          slides={HERO_SLIDES}
          backgroundImage={resolvedBgImage}
          hidePaymentBadge={settings.hide_payment_card_logo_from_banner === true}
        />
      )}

      {/* Category nav — no bg color, transparent over the image */}
      <div className="sticky top-0 z-30 border-b border-white/10 shadow-sm backdrop-blur-md">
        <CategoryNav
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelect={handleCategoryChange}
        />
      </div>

      {/* ── Offers strip ── */}
      {(() => {
        const activeOffers: MenuOffer[] = (menu?.offers ?? []).filter(
          (o) => o.status && o.is_available_now,
        )
        if (activeOffers.length === 0) return null

        return (
          <section className="mx-auto max-w-[1400px] px-4 py-4 md:px-8">
            <div className="flex justify-center">
              <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide md:justify-center">
                {activeOffers.map((offer) => {
                  const amt        = parseFloat(offer.amount || '0')
                  const isPercent  = offer.discount_type === 'percentage'
                  const showValue  = offer.show_percentage_text === true && amt > 0
                  const valueStr   = showValue ? (isPercent ? `${Math.round(amt)}%` : `Rs.${Math.round(amt)}`) : ''
                  const bannerUrl  = resolveMediaUrl(offer.banner_image)

                  if (!bannerUrl) {
                    const label = offer.discount_text || 'Flat'
                    return (
                      <div
                        key={offer.id}
                        className="relative flex min-h-16 w-[92vw] shrink-0 snap-center items-center overflow-hidden rounded-3xl px-4 py-2 shadow-lg ring-1 ring-black/5 transition-transform duration-300 hover:scale-[1.01] sm:min-h-[68px] sm:px-6 md:w-full"
                        style={{ backgroundColor: 'var(--color-primary, #171717)' }}
                      >
                        <div
                          className="flex min-w-0 items-center gap-3"
                          style={{ color: 'var(--color-secondary, #ffffff)' }}
                        >
                          <svg
                            width="26" height="26" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="shrink-0"
                          >
                            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                            <path d="m15 9-6 6" />
                            <path d="M9 9h.01" />
                            <path d="M15 15h.01" />
                          </svg>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                              <span className="text-xl font-extrabold leading-none sm:text-2xl">
                                {label}{showValue && !isPercent ? ' Rs.' : ''}
                              </span>

                              {showValue && (
                                <span
                                  className="-translate-y-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold sm:h-10 sm:w-10 sm:text-xl"
                                  style={{
                                    backgroundColor: 'var(--color-secondary, #ffffff)',
                                    color: 'var(--color-primary, #171717)',
                                    boxShadow: '0 6px 16px color-mix(in srgb, var(--color-secondary, #ffffff) 35%, transparent)',
                                  }}
                                >
                                  {Math.round(amt)}
                                </span>
                              )}

                              <span className="text-lg font-bold leading-none sm:text-2xl">
                                {showValue && isPercent ? '% Off' : 'Off'}
                              </span>
                            </div>

                            {offer.discount_message && (
                              <p className="mt-1 truncate text-xs opacity-80 sm:text-sm">
                                {offer.discount_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={offer.id}
                      className="relative flex h-24 w-[92vw] max-w-3xl shrink-0 snap-center items-center overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5 transition-transform duration-300 hover:scale-[1.01] sm:h-28 md:h-32 md:w-full"
                      style={{ backgroundColor: 'var(--color-primary,#171717)' }}
                    >
                      <Image
                        src={bannerUrl}
                        alt={offer.discount_text || 'Offer'}
                        fill
                        priority={false}
                        sizes="(max-width: 768px) 92vw, 900px"
                        className="object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />

                      <div className="relative z-10 flex w-full items-center justify-between gap-4 px-5 sm:px-8">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white shadow-inner backdrop-blur-sm sm:h-11 sm:w-11">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white sm:text-base md:text-lg">
                              {offer.discount_text || 'Flat'}{valueStr ? ` ${valueStr}` : ''} Off
                            </p>
                            {offer.discount_message && (
                              <p className="mt-0.5 truncate text-xs text-white/80 sm:text-sm">
                                {offer.discount_message}
                              </p>
                            )}
                          </div>
                        </div>

                        {valueStr && (
                          <span
                            className="hidden shrink-0 animate-pulse items-center justify-center rounded-full px-4 py-1.5 text-sm font-extrabold text-white shadow-md sm:flex sm:text-base"
                            style={{ backgroundColor: 'var(--color-secondary,#e11d48)' }}
                          >
                            {valueStr}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })()}

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={searchQuery === '' ? 'Search dishes, sweets, bakery items...' : ''}
      />

      {searchQuery ? (
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
        <div>
          {popularProducts.length > 0 && (
            <section
              id="category-popular"
              className="mx-auto max-w-[1400px] px-4 pt-8 pb-2 md:px-8 scroll-mt-28"
            >
              <SectionHeader title="Popular" subtitle="Most ordered right now" emoji="🔥" />
              <PopularSection products={popularProducts} />
            </section>
          )}

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
                    <div className="group relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cat.banner}
                        alt={cat.label}
                        className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    // No bg color, no overlay — transparent over the layout image
                    <div className="mb-6 flex items-center justify-between rounded-3xl px-5 py-4 shadow-lg ring-1 ring-black/5 sm:px-8 sm:py-5">
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral-900 sm:text-xl md:text-2xl">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-900/70" />
                          {cat.label}
                        </h2>
                        <p className="mt-1 text-xs text-neutral-700 sm:text-sm">
                          {catProducts.length} item{catProducts.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 shadow-inner backdrop-blur-sm sm:h-16 sm:w-16">
                        {cat.icon.type === 'image' ? (
                          <Image
                            src={cat.icon.value}
                            alt={cat.label}
                            width={48}
                            height={48}
                            className="h-10 w-10 rounded-full object-cover shadow-md sm:h-12 sm:w-12"
                          />
                        ) : (
                          <span
                            className="flex h-10 w-10 items-center justify-center text-3xl sm:h-12 sm:w-12 sm:text-4xl"
                            style={{ fontFamily: 'sans-serif' }}
                          >
                            🍽️
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <ProductGrid products={catProducts} searchQuery="" />
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}