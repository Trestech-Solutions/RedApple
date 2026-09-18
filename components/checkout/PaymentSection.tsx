'use client'

import { Controller, useWatch } from 'react-hook-form'
import type { Control, UseFormRegister } from 'react-hook-form'
import type { CheckoutFormValues } from '@/components/checkout/types'

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000] placeholder:text-neutral-400'
const labelClass = 'mb-2 block text-sm font-semibold text-neutral-700'

interface PaymentSectionProps {
  control: Control<CheckoutFormValues>
  register: UseFormRegister<CheckoutFormValues>
  orderType: string
}

export function PaymentSection({ control, register, orderType }: PaymentSectionProps) {
  const payment = useWatch({ control, name: 'payment' })

  return (
    <div className="space-y-3">
      <label className={labelClass}>Payment Method</label>
      <Controller
        name="payment"
        control={control}
        render={({ field }) => (
          <div className="flex gap-3">
            {(['cod', 'online'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => field.onChange(p)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                  field.value === p
                    ? 'border-[#000000] bg-[#000000]/5 text-[#000000]'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                {p === 'cod'
                  ? (orderType === 'pickup' ? 'Pay at Pickup' : 'Cash on Delivery')
                  : 'Online Payment'}
              </button>
            ))}
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
    </div>
  )
}
