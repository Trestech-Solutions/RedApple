'use client'

import { useMemo, useState } from 'react'
import { MapPin, Search, Loader2, RefreshCw, Truck, ShoppingBag } from 'lucide-react'
import { useGetBranches } from '@/api/client/browse'

// ── Types ──────────────────────────────────────────────────────────────────
// Shape returned by /branches — keep this in sync with the API.

type Branch = {
  id: number
  branch_name: string
  status: boolean
  location: string
  address: string
  map_location: string // "lat,lng"
  is_default: boolean
  pickup_status: boolean
  delivery_status: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────

function parseMapLocation(mapLocation: string): { lat: number; lng: number } | null {
  const [lat, lng] = mapLocation.split(',').map(Number)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

function mapsUrlFor(branch: Branch) {
  const coords = parseMapLocation(branch.map_location)
  if (coords) return `https://maps.google.com/?q=${coords.lat},${coords.lng}`
  return `https://maps.google.com/?q=${encodeURIComponent(`${branch.branch_name} ${branch.location}`)}`
}

function matchesSearch(branch: Branch, query: string) {
  const q = query.toLowerCase()
  return (
    branch.branch_name.toLowerCase().includes(q) ||
    branch.location.toLowerCase().includes(q) ||
    (branch.address || '').toLowerCase().includes(q)
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const [search, setSearch] = useState('')
  const { data: branches = [], isLoading, isError, refetch } = useGetBranches()

  const filtered = useMemo(
    () =>
      (branches as Branch[])
        .filter((b) => b.status) // only show active branches
        .filter((b) => matchesSearch(b, search)),
    [branches, search]
  )

  return (
    <div className="min-h-screen font-sans text-neutral-800">
      <Header search={search} onSearchChange={setSearch} />

      <section className="mx-auto max-w-[1320px] px-4 pb-14 md:px-8">
        {isLoading && <LoadingState />}
        {isError && !isLoading && <ErrorState onRetry={refetch} />}
        {!isLoading && !isError && filtered.length === 0 && search && <EmptyState query={search} />}

        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <p className="mb-4 text-xs text-neutral-400">
              {filtered.length} branch{filtered.length !== 1 ? 'es' : ''} found
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((branch) => (
                <BranchCard key={branch.id} branch={branch} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

// ── Sections ─────────────────────────────────────────────────────────────

function Header({ search, onSearchChange }: { search: string; onSearchChange: (v: string) => void }) {
  return (
    <section className="mx-auto max-w-[1320px] px-4 pt-16 pb-6 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-neutral-900 sm:text-4xl">
          Find Our Stores
        </h1>
        <a
          href="tel:021111022022"
          className="text-xl font-extrabold text-neutral-900 hover:text-[#000000] transition-colors sm:text-2xl"
        >
          UAN: 021-111-022-022
        </a>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search branch or area…"
          className="w-full rounded border border-neutral-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000] transition"
        />
      </div>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-neutral-500">
      <Loader2 size={20} className="animate-spin text-[#000000]" />
      <span className="text-sm">Loading branches…</span>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-neutral-500">Failed to load branches.</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#000000] px-5 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
      >
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <p className="py-10 text-center text-sm text-neutral-400">
      No branches found for &ldquo;{query}&rdquo;.
    </p>
  )
}

// ── Branch card ──────────────────────────────────────────────────────────

function BranchCard({ branch }: { branch: Branch }) {
  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wide text-neutral-900">
        {branch.branch_name}
      </h2>

      <span className="mb-3 self-start rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-neutral-500">
        {branch.location}
      </span>

      {branch.address && (
        <p className="flex-1 text-xs leading-relaxed text-neutral-500 mb-3">{branch.address}</p>
      )}

      <div className="mb-3 flex gap-2">
        {branch.pickup_status && <ServiceBadge icon={ShoppingBag} label="Pickup" />}
        {branch.delivery_status && <ServiceBadge icon={Truck} label="Delivery" />}
      </div>

      <div className="flex flex-wrap gap-2 mt-auto">
        <a
          href={mapsUrlFor(branch)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-[#000000] hover:text-[#000000] transition-colors"
        >
          <MapPin size={11} />
          View on Map
        </a>
      </div>
    </div>
  )
}

function ServiceBadge({ icon: Icon, label }: { icon: typeof Truck; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-700">
      <Icon size={11} />
      {label}
    </span>
  )
}