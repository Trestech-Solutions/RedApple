'use client'

import { useState, useEffect as reactUseEffect } from 'react'
import { MapPin, Plus, X, Trash2, Loader2, Edit3 } from 'lucide-react'
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

export default function AddressesPage() {
  const { user } = useCart()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [line1, setLine1]       = useState('')
  const [line2, setLine2]       = useState('')
  const [city, setCity]         = useState('Karachi')
  const [postal, setPostal]     = useState('')
  const [label, setLabel]       = useState<'home' | 'office' | 'other'>('home')
  const [lat, setLat]           = useState<string>('')
  const [lng, setLng]           = useState<string>('')

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
    setShowForm(false); setEditingId(null)
    setLine1(''); setLine2(''); setCity('Karachi'); setPostal('')
    setLabel('home'); setLat(''); setLng('')
  }

  function startEdit(a: any) {
    setEditingId(Number(a.id))
    setLine1(a.line1 || a.address || '')
    setLine2(a.line2 || '')
    setCity(a.city || 'Karachi')
    setPostal(a.postal_code || a.zipcode || '')
    setLabel((a.label as any) || 'other')
    setLat(a.latitude ? String(a.latitude) : '')
    setLng(a.longitude ? String(a.longitude) : '')
    setShowForm(true)
  }

  const displayList = apiAddresses && apiAddresses.length > 0
    ? apiAddresses
    : (useCart().addresses.map((a) => ({
        id: Number(a.id),
        line1: a.line1, city: a.city, label: 'other' as any,
      })))

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

  const saving = addrAdder.isPending || addrUpdater.isPending || addrDeleter.isPending

  return (
    <ProfileLayout>
      {/* Header row */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-neutral-900">
          <MapPin size={20} className="text-[var(--color-primary)]" />
          Addresses
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:text-neutral-700 transition-colors"
            aria-label="Refresh"
            type="button"
          >
            <Loader2 size={14} className={loadingAddresses ? 'animate-spin text-[var(--color-primary)]' : ''} />
          </button>
          <button
            onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            aria-label={showForm ? 'Cancel' : 'Add address'}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
          </button>
        </div>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="mb-5 rounded-xl border border-[var(--color-primary)]/30 bg-white p-5 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-[var(--color-primary)]">
            {editingId ? 'EDIT ADDRESS' : 'NEW ADDRESS'}
          </p>
          <input
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="Street address, area, landmark *"
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          <input
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Apartment, suite, unit, building, floor (optional)"
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              placeholder="Postal / ZIP code"
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr_1fr]">
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value as any)}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              <option value="home">🏠 Home</option>
              <option value="office">💼 Office</option>
              <option value="other">📍 Other</option>
            </select>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude (optional)"
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Longitude (optional)"
              className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!line1.trim() || saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-bold text-[var(--color-secondary)] hover:brightness-90 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? 'Update Address' : 'Save Address'}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loadingAddresses && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-500">
          <Loader2 size={14} className="animate-spin text-[var(--color-primary)]" /> Loading addresses…
        </div>
      )}

      {/* Address grid */}
      {!loadingAddresses && displayList.length === 0 && !showForm ? (
        <p className="py-10 text-center text-sm text-neutral-400">No addresses saved yet. Click + to add one.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {displayList.map((addr: any) => {
            const id = Number(addr.id)
            const lbl: 'home' | 'office' | 'other' | undefined = addr.label
            const badgeColor =
              lbl === 'home'   ? 'bg-blue-100 text-blue-700'   :
              lbl === 'office' ? 'bg-amber-100 text-amber-700' :
                                   'bg-neutral-100 text-neutral-600'
            return (
              <div
                key={id}
                className="relative rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                {lbl && (
                  <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${badgeColor}`}>
                    {lbl}
                  </span>
                )}
                <p className="pr-6 text-sm font-semibold text-neutral-800">
                  {addr.line1 || addr.address || '—'}
                </p>
                {addr.line2 && <p className="text-xs text-neutral-500 mt-0.5">{addr.line2}</p>}
                <p className="mt-0.5 text-xs text-neutral-400">
                  {addr.city}{addr.postal_code ? `, ${addr.postal_code}` : ''},
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => startEdit(addr)}
                    aria-label="Edit address"
                    type="button"
                    className="flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-[var(--color-primary)] transition-colors"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this address?')) addrDeleter.deleteAddress({ customer_address_id: id }) }}
                    aria-label="Delete address"
                    type="button"
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ProfileLayout>
  )
}
