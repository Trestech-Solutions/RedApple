'use client'

/**
 * Modal3 — Animated glass design
 * Radial gradient backdrop, spring-in scale/slide animation.
 * Sliding pill segmented control, staggered city chip grid,
 * smooth Reveal expand for location step. Shine sweep on confirm.
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Navigation, ChevronDown, X, Loader2, MapPin, Store, Check, Sparkles } from 'lucide-react'
import { useStoreSettings } from '@/lib/hooks/useCart'
import { useModalLogic, useSafeClose, resolveLogo, resolveImg, type OrderType } from './_hooks'

// ─── Animation helpers ────────────────────────────────────────────────────────

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return mounted
}

function Pop({ delay = 0, className = '', children }: { delay?: number; className?: string; children: React.ReactNode }) {
  const mounted = useMounted()
  return (
    <div
      className={`transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
        mounted ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2.5 scale-90 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function Reveal({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const mounted = useMounted()
  return (
    <div className={`grid transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
      mounted ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
    } ${className}`}>
      <div className="-m-1 min-h-0 overflow-hidden p-1">{children}</div>
    </div>
  )
}

const selectCls =
  'w-full appearance-none rounded-2xl border-2 border-neutral-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-neutral-700 outline-none transition-shadow focus:border-[color:var(--color-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] disabled:bg-neutral-50 disabled:text-neutral-400'

const loaderBoxCls =
  'flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3'

// ─── Modal3 ───────────────────────────────────────────────────────────────────

export function Modal3({ onClose }: { onClose: () => void }) {
  const {
    orderType, setOrderType, geoLoading, geoError, setGeoError, confirming,
    sortedCities, loadingCities, selectedCityId, setSelectedCityId,
    areaList, loadingCityAreas, selectedAreaId, setSelectedAreaId,
    selectedCityObj, selectedAreaObj, areaDetail, loadingAreaDetail,
    branchList, loadingCityBranches, selectedBranchId, setSelectedBranchId, selectedBranchObj,
    handleUseCurrentLocation, handleConfirm, canConfirm,
  } = useModalLogic(onClose)
  const { settings }                    = useStoreSettings()
  const merchantLogo                    = resolveLogo(settings.merchant_logo)
  const { closing, close: smoothClose } = useSafeClose(onClose, 200)
  const mounted                         = useMounted()
  const visible                         = mounted && !closing

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(0,0,0,.55),rgba(0,0,0,.72))] p-2 backdrop-blur-[6px] transition-opacity duration-200 sm:p-4 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={(e) => { if (e.target === e.currentTarget) smoothClose() }}
    >
      <div
        className={`relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,.55)] ring-1 ring-inset ring-white/40 transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5 ${visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="relative overflow-hidden rounded-t-[28px] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary)_55%,color-mix(in_srgb,var(--color-primary)_70%,black)_100%)] px-6 pb-14 pt-7">
          <div className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 animate-pulse rounded-full bg-white/20 blur-2xl" />
          <div className="pointer-events-none absolute -right-6 top-6 h-24 w-24 animate-pulse rounded-full bg-white/10 blur-2xl [animation-delay:.8s]" />

          <button type="button" onClick={smoothClose}
            className="absolute right-4 top-4 z-10 touch-manipulation rounded-full bg-black/15 p-1.5 text-white backdrop-blur-sm active:bg-black/30"
            aria-label="Close">
            <X size={26} />
          </button>

          <div className="relative z-10 flex flex-col items-center">
            <Pop>
              <div className="relative">
                <span className="absolute inset-0 animate-ping rounded-2xl bg-white/40 [animation-duration:2s]" />
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl ring-4 ring-white/30">
                  <Image src={merchantLogo} alt="Logo" width={64} height={64} className="h-full w-full object-contain" priority />
                </div>
              </div>
            </Pop>
            <div className="mt-3 flex items-center gap-1.5">
              <Sparkles size={13} className="text-white/90" />
              <h2 className="text-center text-sm font-extrabold tracking-wide text-white sm:text-base">Where should we send it?</h2>
            </div>
            <p className="mt-1 text-center text-[11px] font-medium text-white/80">Pick your order type to get started</p>
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 -mt-8 rounded-t-[26px] bg-white px-5 pb-6 pt-5 sm:px-6">

          {/* Sliding pill segmented control */}
          <Pop delay={50}>
            <div className="relative mx-auto mb-5 flex w-full max-w-[280px] rounded-2xl bg-neutral-100 p-1">
              <div className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-[var(--color-primary)] shadow-md transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
                orderType === 'delivery' ? 'left-1' : 'left-1/2'
              }`} />
              {(['delivery', 'pickup'] as OrderType[]).map((type) => {
                const active = orderType === type
                const Icon   = type === 'pickup' ? Store : MapPin
                return (
                  <button type="button" key={type} onClick={() => { setOrderType(type); setGeoError('') }}
                    className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-colors duration-300 ${active ? 'text-[color:var(--color-secondary)]' : 'text-gray-500'}`}>
                    <Icon size={13} className={active ? '' : 'opacity-60'} />
                    {type === 'pickup' ? 'Pick-Up' : 'Delivery'}
                  </button>
                )
              })}
            </div>
          </Pop>

          {geoError && (
            <Pop>
              <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">{geoError}</div>
            </Pop>
          )}

          <Pop delay={100} className="mb-5 flex justify-center">
            <button type="button" onClick={handleUseCurrentLocation} disabled={geoLoading}
              className="group relative flex touch-manipulation items-center gap-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] px-5 py-2.5 text-xs font-bold text-[color:var(--color-primary)] shadow-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-60">
              <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/50 transition-transform duration-700 group-hover:translate-x-[400%]" />
              {geoLoading ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} className="transition-transform group-hover:-rotate-12" />}
              <span className="relative">{geoLoading ? 'Detecting your location…' : 'Use Current Location'}</span>
            </button>
          </Pop>

          <Pop delay={120}>
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-neutral-400">Choose your city</p>
          </Pop>

          {loadingCities ? (
            <div className="flex justify-center py-6"><Loader2 size={22} className="animate-spin text-[color:var(--color-primary)]" /></div>
          ) : (
            <div className="mb-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {sortedCities.map((city, i) => {
                const isSelected = String(city.id) === selectedCityId
                const imgSrc     = resolveImg(city.image)
                return (
                  <Pop key={city.id} delay={50 + i * 30}>
                    <button type="button"
                      onClick={() => { setSelectedCityId(String(city.id)); setSelectedAreaId('') }}
                      className={`flex h-full w-full touch-manipulation flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-all duration-200 active:scale-95 ${
                        isSelected
                          ? 'border-[color:var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)] shadow-[0_6px_16px_-6px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]'
                          : 'border-neutral-200 bg-white'
                      }`}>
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50">
                        <div className="h-full w-full overflow-hidden rounded-xl">
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgSrc} alt={city.name} className="h-full w-full object-contain" />
                          ) : (
                            <Image src="/karachi.svg" alt={city.name} width={40} height={40} className="h-full w-full object-contain" />
                          )}
                        </div>
                        {isSelected && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className={`text-center text-[11px] font-semibold leading-tight ${isSelected ? 'text-[color:var(--color-primary)]' : 'text-gray-700'}`}>
                        {city.name}
                      </span>
                    </button>
                  </Pop>
                )
              })}
            </div>
          )}

          {/* Location/branch step */}
          {selectedCityId && (
            <Reveal key={`${orderType}-${selectedCityId}`} className="mb-5">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                {orderType === 'pickup' ? <Store size={13} /> : <MapPin size={13} />}
                {orderType === 'pickup' ? 'Select a branch' : 'Select your area'}
              </p>
              <div className="relative">
                {orderType === 'pickup' ? (
                  loadingCityBranches
                    ? <div className={loaderBoxCls}><Loader2 size={16} className="animate-spin text-[color:var(--color-primary)]" /></div>
                    : <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} disabled={branchList.length === 0} className={selectCls}>
                        <option value="">{branchList.length === 0 ? 'No branches available' : 'Select a branch'}</option>
                        {branchList.map((b) => <option key={b.branchId} value={String(b.branchId)}>{b.name}</option>)}
                      </select>
                ) : loadingCityAreas
                  ? <div className={loaderBoxCls}><Loader2 size={16} className="animate-spin text-[color:var(--color-primary)]" /></div>
                  : <select value={selectedAreaId} onChange={(e) => setSelectedAreaId(e.target.value)} disabled={areaList.length === 0} className={selectCls}>
                      <option value="">{areaList.length === 0 ? 'No areas available' : 'Select your area'}</option>
                      {areaList.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
                    </select>
                }
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
              {orderType === 'pickup' && selectedBranchObj && (
                <Pop className="mt-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-gradient-to-br from-neutral-50 to-white px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_15%,white)]">
                      <Store size={16} className="text-[color:var(--color-primary)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-neutral-800">{selectedBranchObj.name}</p>
                      {selectedCityObj && <p className="text-[11px] text-neutral-500">{selectedCityObj.name}</p>}
                    </div>
                  </div>
                </Pop>
              )}
              {orderType === 'delivery' && selectedAreaObj && (
                <Pop className="mt-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-gradient-to-br from-neutral-50 to-white px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_15%,white)]">
                      <MapPin size={16} className="text-[color:var(--color-primary)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {loadingAreaDetail
                        ? <div className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /><span className="text-xs text-neutral-500">Finding your outlet…</span></div>
                        : <p className="truncate text-sm font-bold text-neutral-800">{(areaDetail ?? selectedAreaObj)?.branch_name || '—'}</p>
                      }
                      <p className="truncate text-[11px] text-neutral-500">
                        {selectedAreaObj.name}, {(areaDetail ?? selectedAreaObj)?.city_name ?? selectedCityObj?.name}
                      </p>
                    </div>
                  </div>
                </Pop>
              )}
            </Reveal>
          )}

          <button type="button" onClick={handleConfirm} disabled={!canConfirm}
            className="group relative flex w-full touch-manipulation items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-[color:var(--color-secondary)] shadow-lg transition-all hover:shadow-xl active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-35">
            {!confirming && canConfirm && (
              <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/40 transition-transform duration-700 group-hover:translate-x-[400%]" />
            )}
            <span className="relative flex items-center gap-2">
              {confirming
                ? <><Loader2 size={16} className="animate-spin" /> Confirming…</>
                : <>Confirm &amp; Continue <Check size={15} className="transition-transform group-hover:translate-x-0.5" /></>
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
