'use client'

/**
 * Modal1 — Classic dropdown design
 * Red header with logo tile, delivery/pickup pill toggle,
 * outlined "Use Current Location" pill, city → area/branch dropdowns, Select button.
 * Fully responsive, always centered.
 */

import Image from 'next/image'
import { Crosshair, ChevronDown, X, Loader2 } from 'lucide-react'
import { useStoreSettings } from '@/lib/hooks/useCart'
import { useModalLogic, useSafeClose, resolveLogo, type OrderType } from './_hooks'

const selectCls =
  'w-full appearance-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 pr-10 text-sm text-neutral-700 shadow-sm focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400 min-[400px]:px-4 min-[400px]:py-3 min-[400px]:pr-11 sm:py-3.5 sm:text-base'
const loaderCls =
  'flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm sm:py-3.5'
const chevronCls =
  'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 min-[400px]:right-4 sm:h-[18px] sm:w-[18px]'

export function Modal1({ onClose }: { onClose: () => void }) {
  const {
    orderType, setOrderType, geoLoading, geoError, setGeoError, confirming,
    sortedCities, loadingCities, selectedCityId, setSelectedCityId,
    areaList, loadingCityAreas, selectedAreaId, setSelectedAreaId,
    selectedCityObj, selectedAreaObj, areaDetail, loadingAreaDetail,
    branchList, loadingCityBranches, selectedBranchId, setSelectedBranchId,
    handleUseCurrentLocation, handleConfirm, canConfirm,
  } = useModalLogic(onClose)
  const { settings } = useStoreSettings()
  const merchantLogo = resolveLogo(settings.merchant_logo)
  const { close }    = useSafeClose(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[92dvh] w-full max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl sm:max-w-lg sm:rounded-[28px] md:max-w-xl">

        {/* Red header */}
        <div
          className="relative flex shrink-0 items-center justify-center px-4 py-4 min-[400px]:py-5 sm:py-6"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <button type="button" onClick={close} aria-label="Close"
            className="absolute right-2.5 top-2.5 z-10 rounded-full p-1.5 transition-colors hover:bg-white/20 sm:right-3 sm:top-3"
            style={{ color: 'var(--color-secondary)' }}>
            <X className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
          </button>
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-md min-[400px]:h-20 min-[400px]:w-20 min-[400px]:p-2 sm:h-[88px] sm:w-[88px]">
            <Image src={merchantLogo} alt="Logo" width={88} height={88} className="h-full w-full object-contain" priority />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 min-[400px]:px-5 min-[400px]:pt-4 sm:px-8">
          <h2 className="mb-3 text-center text-base font-bold text-neutral-900 min-[400px]:mb-4 min-[400px]:text-lg sm:text-xl">
            Select Your Order Type
          </h2>

          {/* Toggle */}
          <div className="mb-3 flex justify-center min-[400px]:mb-4">
            <div className="flex gap-1 rounded-full border border-neutral-200 bg-neutral-100 p-1 min-[400px]:p-1.5">
              {(['delivery', 'pickup'] as OrderType[]).map((type) => (
                <button type="button" key={type} onClick={() => { setOrderType(type); setGeoError('') }}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-500 transition-all min-[400px]:px-5 min-[400px]:py-2 min-[400px]:text-sm sm:px-6 sm:py-2.5"
                  style={orderType === type ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' } : {}}>
                  {type === 'pickup' ? 'Pick-Up' : 'Delivery'}
                </button>
              ))}
            </div>
          </div>

          {geoError && <p className="mb-2 text-center text-xs text-red-600">{geoError}</p>}
          <p className="mb-2.5 text-center text-xs font-medium text-neutral-600 min-[400px]:mb-3 min-[400px]:text-sm sm:text-base">
            {orderType === 'pickup' ? 'Please select your city' : 'Please select your location'}
          </p>

          {/* Geo button */}
          <div className="mb-3 flex justify-center min-[400px]:mb-4">
            <button type="button" onClick={handleUseCurrentLocation} disabled={geoLoading}
              className="flex items-center gap-1.5 rounded-full border-2 px-4 py-1.5 text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-60 min-[400px]:gap-2 min-[400px]:px-5 min-[400px]:py-2 min-[400px]:text-sm"
              style={{
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 6%, white)',
              }}>
              {geoLoading
                ? <Loader2 className="h-4 w-4 animate-spin min-[400px]:h-[18px] min-[400px]:w-[18px]" />
                : <Crosshair className="h-4 w-4 min-[400px]:h-5 min-[400px]:w-5" />}
              {geoLoading ? 'Detecting...' : 'Use Current Location'}
            </button>
          </div>

          {/* City */}
          <p className="mb-1.5 text-xs font-semibold text-neutral-800 min-[400px]:mb-2 min-[400px]:text-sm">
            {orderType === 'pickup' ? 'Please select your city' : 'Please select your location'}
          </p>
          <div className="relative mb-2.5 min-[400px]:mb-3">
            {loadingCities
              ? <div className={loaderCls}><Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
              : <select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)}
                  className={selectCls}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                  onBlur={(e) => { e.target.style.borderColor = '' }}>
                  <option value="">Please select your location</option>
                  {sortedCities.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
            }
            <ChevronDown className={chevronCls} />
          </div>

          {/* Pickup: branch */}
          {orderType === 'pickup' && selectedCityId && (
            <div className="relative mb-2.5 min-[400px]:mb-3">
              {loadingCityBranches
                ? <div className={loaderCls}><Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
                : <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}
                    disabled={branchList.length === 0}
                    className={selectCls}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                    onBlur={(e) => { e.target.style.borderColor = '' }}>
                    <option value="">{branchList.length === 0 ? 'No branches available' : 'Select a branch'}</option>
                    {branchList.map((b) => <option key={b.branchId} value={String(b.branchId)}>{b.name}</option>)}
                  </select>
              }
              <ChevronDown className={chevronCls} />
            </div>
          )}

          {/* Delivery: area */}
          {orderType === 'delivery' && selectedCityId && (
            <div className="relative mb-2.5 min-[400px]:mb-3">
              {loadingCityAreas
                ? <div className={loaderCls}><Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
                : <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)}
                    disabled={areaList.length === 0}
                    className={selectCls}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                    onBlur={(e) => { e.target.style.borderColor = '' }}>
                    <option value="">{areaList.length === 0 ? 'No areas available' : 'Select your area'}</option>
                    {areaList.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
                  </select>
              }
              <ChevronDown className={chevronCls} />
            </div>
          )}

          {/* Previews */}
          {orderType === 'pickup' && selectedBranchId && (
            <div className="mb-3 space-y-1 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5 min-[400px]:py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 min-[400px]:text-[11px] sm:text-xs">Selected Branch</p>
              <p className="break-words text-sm font-bold text-neutral-800">{branchList.find((b) => String(b.branchId) === selectedBranchId)?.name ?? '—'}</p>
              {selectedCityObj && <p className="text-[11px] text-neutral-500 sm:text-xs">{selectedCityObj.name}</p>}
            </div>
          )}
          {orderType === 'delivery' && selectedAreaObj && (
            <div className="mb-3 space-y-1 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5 min-[400px]:py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 min-[400px]:text-[11px] sm:text-xs">Assigned Outlet</p>
              {loadingAreaDetail
                ? <div className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /><span className="text-xs text-neutral-500">Loading…</span></div>
                : <p className="break-words text-sm font-bold text-neutral-800">{(areaDetail ?? selectedAreaObj)?.branch_name || '—'}</p>
              }
              <p className="break-words text-[11px] text-neutral-500 sm:text-xs">
                {selectedAreaObj.name}, {(areaDetail ?? selectedAreaObj)?.city_name ?? selectedCityObj?.name}
              </p>
            </div>
          )}
        </div>

        {/* Footer (always visible, even when body scrolls) */}
        <div className="shrink-0 border-t border-neutral-100 bg-white px-4 py-3 min-[400px]:px-5 min-[400px]:py-4 sm:px-8 sm:py-5">
          <button type="button" onClick={handleConfirm} disabled={!canConfirm}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 min-[400px]:py-3.5 min-[400px]:text-base sm:py-4"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)' }}>
            {confirming ? <><Loader2 size={16} className="animate-spin" /><span>Confirming…</span></> : 'Select'}
          </button>
        </div>
      </div>
    </div>
  )
}