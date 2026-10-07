'use client'

import { useState } from 'react'
import {
  MapPin,
  Plus,
  X,
  Trash2,
  Loader2,
  Pencil,
  Home,
  Briefcase,
  RefreshCw,
  Check,
  ChevronDown,
} from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'
import { ProfileLayout } from '@/components/website/ProfileLayout'
import {
  useGetAddresses,
  useAddAddress,
  useDeleteAddress,
  useUpdateAddress,
} from '@/api/client/customer'
import type { AddAddressPayload, UpdateAddressPayload } from '@/api/types'

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Hyderabad', 'Peshawar', 'Quetta']

type AddrLabel = 'home' | 'office' | 'other'

const LABELS: { value: AddrLabel; text: string; icon: typeof Home }[] = [
  { value: 'home', text: 'Home', icon: Home },
  { value: 'office', text: 'Office', icon: Briefcase },
  { value: 'other', text: 'Other', icon: MapPin },
]

const LABEL_STYLES: Record<AddrLabel, { chip: string; icon: string }> = {
  home: { chip: 'bg-sky-50 text-sky-700 ring-sky-200', icon: 'bg-sky-50 text-sky-600' },
  office: { chip: 'bg-amber-50 text-amber-700 ring-amber-200', icon: 'bg-amber-50 text-amber-600' },
  other: { chip: 'bg-neutral-100 text-neutral-600 ring-neutral-200', icon: 'bg-neutral-100 text-neutral-500' },
}

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10'

