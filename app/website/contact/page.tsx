'use client'

import { useState } from 'react'
import { useSubmitContactUs } from '@/api/client/customer'
import { getRestaurantId } from '@/api/utils'

// ── Styles (theme: --color-primary / --color-secondary) ─────────────────

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all hover:border-neutral-300 focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]'

const primaryBtnCls =
  'bg-[var(--color-primary)] text-white shadow-lg shadow-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-secondary)] active:translate-y-0'

const EMPTY_FORM = { name: '', email: '', phone: '', message: '' }

// ── Page ─────────────────────────────────────────────────────────────────

export default function ContactUsPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)

  const { submitContactUs, isPending } = useSubmitContactUs({
    onSuccess: () => setSubmitted(true),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitContactUs({
      restaurant: Number(getRestaurantId()),
      full_name:  form.name,
      email:      form.email,
      phone:      form.phone,
      message:    form.message,
    })
  }

  const reset = () => {
    setSubmitted(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800">
      {/* Header band — solid color */}
      <section className="bg-[var(--color-primary)] px-4 pb-28 pt-16 text-center md:px-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/90">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)] ring-2 ring-white/60" />
          Get in touch
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Contact Us</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/75">
          Please fill the form and our team will be in touch with you as soon as possible.
        </p>
      </section>

      {/* Card */}
      <section className="relative z-10 mx-auto -mt-16 max-w-[820px] px-4 pb-20 md:px-8">
        <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] sm:p-10">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_15%,white)]">
                <svg className="h-8 w-8 text-[var(--color-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="mb-2 text-2xl font-bold tracking-tight text-neutral-900">Thank you!</p>
              <p className="mx-auto max-w-sm text-sm text-neutral-500">
                Your message has been received. We will get back to you shortly.
              </p>
              <button
                onClick={reset}
                className={`mt-8 rounded-xl px-8 py-3 text-sm font-bold ${primaryBtnCls}`}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="03XX XXXXXXX"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  rows={5}
                  className={`${inputCls} resize-none`}
                />
              </div>

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
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}