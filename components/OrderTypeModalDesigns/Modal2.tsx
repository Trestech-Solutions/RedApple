'use client'

/**
 * Modal2 — Colored header + image city cards
 * Primary-color header with logo, city selection via image cards,
 * single dropdown for area or branch below.
 */

import Image from 'next/image'
import { Navigation, ChevronDown, X, Loader2 } from 'lucide-react'
import { useStoreSettings } from '@/lib/hooks/useCart'
import { useModalLogic, useSafeClose, resolveLogo, resolveImg, type OrderType } from './_hooks'

export function Modal2({ onClose }: { onClose: () => void }) {
  const {
    orderType, setOrderType, geoLoading, geoError, setGeoError, confirming,
    sortedCities, loadingCities, selectedCityId, setSelectedCityId,
    areaList, loadingCityAreas, selectedAreaId, setSelectedAreaId,
    selectedAreaObj,
    branchList, loadingCityBranches, selectedBranchId, setSelectedBranchId,
    selectedCityObj,
    handleUseCurrentLocation, handleConfirm, canConfirm,
  } = useModalLogic(onClose)
  const { settings } = useStoreSettings()
  const merchantLogo = resolveLogo(settings.merchant_logo)
  const { close }    = useSafeClose(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto">

        {/* Colored header */}
        <div className="relative rounded-t-3xl pb-10 pt-6 flex flex-col items-center"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          <button type="button" onClick={close} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-black/10 transition-colors" aria-label="Close"
            style={{ color: 'var(--color-secondary)' }}>
            <X size={18} />
          </button>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg overflow-hidden"
            style={{ backgroundColor: 'var(--color-primary)' }}>
            <Image src={merchantLogo} alt="Logo" width={80} height={80} className="h-full w-full object-contain" priority />
          </div>
        </div>

        {/* White body overlapping header */}
        <div className="relative -mt-5 rounded-t-3xl bg-white px-5 pb-6 pt-5 sm:px-6 sm:pb-8">
          <h2 className="mb-4 text-center text-base font-bold text-neutral-700 sm:text-lg">Select Your Order Type</h2>

          <div className="mb-5 flex justify-center">
            <div className="flex rounded-full border border-neutral-200 bg-neutral-100 p-1 gap-1 w-full max-w-[240px]">
              {(['delivery', 'pickup'] as OrderType[]).map((type) => (
                <button type="button" key={type} onClick={() => { setOrderType(type); setGeoError('') }}
                  className={`flex-1 rounded-full py-2 text-xs font-bold transition-all ${orderType === type ? 'shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
                  style={orderType === type ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' } : {}}>
                  {type === 'pickup' ? 'Pick-Up' : 'Delivery'}
                </button>
              ))}
            </div>
          </div>

          {geoError && <p className="mb-3 text-center text-xs text-red-600">{geoError}</p>}
          <p className="mb-3 text-center text-sm text-neutral-500">Please select your location</p>

          <div className="mb-5 flex justify-center">
            <button type="button" onClick={handleUseCurrentLocation} disabled={geoLoading}
              className="flex items-center gap-2 rounded-full border-2 px-5 py-2 text-xs font-semibold disabled:opacity-60 transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              {geoLoading ? 'Detecting...' : 'Use Current Location'}
            </button>
          </div>

          {/* City image cards */}
          <p className="mb-3 text-center text-sm font-bold text-neutral-800">Please Select City</p>
          {loadingCities ? (
            <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
          ) : (
            <div className="mb-5 flex flex-wrap justify-center gap-3">
              {sortedCities.map((city) => {
                const isSelected = String(city.id) === selectedCityId
                const imgSrc     = resolveImg(city.image)
                return (
                  <button type="button" key={city.id}
                    onClick={() => { setSelectedCityId(String(city.id)); setSelectedAreaId('') }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all w-[100px] ${
                      isSelected ? 'bg-white shadow-md' : 'border-dashed border-neutral-300 bg-white hover:border-neutral-400'
                    }`}
                    style={isSelected ? { borderColor: 'var(--color-primary)' } : {}}>
                    <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-neutral-50">
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc} alt={city.name} className="h-full w-full object-contain" />
                      ) : (
                        <Image src="/karachi.svg" alt={city.name} width={56} height={56} className="h-full w-full object-contain" />
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${isSelected ? '' : 'text-neutral-700'}`}
                      style={isSelected ? { color: 'var(--color-primary)' } : {}}>
                      {city.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Area/Branch dropdown */}
          {selectedCityId && (
            <div className="mb-5">
              <p className="mb-2 text-sm font-bold text-neutral-800">
                {orderType === 'pickup' ? 'Select a branch' : 'Please select your location'}
              </p>
              <div className="relative">
                {orderType === 'pickup' ? (
                  loadingCityBranches
                    ? <div className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 flex items-center justify-center"><Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
                    : <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}
                        disabled={branchList.length === 0}
                        className="w-full appearance-none rounded-2xl border border-neutral-300 bg-white px-4 py-3 pr-10 text-sm text-neutral-700 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400"
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                        onBlur={(e) => { e.target.style.borderColor = '' }}>
                        <option value="">{branchList.length === 0 ? 'No branches available' : 'Select a branch'}</option>
                        {branchList.map((b) => <option key={b.branchId} value={String(b.branchId)}>{b.name}</option>)}
                      </select>
                ) : (
                  loadingCityAreas
                    ? <div className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 flex items-center justify-center"><Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
                    : <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}
                        disabled={areaList.length === 0}
                        className="w-full appearance-none rounded-2xl border border-neutral-300 bg-white px-4 py-3 pr-10 text-sm text-neutral-700 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400"
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                        onBlur={(e) => { e.target.style.borderColor = '' }}>
                        <option value="">{areaList.length === 0 ? 'No areas available' : 'Select your area'}</option>
                        {areaList.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
                      </select>
                )}
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
              {orderType === 'pickup' && selectedBranchId && (
                <div className="mt-3 rounded-xl bg-neutral-50 px-4 py-3 border border-neutral-100">
                  <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-0.5">Selected Branch</p>
                  <p className="text-sm font-bold text-neutral-800">{branchList.find((b) => String(b.branchId) === selectedBranchId)?.name ?? '—'}</p>
                  {selectedCityObj && <p className="text-xs text-neutral-500 mt-0.5">{selectedCityObj.name}</p>}
                </div>
              )}
            </div>
          )}

          <button type="button" onClick={handleConfirm} disabled={!canConfirm}
            className="w-full rounded-2xl py-3.5 text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
            {confirming ? <><Loader2 size={16} className="animate-spin" /><span>Confirming…</span></> : 'Select'}
          </button>
        </div>
      </div>
    </div>
  )
}
