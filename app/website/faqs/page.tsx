'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { useGetFAQs } from '@/api/client/content'
import { useStoreSettings } from '@/lib/hooks/useCart'
import type { StorefrontFAQGroup } from '@/api/client/content'

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-neutral-200 mx-auto" />
      <div className="h-4 w-64 rounded bg-neutral-100 mx-auto" />
      <div className="mt-8 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}

// ─── Single accordion item ─────────────────────────────────────────────────────

function FAQItem({
  question,
  answer,
  primaryColor,
}: {
  question: string
  answer: string
  primaryColor: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors duration-200 ${
        open ? 'border-transparent shadow-md' : 'border-neutral-200 hover:border-neutral-300'
      }`}
      style={open ? { borderColor: `${primaryColor}30` } : {}}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-neutral-800 sm:text-[15px]">{question}</span>
        <ChevronDown
          size={18}
          className="shrink-0 text-neutral-400 transition-transform duration-300"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: open ? primaryColor : undefined,
          }}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '600px' : '0px' }}
      >
        <div className="border-t border-neutral-100 px-5 py-4">
          <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">{answer}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Category section ──────────────────────────────────────────────────────────

function FAQGroup({
  group,
  primaryColor,
}: {
  group: StorefrontFAQGroup
  primaryColor: string
}) {
  if (group.faqs.length === 0) return null

  return (
    <div className="space-y-3">
      {group.id !== null && (
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-neutral-100" />
          <h2
            className="shrink-0 text-xs font-bold uppercase tracking-widest"
            style={{ color: primaryColor }}
          >
            {group.name}
          </h2>
          <div className="h-px flex-1 bg-neutral-100" />
        </div>
      )}
      {group.faqs.map((faq) => (
        <FAQItem
          key={faq.id}
          question={faq.question}
          answer={faq.answer}
          primaryColor={primaryColor}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FAQsPage() {
  const { data: groups = [], isLoading } = useGetFAQs()
  const { settings } = useStoreSettings()

  const primaryColor = settings.primary_color || '#000000'

  const totalFAQs = groups.reduce((sum, g) => sum + g.faqs.length, 0)

  if (isLoading) return <Skeleton />

  return (
    <div className="min-h-screen font-sans text-neutral-800">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="py-14 text-center text-white px-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 mb-4">
          <HelpCircle size={26} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Frequently Asked Questions</h1>
        <p className="mt-3 text-sm text-white/80 max-w-md mx-auto">
          {totalFAQs > 0
            ? `${totalFAQs} question${totalFAQs !== 1 ? 's' : ''} answered`
            : 'Find answers to common questions below.'}
        </p>
      </section>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[760px] px-4 py-12 md:px-6">
        {totalFAQs === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 py-20 text-center">
            <HelpCircle size={32} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-500">No FAQs available yet.</p>
            <Link href="/" className="mt-4 inline-block text-sm font-semibold underline" style={{ color: primaryColor }}>
              Back to menu
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <FAQGroup
                key={group.id ?? 'uncategorized'}
                group={group}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {totalFAQs > 0 && (
        <section className="border-t border-neutral-100 py-10 text-center px-4">
          <p className="text-sm text-neutral-500">
            Still have questions?{' '}
            <Link href="/website/contact" className="font-semibold underline" style={{ color: primaryColor }}>
              Contact us
            </Link>
          </p>
        </section>
      )}
    </div>
  )
}
