'use client'

import { useState, useEffect as reactUseEffect } from 'react'
import { Pencil, RefreshCw, Loader2 } from 'lucide-react'
import { useCart } from '@/lib/hooks/useCart'
import { ProfileLayout } from '@/components/website/ProfileLayout'
import { useGetMyProfile, useUpdateMyProfile } from '@/api/client/customer'
import type { UpdateCustomerPayload } from '@/api/types'

export default function ProfilePage() {
  const { user, setUser } = useCart()

  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState('')
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')

  const { data: profile, isLoading: profileLoading, refetch } = useGetMyProfile({ enabled: !!user })

  const updater = useUpdateMyProfile({
    onSuccess(p) {
      // Sync back to CartContext as well
      setUser({
        name: [p.user?.first_name, p.user?.last_name].filter(Boolean).join(' ').trim() || name,
        phone: p.phone || user?.phone || '',
        email: p.user?.email,
        gender: ((p.gender ?? p.user?.gender) as 'Male' | 'Female') || gender,
      })
    },
  })

  reactUseEffect(() => {
    // Seed form from API when available, otherwise fallback to CartContext user
    if (profile) {
      const fn = profile.user?.first_name || ''
      const ln = profile.user?.last_name || ''
      setFirstName(fn)
      setLastName(ln)
      setName([fn, ln].filter(Boolean).join(' ').trim() || name)
      setEmail(profile.user?.email ?? '')
      const profileGender = profile.gender ?? profile.user?.gender
      const g: 'Male' | 'Female' | 'Other' =
        profileGender === 'Male' || profileGender === 'Female' ? profileGender :
        (profileGender ? 'Other' : 'Male')
      setGender(g)
    } else if (user) {
      setName(user.name)
      setEmail(user.email ?? '')
      setGender(user.gender ?? 'Male')
    }
  }, [profile, user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  const handleUpdate = () => {
    if (!firstName && !lastName && name) {
      const parts = name.split(' ')
      setFirstName(parts[0] ?? '')
      setLastName(parts.slice(1).join(' ') ?? '')
    }
    const payload: UpdateCustomerPayload = {
      first_name: firstName || name.split(' ')[0] || '',
      last_name: lastName || name.split(' ').slice(1).join(' ') || undefined,
      email: email || undefined,
      gender: gender === 'Other' ? undefined : gender,
    }
    updater.updateProfile(payload)
    // Also update CartContext synchronously for immediate UI feedback
    setUser({ ...user, name: name || user.name, email, gender: (gender === 'Other' ? undefined : gender) ?? user.gender })
  }

  return (
    <ProfileLayout>
      <h1 className="mb-6 text-center text-2xl font-bold text-neutral-900">Profile</h1>

      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm space-y-5">

        {/* Loaded from API badge */}
        {profileLoading && (
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Loader2 size={12} className="animate-spin" /> Loading profile from server…
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Full Name</label>
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                const parts = e.target.value.split(' ')
                setFirstName(parts[0] ?? '')
                setLastName(parts.slice(1).join(' ') ?? '')
              }}
              className="flex-1 rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <Pencil size={15} className="shrink-0 text-neutral-400" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Email Address</label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="flex-1 rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <button
              onClick={() => refetch()}
              type="button"
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap"
            >
              <RefreshCw size={12} /> Update Email
            </button>
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">Gender</label>
          <div className="flex gap-6">
            {(['Male', 'Female', 'Other'] as const).map((g) => (
              <label key={g} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                <input
                  type="radio"
                  checked={gender === g}
                  onChange={() => setGender(g)}
                  className="accent-[var(--color-primary)]"
                />
                {g}
              </label>
            ))}
          </div>
        </div>

        {/* Mobile — read-only */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Mobile Number</label>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2.5">
            <span className="text-sm text-neutral-400">🇵🇰 +92</span>
            <span className="text-sm text-neutral-700">{profile?.phone ? profile.phone.replace(/^0/, '') : user.phone.replace(/^0/, '')}</span>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={updater.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-[var(--color-secondary)] hover:brightness-90 transition-colors disabled:opacity-50"
        >
          {updater.isPending ? <><Loader2 size={15} className="animate-spin" />Saving…</> : 'Update Profile'}
        </button>
      </div>
    </ProfileLayout>
  )
}
