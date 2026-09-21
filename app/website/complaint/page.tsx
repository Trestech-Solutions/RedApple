'use client'

import { useForm, Controller } from 'react-hook-form'
import Image from 'next/image'
import { useSubmitComplaint } from '@/api/client/customer'
import { getRestaurantId } from '@/api/utils'

// ── Types ──────────────────────────────────────────────────────────────────

type ComplaintType = 'Takeaway' | 'Delivery'
type DeliveryMethod = 'Food Panda' | 'Website, Phone or Facebook'
type Title = 'Mr.' | 'Mrs.' | 'Ms.' | 'Miss.'

type FormValues = {
  complaintType: ComplaintType
  deliveryMethod: DeliveryMethod | null
  title: Title
  name: string
  phone: string
  orderCode: string
  branch: string
  dateOfVisit: string
  description: string
}

const TITLES: Title[] = ['Mr.', 'Mrs.', 'Ms.', 'Miss.']
const COMPLAINT_TYPES: ComplaintType[] = ['Takeaway', 'Delivery']
const DELIVERY_METHODS: DeliveryMethod[] = ['Food Panda', 'Website, Phone or Facebook']

// Map UI values to backend API values
const TITLE_MAP: Record<Title, 'mr' | 'mrs' | 'ms' | 'miss'> = {
  'Mr.': 'mr', 'Mrs.': 'mrs', 'Ms.': 'ms', 'Miss.': 'miss',
}
const DELIVERY_METHOD_MAP: Record<DeliveryMethod, 'foodpanda' | 'website_phone_facebook'> = {
  'Food Panda': 'foodpanda',
  'Website, Phone or Facebook': 'website_phone_facebook',
}

const DEFAULT_VALUES: FormValues = {
  complaintType: 'Takeaway',
  deliveryMethod: null,
  title: 'Mr.',
  name: '',
  phone: '',
  orderCode: '',
  branch: '',
  dateOfVisit: '',
  description: '',
}

// ── Small reusable pieces ────────────────────────────────────────────────
// Toggle buttons (Takeaway/Delivery, Food Panda/Website...) aren't native
// form elements, so Controller is the natural fit for them.

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded px-6 py-2 text-sm font-semibold border transition-colors ${
            value === option
              ? 'border-[#000000] text-[#000000] bg-white'
              : 'border-neutral-300 text-neutral-700 bg-white hover:border-[#000000]'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function TextField({
  label,
  hint,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-neutral-800">{label}</label>
      <input
        {...inputProps}
        className="w-full rounded border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000]"
      />
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function SubmitComplaintPage() {
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitSuccessful },
  } = useForm<FormValues>({ defaultValues: DEFAULT_VALUES })

  const complaintType  = watch('complaintType')
  const deliveryMethod = watch('deliveryMethod')

  const showFoodPandaMsg = complaintType === 'Delivery' && deliveryMethod === 'Food Panda'
  const showForm =
    complaintType === 'Takeaway' ||
    (complaintType === 'Delivery' && deliveryMethod === 'Website, Phone or Facebook')

  const { submitComplaint, isPending } = useSubmitComplaint()

  const onSubmit = (data: FormValues) => {
    submitComplaint({
      restaurant:            Number(getRestaurantId()),
      complaint_type:        data.complaintType === 'Takeaway' ? 'takeaway' : 'delivery',
      delivery_method:       data.deliveryMethod ? DELIVERY_METHOD_MAP[data.deliveryMethod] : '',
      title:                 TITLE_MAP[data.title],
      customer_name:         data.name,
      customer_phone:        data.phone,
      order_code:            data.orderCode || undefined,
      date_of_visit:         data.dateOfVisit || null,
      complaint_description: data.description,
    }, {
      onSuccess: () => reset(DEFAULT_VALUES),
    })
  }

  return (
    <div className="min-h-screen font-sans text-neutral-800">
      <HeroBanner />

      <section className="mx-auto max-w-[900px] px-4 py-10 md:px-8">
        {isSubmitSuccessful ? (
          <SuccessPanel onReset={() => reset(DEFAULT_VALUES)} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Complaint type */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-bold text-neutral-800">Complaint relating to:</p>
              <Controller
                name="complaintType"
                control={control}
                render={({ field }) => (
                  <ToggleGroup
                    options={COMPLAINT_TYPES}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v)
                      // reset dependent field whenever complaint type changes
                      setValue('deliveryMethod', null)
                    }}
                  />
                )}
              />
            </div>

            {/* Delivery method */}
            {complaintType === 'Delivery' && (
              <div className="mb-8">
                <p className="mb-3 text-sm font-bold text-neutral-800">
                  Please Select the Method Of Delivery:
                </p>
                <Controller
                  name="deliveryMethod"
                  control={control}
                  render={({ field }) => (
                    <ToggleGroup options={DELIVERY_METHODS} value={field.value} onChange={field.onChange} />
                  )}
                />
                {showFoodPandaMsg && (
                  <p className="mt-5 text-sm text-neutral-700">
                    kindly contact Foodpanda on their help center.
                  </p>
                )}
              </div>
            )}

            {/* Rest of the form */}
            {showForm && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-neutral-800">
                      Customer Name
                    </label>
                    <div className="flex gap-2">
                      <select
                        {...register('title')}
                        className="rounded border border-neutral-300 px-2 py-2.5 text-sm outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000]"
                      >
                        {TITLES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        {...register('name', { required: true })}
                        type="text"
                        className="flex-1 rounded border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000]"
                      />
                    </div>
                  </div>

                  <TextField label="Customer Phone" type="tel" {...register('phone', { required: true })} />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <TextField label="Order Code" type="text" {...register('orderCode')} />
                  <TextField label="Branch" type="text" {...register('branch', { required: true })} />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <TextField
                    label="Date of Visit"
                    hint="(require receipt or proof of visit / sale)"
                    type="date"
                    {...register('dateOfVisit', { required: true })}
                  />
                  <TextField
                    label="Complaint Description"
                    type="text"
                    {...register('description', { required: true })}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded bg-[#000000] px-10 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isPending ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </section>
    </div>
  )
}

// ── Layout fragments ─────────────────────────────────────────────────────

function HeroBanner() {
  return (
    <section className="relative h-56 overflow-hidden sm:h-72">
      <Image
        src="https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=1600&auto=format&fit=crop"
        alt="We are here to help"
        fill
        priority
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 z-10"
        style={{ background: 'linear-gradient(105deg, #ffffff 0%, #ffffff 52%, transparent 52%)' }}
      />
      <div className="absolute inset-0 z-20 flex items-center px-8 md:px-16">
        <h1 className="text-4xl font-extrabold uppercase leading-tight text-neutral-900 sm:text-5xl md:text-6xl">
          WE ARE
          <br />
          HERE TO HELP
        </h1>
      </div>
    </section>
  )
}

function SuccessPanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-xl bg-green-50 border border-green-200 p-10 text-center">
      <p className="text-2xl font-bold text-green-700 mb-2">Complaint Submitted!</p>
      <p className="text-sm text-green-600">
        Thank you for reaching out. Our team will review your complaint and get back to you shortly.
      </p>
      <button
        onClick={onReset}
        className="mt-6 rounded-full bg-[#000000] px-8 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
      >
        Submit Another
      </button>
    </div>
  )
}