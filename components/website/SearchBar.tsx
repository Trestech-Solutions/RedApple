'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const TYPEWRITER_PHRASES = [
  'Search for Baby Melon',
  'Search for New Arrivals',
  'Search for Fresh Mithai',
  'Search for Cakes & Pastries',
  'Search for Fast Food',
]

const TYPE_SPEED   = 90
const DELETE_SPEED = 45
const HOLD_AFTER_TYPE_MS   = 1400
const HOLD_AFTER_DELETE_MS = 400

export function SearchBar({ value, onChange, placeholder = 'Search products...' }: SearchBarProps) {
  const [displayText, setDisplayText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && displayText.length < currentPhrase.length) {
      timeout = setTimeout(
        () => setDisplayText(currentPhrase.slice(0, displayText.length + 1)),
        TYPE_SPEED + Math.random() * 50
      )
    } else if (!deleting && displayText.length === currentPhrase.length) {
      timeout = setTimeout(() => setDeleting(true), HOLD_AFTER_TYPE_MS)
    } else if (deleting && displayText.length > 0) {
      timeout = setTimeout(
        () => setDisplayText(currentPhrase.slice(0, displayText.length - 1)),
        DELETE_SPEED
      )
    } else if (deleting && displayText.length === 0) {
      setDeleting(false)
      timeout = setTimeout(
        () => setPhraseIndex((i) => (i + 1) % TYPEWRITER_PHRASES.length),
        HOLD_AFTER_DELETE_MS
      )
    }

    return () => clearTimeout(timeout)
  }, [displayText, deleting, phraseIndex])

  const animatedPlaceholder = value ? placeholder : displayText

  return (
    <div className="mx-auto max-w-[1400px] px-3 pt-5 sm:px-4 sm:pt-6 md:px-8">
      <div className="flex items-center overflow-hidden rounded-full border border-neutral-300 bg-white shadow-sm transition-shadow focus-within:shadow-md focus-within:border-[var(--color-primary)]">
        <Search className="ml-3 h-3.5 w-3.5 shrink-0 text-neutral-400 sm:ml-4 sm:h-4 sm:w-4" />
        <input
          type="text"
          placeholder={animatedPlaceholder || placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-2 py-2.5 text-xs text-neutral-800 outline-none placeholder:text-neutral-400 sm:px-3 sm:py-3 sm:text-sm"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="mr-1.5 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors sm:mr-2"
          >
            <X size={13} className="sm:hidden" />
            <X size={14} className="hidden sm:block" />
          </button>
        )}
        <button
          aria-label="Search"
          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-secondary)] hover:brightness-90 transition-colors sm:mr-1.5 sm:h-9 sm:w-9"
        >
          <Search size={13} className="sm:hidden" />
          <Search size={15} className="hidden sm:block" />
        </button>
      </div>
    </div>
  )
}
