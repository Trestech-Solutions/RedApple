'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Stay expanded while focused or while there is text in the box
  const expanded = focused || !!value

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
    <div id="search-bar" className="mx-auto max-w-[1400px] px-4 pt-5 sm:pt-6 md:px-8">
      <div
        className={`mx-auto flex h-12 min-w-[260px] max-w-full items-center rounded-full border bg-white/90 backdrop-blur-xl transition-[width,box-shadow,border-color] duration-500 ease-in-out sm:h-14 ${
          expanded
            ? 'w-full border-[var(--color-primary)] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.28)] ring-4 ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
            : 'w-[92%] border-neutral-200/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] hover:border-neutral-300 sm:w-[65%] md:w-[48%]'
        }`}
      >
        <Search
          className={`ml-4 h-4 w-4 shrink-0 transition-colors duration-200 sm:ml-5 sm:h-5 sm:w-5 ${
            expanded ? 'text-[var(--color-primary)]' : 'text-neutral-400'
          }`}
          strokeWidth={2.25}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={animatedPlaceholder || placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Search"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400 sm:px-4 sm:text-[15px]"
        />
        {value && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 sm:mr-2"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={() => inputRef.current?.focus()}
          aria-label="Search"
          className="mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-secondary)] shadow-md transition-all duration-200 hover:scale-105 hover:brightness-90 active:scale-95 sm:mr-2 sm:h-10 sm:w-10"
        >
          <Search className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}