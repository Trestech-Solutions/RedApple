'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Navigation, ChevronDown, X, Loader2 } from 'lucide-react'
import { useCart, useStoreSettings, type OrderType } from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'
import {
  useGetCities,
  useGetAreasByCity,
  useGetAreaDetail,
  fetchAreaDetail,
  resolveBranchId,
  locate,
} from '@/api/client/browse'
import type { Area, City } from '@/api/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BranchInfo {
  id: string
  numericId: number
  name: string
  address: string
  mapsUrl: string
  lat?: number
  lng?: number
}

export const FALLBACK_BRANCHES: BranchInfo[] = [
  {
    id: '1',
    numericId: 1,
    name: 'United King Maskan',
    address: 'FL 6, Block 7 Gulshan-e-Iqbal, Karachi, Sindh',
    mapsUrl: 'https://maps.google.com/?q=United+King+Maskan+Karachi',
  },
]

export const UK_BRANCHES = FALLBACK_BRANCHES

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''
function resolveImg(path?: string | null): string | null {
  if (!path?.trim()) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) {
    const base = MEDIA_BASE.replace(/\/+$/, '').replace(/\/api$/i, '')
    return base ? `${base}${path}` : null
  }
  return null
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R    = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Shared logic hook ────────────────────────────────────────────────────────

