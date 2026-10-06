'use client'

import { useState, useEffect, useRef } from 'react'
import { useCart, type OrderType } from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'
import {
  useGetCities, useGetAreasByCity, useGetAreaDetail,
  useGetBranchesByCity, fetchAreaDetail, resolveBranchId, locate,
} from '@/api/client/browse'
import type { Area, City, BranchByCity } from '@/api/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? ''

export function resolveImg(path?: string | null): string | null {
  if (!path?.trim()) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) {
    const base = MEDIA_BASE.replace(/\/+$/, '').replace(/\/api$/i, '')
    return base ? `${base}${path}` : null
  }
  return null
}

export function resolveLogo(path?: string | null): string {
  return resolveImg(path) ?? '/web/logo.webp'
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

// ─── useSafeClose ─────────────────────────────────────────────────────────────

export function useSafeClose(onClose: () => void, delay = 0) {
  const [closing, setClosing]   = useState(false)
  const closedRef               = useRef(false)
  const close = () => {
    if (closedRef.current) return
    closedRef.current = true
    setClosing(true)
    if (delay > 0) setTimeout(onClose, delay)
    else onClose()
  }
  return { closing, close }
}

// ─── useModalLogic ────────────────────────────────────────────────────────────

const PICKUP_STATIC_AREA_ID = null

export function useModalLogic(onClose: () => void) {
  const { orderType, setOrderType, setLocation, setBranch, setAreaId } = useCart()
  const { setStoreLocation } = useStoreLocation()
  const { data: cities, isLoading: loadingCities } = useGetCities()
  const cityList: City[]   = cities ?? []
  const sortedCities       = [...cityList].sort((a, b) => a.name.localeCompare(b.name))

  const [selectedCityId,   setSelectedCityId]   = useState<string>('')
  const [selectedAreaId,   setSelectedAreaId]    = useState<string>('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [geoLoading,       setGeoLoading]        = useState(false)
  const [geoError,         setGeoError]          = useState('')
  const [confirming,       setConfirming]        = useState(false)

  const selectedCityObj = sortedCities.find((c) => String(c.id) === selectedCityId)

  const { data: cityAreas,    isLoading: loadingCityAreas }    = useGetAreasByCity({ cityId: selectedCityId || null })
  const areaList: Area[]                                       = cityAreas ?? []
  const selectedAreaObj                                        = areaList.find((a) => String(a.id) === selectedAreaId)
  const { data: areaDetail,   isLoading: loadingAreaDetail }   = useGetAreaDetail(selectedAreaId || null)
  const { data: cityBranches, isLoading: loadingCityBranches } = useGetBranchesByCity({
    cityId: orderType === 'pickup' ? (selectedCityId || null) : null,
  })
  const branchList: BranchByCity[] = cityBranches ?? []
  const selectedBranchObj          = branchList.find((b) => String(b.branchId) === selectedBranchId)

  useEffect(() => {
    if (sortedCities.length > 0 && !selectedCityId) setSelectedCityId(String(sortedCities[0].id))
  }, [sortedCities.length]) // eslint-disable-line

  useEffect(() => {
    setSelectedAreaId('')
    setSelectedBranchId('')
    if (orderType === 'delivery' && areaList.length > 0) setSelectedAreaId(String(areaList[0].id))
  }, [selectedCityId, orderType, areaList.length]) // eslint-disable-line

  useEffect(() => {
    if (orderType === 'pickup' && branchList.length > 0 && !selectedBranchId)
      setSelectedBranchId(String(branchList[0].branchId))
  }, [branchList.length, orderType]) // eslint-disable-line

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
        const withCoords = sortedCities.filter((c) => c.latitude != null && c.longitude != null)
        if (withCoords.length > 0) {
          const nearest = withCoords.reduce((best, c) => {
            const d  = distanceKm(latitude, longitude, parseFloat(String(c.latitude)), parseFloat(String(c.longitude)))
            const db = distanceKm(latitude, longitude, parseFloat(String(best.latitude)), parseFloat(String(best.longitude)))
            return d < db ? c : best
          })
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
    setConfirming(true); setGeoError('')
    try {
      if (orderType === 'pickup') {
        if (!selectedBranchObj) { setGeoError('Please select a branch.'); return }
        const branchIdNum  = selectedBranchObj.branchId
        const branchName   = selectedBranchObj.name
        const cityName     = selectedCityObj?.name ?? ''
        const displayLabel = `${branchName}${cityName ? `, ${cityName}` : ''}`
        setStoreLocation({ branchId: branchIdNum, branchName, cityId: selectedCityObj?.id ?? Number(selectedCityId), cityName, areaId: PICKUP_STATIC_AREA_ID, areaName: '', displayLabel })
        setLocation(displayLabel); setBranch(branchIdNum); setAreaId(PICKUP_STATIC_AREA_ID)
        onClose(); return
      }
      if (!selectedCityId || !selectedAreaId || !selectedAreaObj) return
      const detail           = await fetchAreaDetail(selectedAreaId)
      const resolvedBranchId = resolveBranchId(detail)
      if (resolvedBranchId === undefined) { setGeoError('Could not determine branch. Please try again.'); return }
      const cityName     = (detail as any).city_name   ?? selectedCityObj?.name ?? ''
      const branchName   = (detail as any).branch_name ?? ''
      const areaName     = detail.name
      const displayLabel = `${areaName}, ${cityName}`
      setStoreLocation({ branchId: resolvedBranchId, branchName, cityId: selectedCityObj?.id ?? Number(selectedCityId), cityName, areaId: detail.id, areaName, displayLabel })
      setLocation(displayLabel); setAreaId(detail.id); setBranch(resolvedBranchId)
      onClose()
    } catch (_) { setGeoError('Failed to confirm. Please try again.') }
    finally { setConfirming(false) }
  }

  const canConfirm = orderType === 'pickup'
    ? !!selectedBranchObj && !confirming
    : !!selectedCityId && !!selectedAreaId && !!selectedAreaObj && !confirming

  return {
    orderType, setOrderType, geoLoading, geoError, setGeoError, confirming,
    sortedCities, loadingCities, selectedCityId, setSelectedCityId,
    areaList, loadingCityAreas, selectedAreaId, setSelectedAreaId,
    selectedCityObj, selectedAreaObj, areaDetail, loadingAreaDetail,
    branchList, loadingCityBranches, selectedBranchId, setSelectedBranchId, selectedBranchObj,
    handleUseCurrentLocation, handleConfirm, canConfirm,
  }
}

export type { OrderType }

// ─── Legacy exports (used by OrderTypeModal.tsx re-exports) ──────────────────

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
