import type { BranchBusinessHour } from '@/api/types'

// ─── Day mapping ──────────────────────────────────────────────────────────────
// JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

const JS_DAY_TO_API: Record<number, BranchBusinessHour['day']> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
}

export const DAY_LABELS: Record<BranchBusinessHour['day'], string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse "HH:MM:SS" into total minutes from midnight.
 * Returns null when the string is falsy or malformed.
 */
function toMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0]!, 10)
  const m = parseInt(parts[1]!, 10)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

/** Current local time in minutes from midnight. */
function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

/** Check if `current` is within [start, end] inclusive (minutes). */
function inWindow(start: number, end: number, current: number): boolean {
  // Handle midnight-crossing windows (e.g. 22:00 → 01:00)
  if (end < start) return current >= start || current <= end
  return current >= start && current <= end
}

// ─── Core logic ───────────────────────────────────────────────────────────────

export type StoreStatus =
  | { open: true }
  | {
      open: false
      reason: 'day_closed' | 'outside_hours' | 'no_data'
      /** Human-readable label for the current day, e.g. "Monday" */
      dayLabel: string
      /** Formatted opening time string for today, e.g. "10:00 AM" — null when day is closed */
      opensAt: string | null
      /** Next day that IS open, e.g. "Tuesday 10:00 AM" — null when none found */
      nextOpenLabel: string | null
    }

/**
 * Given the branch_business_hours array from the API, returns whether the
 * store is currently open, and if not, a human-readable explanation.
 *
 * Falls back to `settings.close_store` when no hours data is provided.
 */
export function isStoreOpenNow(
  hours: BranchBusinessHour[] | undefined | null,
  forceClose?: boolean,
): StoreStatus {
  // Explicit force-close from settings.close_store
  if (forceClose) {
    return {
      open: false,
      reason: 'day_closed',
      dayLabel: getTodayDayLabel(),
      opensAt: null,
      nextOpenLabel: null,
    }
  }

  // No data → treat as open (don't block customers on missing data)
  if (!hours || hours.length === 0) {
    return { open: true }
  }

  const todayKey = JS_DAY_TO_API[new Date().getDay()]!
  const todayEntry = hours.find((h) => h.day === todayKey)
  const current = nowMinutes()

  // Today's entry says closed
  if (!todayEntry || !todayEntry.is_open) {
    return {
      open: false,
      reason: 'day_closed',
      dayLabel: DAY_LABELS[todayKey],
      opensAt: null,
      nextOpenLabel: getNextOpenLabel(hours, todayKey),
    }
  }

  // Check primary window
  const start1 = toMinutes(todayEntry.time_from)
  const end1   = toMinutes(todayEntry.time_to)

  if (start1 !== null && end1 !== null && inWindow(start1, end1, current)) {
    return { open: true }
  }

  // Check optional second window
  const start2 = toMinutes(todayEntry.second_start)
  const end2   = toMinutes(todayEntry.second_end)

  if (start2 !== null && end2 !== null && inWindow(start2, end2, current)) {
    return { open: true }
  }

  // We're outside today's windows
  return {
    open: false,
    reason: 'outside_hours',
    dayLabel: DAY_LABELS[todayKey],
    opensAt: start1 !== null ? formatMinutes(start1) : null,
    nextOpenLabel: getNextOpenLabel(hours, todayKey),
  }
}

// ─── Label helpers ────────────────────────────────────────────────────────────

function getTodayDayLabel(): string {
  return DAY_LABELS[JS_DAY_TO_API[new Date().getDay()]!]
}

/** Format minutes-from-midnight into "10:00 AM" style. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

/** Format a "HH:MM:SS" string into "10:00 AM" style. */
export function formatTimeStr(timeStr: string | null | undefined): string | null {
  const mins = toMinutes(timeStr)
  return mins !== null ? formatMinutes(mins) : null
}

/**
 * Find the next day (starting from `afterDay`, wrapping around the week) that
 * has `is_open: true`, and return a label like "Tomorrow, 10:00 AM" or
 * "Saturday, 10:00 AM".
 */
function getNextOpenLabel(
  hours: BranchBusinessHour[],
  afterDay: BranchBusinessHour['day'],
): string | null {
  const ORDER: BranchBusinessHour['day'][] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const currentIdx = ORDER.indexOf(afterDay)

  for (let i = 1; i <= 7; i++) {
    const nextIdx = (currentIdx + i) % 7
    const nextDay = ORDER[nextIdx]!
    const entry = hours.find((h) => h.day === nextDay && h.is_open)
    if (entry && entry.time_from) {
      const timeLabel = formatTimeStr(entry.time_from) ?? ''
      const dayLabel  = i === 1 ? 'Tomorrow' : DAY_LABELS[nextDay]
      return `${dayLabel}, ${timeLabel}`
    }
  }

  return null
}

/**
 * Returns a short status string for the top bar, e.g.:
 *   "Closed today · Opens tomorrow at 10:00 AM"
 *   "Closed · Opens at 10:00 AM"
 *   "Closed · Opens Saturday at 10:00 AM"
 */
export function getClosedMessage(status: StoreStatus & { open: false }): string {
  if (status.reason === 'day_closed') {
    if (status.nextOpenLabel) return `Closed today · Opens ${status.nextOpenLabel}`
    return `Closed today`
  }

  // outside_hours
  if (status.opensAt) return `Closed · Opens at ${status.opensAt}`
  if (status.nextOpenLabel) return `Closed · Opens ${status.nextOpenLabel}`
  return 'Currently closed'
}