function useModalLogic(onClose: () => void) {
  const { orderType, setOrderType, setLocation, setBranch, setAreaId } = useCart()
  const { setStoreLocation } = useStoreLocation()

  const { data: cities, isLoading: loadingCities } = useGetCities()
  const cityList: City[] = cities ?? []
  const sortedCities = [...cityList].sort((a, b) => a.name.localeCompare(b.name))

  const [selectedCityId, setSelectedCityId] = useState<string>('')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')
  const [geoLoading,     setGeoLoading]     = useState(false)
  const [geoError,       setGeoError]       = useState('')
  const [confirming,     setConfirming]     = useState(false)

  const selectedCityObj = sortedCities.find((c) => String(c.id) === selectedCityId)

  const { data: cityAreas, isLoading: loadingCityAreas } = useGetAreasByCity({ cityId: selectedCityId || null })
  const areaList: Area[] = cityAreas ?? []
  const selectedAreaObj = areaList.find((a) => String(a.id) === selectedAreaId)

  const { data: areaDetail, isLoading: loadingAreaDetail } = useGetAreaDetail(selectedAreaId || null)

  useEffect(() => {
    if (sortedCities.length > 0 && !selectedCityId) {
      setSelectedCityId(String(sortedCities[0].id))
    }
  }, [sortedCities.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedAreaId('')
    if (areaList.length > 0) setSelectedAreaId(String(areaList[0].id))
  }, [selectedCityId, areaList.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation is not supported.'); return }
    setGeoLoading(true); setGeoError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const result = await locate(latitude, longitude)
          if (result.success) {
            if (result.city_id) setSelectedCityId(String(result.city_id))
            if (result.area_id) setTimeout(() => setSelectedAreaId(String(result.area_id)), 0)
            setGeoLoading(false); return
          }
        } catch (_) { /* fall through */ }
        const citiesWithCoords = sortedCities.filter((c) => c.latitude != null && c.longitude != null)
        if (citiesWithCoords.length > 0) {
          const nearest = citiesWithCoords.reduce((best, c) =>
            distanceKm(latitude, longitude, parseFloat(String(c.latitude)), parseFloat(String(c.longitude))) <
            distanceKm(latitude, longitude, parseFloat(String(best.latitude)), parseFloat(String(best.longitude)))
              ? c : best
          )
          setSelectedCityId(String(nearest.id))
        }
        setGeoLoading(false)
      },
      (err) => {
        setGeoLoading(false)
        setGeoError(err.code === err.PERMISSION_DENIED
          ? 'Location access denied. Please select manually.'
          : 'Could not get location. Please select manually.')
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  async function handleConfirm() {
    if (!selectedCityId || !selectedAreaId || !selectedAreaObj) return
    setConfirming(true); setGeoError('')
    try {
      const detail = await fetchAreaDetail(selectedAreaId)
      const resolvedBranchId = resolveBranchId(detail)
      if (resolvedBranchId === undefined) { setGeoError('Could not determine branch. Please try again.'); return }
      const areaIdNum    = detail.id
      const branchIdNum  = resolvedBranchId
      const cityName     = (detail as any).city_name  ?? selectedCityObj?.name ?? ''
      const branchName   = (detail as any).branch_name ?? ''
      const areaName     = detail.name
      const displayLabel = orderType === 'pickup'
        ? branchName || `${areaName}, ${cityName}`
        : `${areaName}, ${cityName}`
      setStoreLocation({ branchId: branchIdNum, branchName, cityId: selectedCityObj?.id ?? Number(selectedCityId), cityName, areaId: areaIdNum, areaName, displayLabel })
      setLocation(displayLabel); setAreaId(areaIdNum); setBranch(branchIdNum)
      onClose()
    } catch (_) { setGeoError('Failed to load area details. Please try again.') }
    finally { setConfirming(false) }
  }

  return {
    orderType, setOrderType, geoLoading, geoError, setGeoError, confirming,
    sortedCities, loadingCities, selectedCityId, setSelectedCityId,
    areaList, loadingCityAreas, selectedAreaId, setSelectedAreaId,
    selectedCityObj, selectedAreaObj, areaDetail, loadingAreaDetail,
    handleUseCurrentLocation, handleConfirm,
    canConfirm: !!selectedCityId && !!selectedAreaId && !!selectedAreaObj && !confirming,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL-1  — existing design: dropdown for city, dropdown for area
// ─────────────────────────────────────────────────────────────────────────────

function Modal1({ onClose }: { onClose: () => void }) {
  const {
    orderType, setOrderType, geoLoading, geoError, setGeoError, confirming,
    sortedCities, loadingCities, selectedCityId, setSelectedCityId,
    areaList, loadingCityAreas, selectedAreaId, setSelectedAreaId,
    selectedCityObj, selectedAreaObj, areaDetail, loadingAreaDetail,
    handleUseCurrentLocation, handleConfirm, canConfirm,
  } = useModalLogic(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 transition-colors z-10" aria-label="Close">
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center pt-6 pb-1 sm:pt-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-neutral-900 bg-white shadow-md overflow-hidden sm:h-20 sm:w-20">
            <Image src="/web/logo.webp" alt="Logo" width={80} height={80} className="h-full w-full object-contain" priority />
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <h2 className="mb-4 text-center text-base font-bold text-neutral-800 sm:mb-5 sm:text-lg">Select your order type</h2>

          {/* Toggle */}
          <div className="mb-5 flex justify-center sm:mb-6">
            <div className="flex rounded-full border border-neutral-300 bg-neutral-100 p-1 gap-1">
              {(['delivery', 'pickup'] as OrderType[]).map((type) => (
                <button key={type} onClick={() => { setOrderType(type); setGeoError('') }}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all sm:px-6 sm:py-2 sm:text-xs ${orderType === type ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}>
                  {type === 'pickup' ? 'Pick-Up' : 'Delivery'}
                </button>
              ))}
            </div>
          </div>

          {geoError && <p className="mb-3 text-center text-xs text-red-600">{geoError}</p>}

          <p className="mb-3 text-center text-sm font-medium text-neutral-600">
            {orderType === 'pickup' ? 'Select your city and area to find the nearest outlet' : 'Please select your delivery location'}
          </p>

          <div className="mb-3.5 flex justify-center sm:mb-4">
            <button onClick={handleUseCurrentLocation} disabled={geoLoading}
              className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-neutral-700 disabled:opacity-60 transition-colors sm:px-5 sm:py-2 sm:text-xs">
              {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
              {geoLoading ? 'Detecting...' : 'Use Current Location'}
            </button>
          </div>

          {/* City dropdown */}
          <div className="relative mb-2.5 sm:mb-3">
            {loadingCities
              ? <div className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-neutral-900" /></div>
              : <select value={selectedCityId} onChange={(e) => { setSelectedCityId(e.target.value); setSelectedAreaId('') }}
                  className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-10 text-xs text-neutral-700 focus:border-neutral-900 focus:outline-none sm:px-4 sm:py-3 sm:text-sm">
                  <option value="">Select City</option>
                  {sortedCities.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
            }
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>

          {/* Area dropdown */}
          <div className="relative mb-2.5 sm:mb-3">
            {!selectedCityId
              ? <div className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-400 sm:px-4 sm:py-3 sm:text-sm">Select a city first</div>
              : loadingCityAreas
              ? <div className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-neutral-900" /></div>
              : <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}
                  disabled={!selectedCityId || areaList.length === 0}
                  className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-10 text-xs text-neutral-700 focus:border-neutral-900 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400 sm:px-4 sm:py-3 sm:text-sm">
                  <option value="">{areaList.length === 0 ? 'No areas available' : 'Select your area'}</option>
                  {areaList.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
                </select>
            }
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>

          {/* Branch preview */}
          {selectedAreaObj && (
            <div className="mb-5 rounded-lg bg-neutral-50 px-3 py-3 space-y-1 border border-neutral-100">
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold sm:text-xs">Assigned Outlet</p>
              {loadingAreaDetail
                ? <div className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /><span className="text-xs text-neutral-500">Loading…</span></div>
                : <p className="text-sm font-bold text-neutral-800">{(areaDetail ?? selectedAreaObj)?.branch_name || '—'}</p>
              }
              {orderType === 'delivery' && (
                <p className="text-[11px] sm:text-xs text-neutral-500">
                  {selectedAreaObj.name}, {(areaDetail ?? selectedAreaObj)?.city_name ?? selectedCityObj?.name}
                </p>
              )}
            </div>
          )}

          <button onClick={handleConfirm} disabled={!canConfirm}
            className="w-full rounded-xl bg-neutral-900 py-2.5 text-xs font-bold text-white hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all sm:py-3 sm:text-sm flex items-center justify-center gap-2">
            {confirming ? <><Loader2 size={14} className="animate-spin" /><span>Confirming…</span></> : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL-2  — new design: yellow header + logo, image city cards, area dropdown
//           matches the screenshot (yellow top, city image cards, Select button)
// ─────────────────────────────────────────────────────────────────────────────

function Modal2({ onClose }: { onClose: () => void }) {
  const {
    orderType, setOrderType, geoLoading, geoError, setGeoError, confirming,
    sortedCities, loadingCities, selectedCityId, setSelectedCityId,
    areaList, loadingCityAreas, selectedAreaId, setSelectedAreaId,
    selectedAreaObj, handleUseCurrentLocation, handleConfirm, canConfirm,
  } = useModalLogic(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto">

        {/* Yellow header with logo */}
        <div className="relative rounded-t-3xl bg-black pb-10 pt-6 flex flex-col items-center">
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-700 hover:bg-black/10 transition-colors" aria-label="Close">
            <X size={18} />
          </button>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900 shadow-lg overflow-hidden">
            <Image src="/web/logo.webp" alt="Logo" width={80} height={80} className="h-full w-full object-contain" priority />
          </div>
        </div>

        {/* White body — overlaps yellow with negative margin trick */}
        <div className="relative -mt-5 rounded-t-3xl bg-white px-5 pb-6 pt-5 sm:px-6 sm:pb-8">

          {/* Title */}
          <h2 className="mb-4 text-center text-base font-bold text-neutral-700 sm:text-lg">Select Your Order Type</h2>

          {/* Delivery / Pickup toggle — yellow active */}
          <div className="mb-5 flex justify-center">
            <div className="flex rounded-full border border-neutral-200 bg-neutral-100 p-1 gap-1 w-full max-w-[240px]">
              {(['delivery', 'pickup'] as OrderType[]).map((type) => (
                <button key={type} onClick={() => { setOrderType(type); setGeoError('') }}
                  className={`flex-1 rounded-full py-2 text-xs font-bold transition-all ${orderType === type ? 'bg-[#f5c518] text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}>
                  {type === 'pickup' ? 'Pick-Up' : 'Delivery'}
                </button>
              ))}
            </div>
          </div>

          {geoError && <p className="mb-3 text-center text-xs text-red-600">{geoError}</p>}

          <p className="mb-3 text-center text-sm text-neutral-500">Please select your location</p>

          {/* Use current location — outlined yellow button */}
          <div className="mb-5 flex justify-center">
            <button onClick={handleUseCurrentLocation} disabled={geoLoading}
              className="flex items-center gap-2 rounded-full border-2 border-[#f5c518] px-5 py-2 text-xs font-semibold text-[#d4a017] hover:bg-[#f5c518]/10 disabled:opacity-60 transition-colors">
              {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              {geoLoading ? 'Detecting...' : 'Use Current Location'}
            </button>
          </div>

          {/* City cards with images */}
          <p className="mb-3 text-center text-sm font-bold text-neutral-800">Please Select City</p>
          {loadingCities ? (
            <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#f5c518]" /></div>
          ) : (
            <div className="mb-5 flex flex-wrap justify-center gap-3">
              {sortedCities.map((city) => {
                const isSelected = String(city.id) === selectedCityId
                const imgSrc = resolveImg(city.image)
                return (
                  <button
                    key={city.id}
                    onClick={() => { setSelectedCityId(String(city.id)); setSelectedAreaId('') }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all w-[100px] ${
                      isSelected
                        ? 'border-[#cc1111] bg-white shadow-md'
                        : 'border-dashed border-neutral-300 bg-white hover:border-neutral-400'
                    }`}
                  >
                    {/* City image or placeholder */}
                   <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-neutral-50">
  {imgSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={city.name}
      className="h-full w-full object-contain"
    />
  ) : (
    <Image
      src="/karachi.svg"
      alt={city.name}
      width={56}
      height={56}
      className="h-full w-full object-contain"
    />
  )}
</div>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-[#cc1111]' : 'text-neutral-700'}`}>
                      {city.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Area dropdown — shown after city selected */}
          {selectedCityId && (
            <div className="mb-5">
              <p className="mb-2 text-sm font-bold text-neutral-800">Please select your location</p>
              <div className="relative">
                {loadingCityAreas
                  ? <div className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-[#f5c518]" /></div>
                  : (
                    <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}
                      disabled={areaList.length === 0}
                      className="w-full appearance-none rounded-2xl border border-neutral-300 bg-white px-4 py-3 pr-10 text-sm text-neutral-700 focus:border-[#f5c518] focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400">
                      <option value="">{areaList.length === 0 ? 'No areas available' : 'Select your area'}</option>
                      {areaList.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
                    </select>
                  )
                }
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>
          )}

          {/* Select button — full-width yellow */}
          <button onClick={handleConfirm} disabled={!canConfirm}
            className="w-full text-white rounded-2xl bg-black py-3.5 text-sm font-bold text-neutral-900 hover:bg-[#e6b800] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md">
            {confirming ? <><Loader2 size={16} className="animate-spin" /><span>Confirming…</span></> : 'Select'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — reads order_modal_design from settings
// ─────────────────────────────────────────────────────────────────────────────

interface OrderTypeModalProps {
  onClose: () => void
}

export function OrderTypeModal({ onClose }: OrderTypeModalProps) {
  const { settings } = useStoreSettings()
  const design = (settings.order_modal_design as string | undefined) ?? 'modal-1'

  if (design === 'modal-2') return <Modal2 onClose={onClose} />
  return <Modal1 onClose={onClose} />
}
