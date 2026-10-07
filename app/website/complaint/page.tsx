'use client'

import { useForm, Controller } from 'react-hook-form'
import Image from 'next/image'
import { useSubmitComplaint } from '@/api/client/customer'
import { useGetBranches } from '@/api/client/browse'
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
  branch: number | ''
  dateOfVisit: string
  description: string
}

const TITLES: Title[] = ['Mr.', 'Mrs.', 'Ms.', 'Miss.']
const COMPLAINT_TYPES: ComplaintType[] = ['Takeaway', 'Delivery']
const DELIVERY_METHODS: DeliveryMethod[] = ['Food Panda', 'Website, Phone or Facebook']

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

// ── Styles (theme: --color-primary / --color-secondary) ─────────────────

const focusCls =
  'outline-none transition-all hover:border-neutral-300 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]'

const inputCls = `w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 disabled:opacity-50 ${focusCls}`

const errorCls = 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/10'

const primaryBtnCls =
  'bg-[var(--color-primary)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-secondary)] active:translate-y-0'

// ── Small reusable pieces ────────────────────────────────────────────────

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
    <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-[color-mix(in_srgb,var(--color-secondary)_12%,white)] p-1">
      {options.map((option) => {
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              active
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'text-neutral-600 hover:bg-white hover:text-[var(--color-secondary)]'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>
      ) : null}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm font-bold tracking-tight text-neutral-900">{children}</p>
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
    formState: { errors, isSubmitSuccessful },
  } = useForm<FormValues>({ defaultValues: DEFAULT_VALUES })

  const complaintType  = watch('complaintType')
  const deliveryMethod = watch('deliveryMethod')

  const showFoodPandaMsg = complaintType === 'Delivery' && deliveryMethod === 'Food Panda'
  const showForm =
    complaintType === 'Takeaway' ||
    (complaintType === 'Delivery' && deliveryMethod === 'Website, Phone or Facebook')

  const { submitComplaint, isPending } = useSubmitComplaint()
  const { data: branches = [], isLoading: branchesLoading } = useGetBranches()

  const onSubmit = (data: FormValues) => {
    submitComplaint({
      restaurant:            Number(getRestaurantId()),
      branch:                data.branch !== '' ? Number(data.branch) : null,
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
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800">
      <HeroBanner />

      <section className="relative z-30 mx-auto -mt-16 max-w-[820px] px-4 pb-20 md:px-8">
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] sm:p-10">
          {isSubmitSuccessful ? (
            <SuccessPanel onReset={() => reset(DEFAULT_VALUES)} />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Complaint type */}
              <div className="mb-8">
                <SectionLabel>Complaint relating to</SectionLabel>
                <Controller
                  name="complaintType"
                  control={control}
                  render={({ field }) => (
                    <ToggleGroup
                      options={COMPLAINT_TYPES}
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v)
                        setValue('deliveryMethod', null)
                      }}
                    />
                  )}
                />
              </div>

              {/* Delivery method */}
              {complaintType === 'Delivery' && (
                <div className="mb-8">
                  <SectionLabel>How was your order delivered?</SectionLabel>
                  <Controller
                    name="deliveryMethod"
                    control={control}
                    render={({ field }) => (
                      <ToggleGroup options={DELIVERY_METHODS} value={field.value} onChange={field.onChange} />
                    )}
                  />
                  {showFoodPandaMsg && (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-secondary)_35%,white)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,white)] p-4">
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <p className="text-sm text-neutral-800">
                        Kindly contact Foodpanda on their help center for orders placed through their app.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Rest of the form */}
              {showForm && (
                <div className="space-y-6 border-t border-neutral-100 pt-8">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Customer Name" required error={errors.name && 'Name is required'}>
                      <div className="flex gap-2">
                        <select
                          {...register('title')}
                          className={`w-24 shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm ${focusCls}`}
                        >
                          {TITLES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                        <input
                          {...register('name', { required: true })}
                          type="text"
                          placeholder="Full name"
                          className={`${inputCls} ${errors.name ? errorCls : ''}`}
                        />
                      </div>
                    </Field>

                    <Field label="Customer Phone" required error={errors.phone && 'Phone is required'}>
                      <input
                        {...register('phone', { required: true })}
                        type="tel"
                        placeholder="03XX XXXXXXX"
                        className={`${inputCls} ${errors.phone ? errorCls : ''}`}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Order Code" hint="Optional">
                      <input
                        {...register('orderCode')}
                        type="text"
                        placeholder="e.g. #12345"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Branch" required error={errors.branch && 'Please select a branch'}>
                      <select
                        {...register('branch', { required: true })}
                        disabled={branchesLoading}
                        className={`${inputCls} ${errors.branch ? errorCls : ''}`}
                      >
                        <option value="">
                          {branchesLoading ? 'Loading branches…' : 'Select branch'}
                        </option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branch_name || b.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field
                    label="Date of Visit"
                    required
                    error={errors.dateOfVisit && 'Date is required'}
                    hint="Receipt or proof of visit / sale required"
                  >
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      {...register('dateOfVisit', { required: true })}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker?.()
                        } catch {
                          // picker already open or not supported — ignore
                        }
                      }}
                      className={`${inputCls} cursor-pointer ${errors.dateOfVisit ? errorCls : ''}`}
                    />
                  </Field>

                  <Field
                    label="Complaint Description"
                    required
                    error={errors.description && 'Please describe your complaint'}
                  >
                    <textarea
                      rows={5}
                      placeholder="Tell us what went wrong…"
                      {...register('description', { required: true })}
                      className={`${inputCls} resize-none ${errors.description ? errorCls : ''}`}
                    />
                  </Field>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className={`group inline-flex w-full items-center justify-center gap-2 rounded-xl px-10 py-3.5 text-sm font-bold disabled:translate-y-0 disabled:opacity-50 sm:w-auto ${primaryBtnCls}`}
                    >
                      {isPending ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-90" />
                          </svg>
                          Submitting…
                        </>
                      ) : (
                        <>
                          Submit Complaint
                          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

// ── Layout fragments ─────────────────────────────────────────────────────

function HeroBanner() {
  return (
    <section className="relative h-72 overflow-hidden sm:h-80">
      <Image
        src="https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=1600&auto=format&fit=crop"
        alt="We are here to help"
        fill
        priority
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(105deg, color-mix(in srgb, var(--color-primary) 94%, transparent) 0%, color-mix(in srgb, var(--color-primary) 75%, transparent) 50%, color-mix(in srgb, var(--color-secondary) 45%, transparent) 100%)',
        }}
      />
      <div className="absolute inset-0 z-20 mx-auto flex max-w-[1100px] flex-col justify-center px-6 pb-10 md:px-12">
        <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/90 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)] ring-2 ring-white/60" />
          Customer Support
        </span>
        <h1 className="text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
          We are
          <br />
          here to help
        </h1>
        <p className="mt-4 max-w-md text-sm text-white/75">
          Something not right? Share the details and our team will look into it.
        </p>
      </div>
    </section>
  )
}

function SuccessPanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_15%,white)]">
        <svg className="h-8 w-8 text-[var(--color-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="mb-2 text-2xl font-bold tracking-tight text-neutral-900">Complaint Submitted</p>
      <p className="mx-auto max-w-sm text-sm text-neutral-500">
        Thank you for reaching out. Our team will review your complaint and get back to you shortly.
      </p>
      <button
        onClick={onReset}
        className={`mt-8 rounded-xl px-8 py-3 text-sm font-bold ${primaryBtnCls}`}
      >
        Submit Another
      </button>
    </div>
  )
}