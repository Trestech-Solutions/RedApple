'use client'

import { Controller, useWatch } from 'react-hook-form'
import type { Control, UseFormRegister } from 'react-hook-form'
import type { CheckoutFormValues } from '@/components/checkout/types'
import type { StoreSettingsDerived } from '@/lib/hooks/useCart'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000] placeholder:text-neutral-400'
const labelClass = 'mb-2 block text-sm font-semibold text-neutral-700'

interface PaymentSectionProps {
  control: Control<CheckoutFormValues>
  register: UseFormRegister<CheckoutFormValues>
  orderType: string
  settings: StoreSettingsDerived
}

export function PaymentSection({ control, register, orderType, settings }: PaymentSectionProps) {
  const payment = useWatch({ control, name: 'payment' })
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField((prev) => (prev === fieldId ? null : prev)), 1500)
    } catch { /* ignore */ }
  }

  const parseBankDetails = (raw: string): Array<{ label: string; value: string }> => {
    if (!raw.trim()) return []
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    return lines.map((line) => {
      const parts = line.split(/:|：|\|—|- – |->|»|=/)
      if (parts.length >= 2) {
        const label = parts[0].trim()
        const value = parts.slice(1).join(':').trim()
        return { label: label || 'Detail', value }
      }
      return { label: '', value: line }
    })
  }

  const bankRows = settings.bankDetails ? parseBankDetails(settings.bankDetails) : []
  const showOnline = settings.onlineTaxEnabled || settings.bankDetails.length > 0

  return (
    <div className="space-y-3">
      <label className={labelClass}>Payment Method</label>
      <Controller
        name="payment"
        control={control}
        render={({ field }) => (
          <div className="flex gap-3">
            <button
              key="cod"
              type="button"
              onClick={() => field.onChange('cod')}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                field.value === 'cod'
                  ? 'border-[#000000] bg-[#000000]/5 text-[#000000]'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {orderType === 'pickup' ? 'Pay at Pickup' : 'Cash on Delivery'}
            </button>
            <button
              key="online"
              type="button"
              onClick={() => { if (showOnline) field.onChange('online') }}
              disabled={!showOnline}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                field.value === 'online'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : !showOnline
                    ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed line-through'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
              title={!showOnline ? 'Online payment disabled by admin (enable "Online Tax Status" in settings)' : ''}
            >
              Online Payment
            </button>
          </div>
        )}
      />

      {payment === 'cod' && (
        <div>
          <label className={labelClass}>Change for (Rs.)</label>
          <input
            {...register('changeAmount')}
            type="number"
            placeholder="500"
            className={inputClass}
          />
        </div>
      )}

      {payment === 'online' && (
        <div className="space-y-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <label className={`${labelClass} !mb-0 flex items-center gap-1.5`}>
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              Bank / Transfer Details
            </label>
            {settings.onlineTaxRate > 0 && (
              <span className="rounded-full bg-[var(--color-primary)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                +{Math.round(settings.onlineTaxRate * 100)}% tax applied
              </span>
            )}
          </div>

          {settings.bankDetails.trim() === '' ? (
            <p className="text-xs text-neutral-500 italic">
              No bank details configured yet. Please contact merchant for payment info.
            </p>
          ) : bankRows.length === 1 ? (
            <div className="whitespace-pre-wrap rounded-lg border border-neutral-200 bg-white/70 p-3 text-sm text-neutral-700 leading-relaxed font-mono">
              {settings.bankDetails}
            </div>
          ) : (
            <div className="space-y-1.5">
              {bankRows.map((row, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-baseline gap-2">
                    {row.label && (
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-neutral-500 w-24">
                        {row.label}
                      </span>
                    )}
                    <span className="truncate font-mono text-neutral-800">{row.value}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(row.value, `bank-${i}`)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-neutral-500 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedField === `bank-${i}`
                      ? <><Check size={12} /> Copied</>
                      : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-neutral-500 border-t border-neutral-200/60 pt-2">
            🔒 After transferring, mention your <strong>order number / phone number</strong> in the remarks/payment description so we can confirm.
          </p>
        </div>
      )}
    </div>
  )
}
