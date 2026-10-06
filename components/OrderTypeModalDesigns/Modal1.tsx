'use client'

/**
 * Modal1 — Classic dropdown design
 * Logo centered, delivery/pickup pill toggle,
 * city dropdown → area/branch dropdown, outlet preview card.
 */

import Image from 'next/image'
import { Navigation, ChevronDown, X, Loader2 } from 'lucide-react'
import { useStoreSettings } from '@/lib/hooks/useCart'
import { useModalLogic, useSafeClose, resolveLogo, type OrderType } from './_hooks'

export function Modal1({ onClose }: { onClose: () => void }) {
  const {
    orderType, setOrderType, geoLoading, geoError, setGeoError, confirming,
    sortedCities, loadingCities, selectedCityId, setSelectedCityId,
    areaList, loadingCityAreas, selectedAreaId, setSelectedAreaId,
    selectedCityObj, selectedAreaObj, areaDetail, loadingAreaDetail,
    branchList, loadingCityBranches, selectedBranchId, setSelectedBranchId,
    handleUseCurrentLocation, handleConfirm, canConfirm,
  } = useModalLogic(onClose)
  const { settings }   = useStoreSettings()
  const merchantLogo   = resolveLogo(settings.merchant_logo)
  const { close }      = useSafeClose(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
        <button type="button" onClick={close} className="absolute right-3 top-3 z-10 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 transition-colors" aria-label="Close">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center pt-6 pb-1 sm:pt-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white shadow-md overflow-hidden sm:h-20 sm:w-20"
            style={{ borderColor: 'var(--color-primary)' }}>
            <Image src={merchantLogo} alt="Logo" width={80} height={80} className="h-full w-full object-contain" priority />
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <h2 className="mb-4 text-center text-base font-bold text-neutral-800 sm:mb-5 sm:text-lg">Select your order type</h2>

          {/* Toggle */}
          <div className="mb-5 flex justify-center sm:mb-6">
            <div className="flex rounded-full border border-neutral-300 bg-neutral-100 p-1 gap-1">
              {(['delivery', 'pickup'] as OrderType[]).map((type) => (
                <button type="button" key={type} onClick={() => { setOrderType(type); setGeoError('') }}
                  className="rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all sm:px-6 sm:py-2 sm:text-xs"
                  style={orderType === type ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' } : {}}>
                  {type === 'pickup' ? 'Pick-Up' : 'Delivery'}
                </button>
              ))}
            </div>
          </div>

          {geoError && <p className="mb-3 text-center text-xs text-red-600">{geoError}</p>}
          <p className="mb-3 text-center text-sm font-medium text-neutral-600">
            {orderType === 'pickup' ? 'Select your city to find nearby outlets' : 'Please select your delivery location'}
          </p>

          {/* Geo button */}
          <div className="mb-3.5 flex justify-center sm:mb-4">
            <button type="button" onClick={handleUseCurrentLocation} disabled={geoLoading}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-semibold disabled:opacity-60 transition-colors hover:opacity-90 sm:px-5 sm:py-2 sm:text-xs"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
              {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
              {geoLoading ? 'Detecting...' : 'Use Current Location'}
            </button>
          </div>

          {/* City */}
          <div className="relative mb-2.5 sm:mb-3">
            {loadingCities
              ? <div className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 flex items-center justify-center"><Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
              : <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-10 text-xs text-neutral-700 focus:outline-none sm:px-4 sm:py-3 sm:text-sm"
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                  onBlur={(e) => { e.target.style.borderColor = '' }}>
                  <option value="">Select City</option>
                  {sortedCities.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
            }
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>

          {/* Pickup: branch */}
          {orderType === 'pickup' && (
            <div className="relative mb-2.5 sm:mb-3">
              {!selectedCityId
                ? <div className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-400 sm:px-4 sm:py-3 sm:text-sm">Select a city first</div>
                : loadingCityBranches
                ? <div className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 flex items-center justify-center"><Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
                : <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}
                    disabled={!selectedCityId || branchList.length === 0}
                    className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-10 text-xs text-neutral-700 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400 sm:px-4 sm:py-3 sm:text-sm"
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                    onBlur={(e) => { e.target.style.borderColor = '' }}>
                    <option value="">{branchList.length === 0 ? 'No branches available' : 'Select a branch'}</option>
                    {branchList.map((b) => <option key={b.branchId} value={String(b.branchId)}>{b.name}</option>)}
                  </select>
              }
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          )}

          {/* Delivery: area */}
          {orderType === 'delivery' && (
            <div className="relative mb-2.5 sm:mb-3">
              {!selectedCityId
                ? <div className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-400 sm:px-4 sm:py-3 sm:text-sm">Select a city first</div>
                : loadingCityAreas
                ? <div className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 flex items-center justify-center"><Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
                : <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}
                    disabled={!selectedCityId || areaList.length === 0}
                    className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pr-10 text-xs text-neutral-700 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400 sm:px-4 sm:py-3 sm:text-sm"
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                    onBlur={(e) => { e.target.style.borderColor = '' }}>
                    <option value="">{areaList.length === 0 ? 'No areas available' : 'Select your area'}</option>
                    {areaList.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
                  </select>
              }
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            </div>
          )}

          {/* Previews */}
          {orderType === 'pickup' && selectedBranchId && (
            <div className="mb-5 rounded-lg bg-neutral-50 px-3 py-3 space-y-1 border border-neutral-100">
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold sm:text-xs">Selected Branch</p>
              <p className="text-sm font-bold text-neutral-800">{branchList.find((b) => String(b.branchId) === selectedBranchId)?.name ?? '—'}</p>
              {selectedCityObj && <p className="text-[11px] sm:text-xs text-neutral-500">{selectedCityObj.name}</p>}
            </div>
          )}
          {orderType === 'delivery' && selectedAreaObj && (
            <div className="mb-5 rounded-lg bg-neutral-50 px-3 py-3 space-y-1 border border-neutral-100">
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold sm:text-xs">Assigned Outlet</p>
              {loadingAreaDetail
                ? <div className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /><span className="text-xs text-neutral-500">Loading…</span></div>
                : <p className="text-sm font-bold text-neutral-800">{(areaDetail ?? selectedAreaObj)?.branch_name || '—'}</p>
              }
              <p className="text-[11px] sm:text-xs text-neutral-500">
                {selectedAreaObj.name}, {(areaDetail ?? selectedAreaObj)?.city_name ?? selectedCityObj?.name}
              </p>
            </div>
          )}

          <button type="button" onClick={handleConfirm} disabled={!canConfirm}
            className="w-full rounded-xl py-2.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all sm:py-3 sm:text-sm flex items-center justify-center gap-2 hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
            {confirming ? <><Loader2 size={14} className="animate-spin" /><span>Confirming…</span></> : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  )
}