export default function AddressesPage() {
  const { user, addresses: cartAddresses } = useCart()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [showCoords, setShowCoords] = useState(false)
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('Karachi')
  const [postal, setPostal] = useState('')
  const [label, setLabel] = useState<AddrLabel>('home')
  const [lat, setLat] = useState<string>('')
  const [lng, setLng] = useState<string>('')

  // Data from API
  const { data: apiAddresses = [], isLoading: loadingAddresses, refetch } = useGetAddresses({ enabled: !!user })

  const addrAdder = useAddAddress({
    onSuccess() { resetForm() },
  })
  const addrDeleter = useDeleteAddress()
  const addrUpdater = useUpdateAddress({
    onSuccess() { resetForm() },
  })

  function resetForm() {
    setShowForm(false); setEditingId(null); setShowCoords(false)
    setLine1(''); setLine2(''); setCity('Karachi'); setPostal('')
    setLabel('home'); setLat(''); setLng('')
  }

  function startEdit(a: any) {
    setEditingId(Number(a.id))
    setLine1(a.line1 || a.address || '')
    setLine2(a.line2 || '')
    setCity(a.city || 'Karachi')
    setPostal(a.postal_code || a.zipcode || '')
    setLabel((a.label as AddrLabel) || 'other')
    setLat(a.latitude ? String(a.latitude) : '')
    setLng(a.longitude ? String(a.longitude) : '')
    setShowCoords(!!(a.latitude || a.longitude))
    setShowForm(true)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const displayList: any[] =
    apiAddresses && apiAddresses.length > 0
      ? apiAddresses
      : (cartAddresses ?? []).map((a: any) => ({
          id: Number(a.id),
          line1: a.line1,
          city: a.city,
          label: 'other' as AddrLabel,
        }))

  if (!user) return null

  const handleSave = () => {
    if (!line1.trim()) return
    // Combine line1 + line2 into the single `address` field the backend expects
    const addressStr = line2.trim() ? `${line1.trim()}, ${line2.trim()}` : line1.trim()
    if (editingId) {
      const payload: UpdateAddressPayload = {
        address: addressStr,
        city,
        label: label !== 'other' ? label : undefined,
      }
      addrUpdater.updateAddress({ customer_address_id: editingId, payload })
    } else {
      const payload: AddAddressPayload = {
        address: addressStr,
        city,
        label: label !== 'other' ? label : undefined,
      }
      addrAdder.addAddress(payload)
    }
  }

  const saving = addrAdder.isPending || addrUpdater.isPending
  const isEmpty = !loadingAddresses && displayList.length === 0

  return (
    <ProfileLayout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Addresses</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {loadingAddresses
              ? 'Loading your saved places…'
              : displayList.length > 0
                ? `${displayList.length} saved ${displayList.length === 1 ? 'address' : 'addresses'}`
                : 'Manage where we deliver your orders'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-all hover:border-neutral-300 hover:text-neutral-800 active:scale-95"
            aria-label="Refresh"
            type="button"
          >
            <RefreshCw size={15} className={loadingAddresses ? 'animate-spin text-[var(--color-primary)]' : ''} />
          </button>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold shadow-sm transition-all active:scale-95 ${
              showForm
                ? 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                : 'bg-[var(--color-primary)] text-[var(--color-secondary)] hover:brightness-95'
            }`}
            aria-label={showForm ? 'Cancel' : 'Add address'}
            type="button"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            <span className="hidden sm:inline">{showForm ? 'Close' : 'Add new'}</span>
          </button>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
          <div className="flex items-center gap-3 border-b border-neutral-100 bg-gradient-to-r from-[var(--color-primary)]/10 via-transparent to-transparent px-6 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
              {editingId ? <Pencil size={16} /> : <MapPin size={16} />}
            </span>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                {editingId ? 'Edit address' : 'Add a new address'}
              </h2>
              <p className="text-xs text-neutral-500">Fields marked * are required</p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            {/* Label segmented control */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Save as</p>
              <div className="inline-flex rounded-xl bg-neutral-100 p-1">
                {LABELS.map(({ value, text, icon: Icon }) => {
                  const active = label === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLabel(value)}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        active
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      <Icon size={14} className={active ? 'text-[var(--color-primary)]' : ''} />
                      {text}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-600">Street address *</label>
                <input
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Street, area, landmark"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral-600">Apartment / suite</label>
                <input
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Unit, building, floor (optional)"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-600">City</label>
                  <div className="relative">
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`${inputCls} appearance-none pr-10`}
                    >
                      {CITIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-600">Postal code</label>
                  <input
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    placeholder="e.g. 75500"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Coordinates (collapsible) */}
            <div>
              <button
                type="button"
                onClick={() => setShowCoords((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-[var(--color-primary)]"
              >
                <ChevronDown size={14} className={`transition-transform ${showCoords ? 'rotate-180' : ''}`} />
                {showCoords ? 'Hide coordinates' : 'Add coordinates (optional)'}
              </button>
              {showCoords && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="Latitude"
                    className={inputCls}
                  />
                  <input
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="Longitude"
                    className={inputCls}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={!line1.trim() || saving}
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-[var(--color-secondary)] shadow-sm transition-all hover:brightness-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {editingId ? 'Update address' : 'Save address'}
              </button>
              <button
                onClick={resetForm}
                type="button"
                className="rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loadingAddresses && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-neutral-100 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-neutral-100" />
                <div className="h-4 w-20 rounded-full bg-neutral-100" />
              </div>
              <div className="mb-2 h-4 w-3/4 rounded bg-neutral-100" />
              <div className="h-3 w-1/2 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && !showForm && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 px-6 py-16 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <MapPin size={28} />
          </span>
          <h3 className="text-base font-bold text-neutral-900">No addresses yet</h3>
          <p className="mt-1 max-w-xs text-sm text-neutral-500">
            Save an address to speed up checkout and get your orders delivered faster.
          </p>
          <button
            onClick={() => setShowForm(true)}
            type="button"
            className="mt-6 flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-secondary)] shadow-sm transition-all hover:brightness-95 active:scale-95"
          >
            <Plus size={16} /> Add your first address
          </button>
        </div>
      )}

      {/* Address grid */}
      {!loadingAddresses && displayList.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {displayList.map((addr: any) => {
            const id = Number(addr.id)
            const lbl: AddrLabel = (addr.label as AddrLabel) || 'other'
            const styles = LABEL_STYLES[lbl] ?? LABEL_STYLES.other
            const meta = LABELS.find((l) => l.value === lbl) ?? LABELS[2]
            const Icon = meta.icon
            const isConfirming = confirmDeleteId === id
            const isDeleting = addrDeleter.isPending && isConfirming
            const isEditing = editingId === id

            return (
              <div
                key={id}
                className={`group relative flex flex-col rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgb(0,0,0,0.07)] ${
                  isEditing ? 'border-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/10' : 'border-neutral-200'
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.icon}`}>
                      <Icon size={18} />
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${styles.chip}`}>
                      {meta.text}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold leading-snug text-neutral-900">
                  {addr.line1 || addr.address || '—'}
                </p>
                {addr.line2 && <p className="mt-1 text-xs text-neutral-500">{addr.line2}</p>}
                <p className="mt-1 text-xs text-neutral-400">
                  {[addr.city, addr.postal_code || addr.zipcode].filter(Boolean).join(', ')}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                  {isConfirming ? (
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-xs font-medium text-neutral-600">Delete this address?</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50"
                        >
                          No
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => {
                            addrDeleter.deleteAddress({ customer_address_id: id })
                            setConfirmDeleteId(null)
                          }}
                          className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                        >
                          {isDeleting && <Loader2 size={12} className="animate-spin" />}
                          Yes, delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(addr)}
                        aria-label="Edit address"
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(id)}
                        aria-label="Delete address"
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ProfileLayout>
  )
}