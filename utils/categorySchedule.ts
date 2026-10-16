import { getPKTMinutesSinceMidnight } from './dealTime'

/**
 * Category schedule (admin: `schedule`, `schedule_days_times`, `after_schedule`) — Pakistan time (UTC+5).
 *
 * schedule_days_times = { mon: { is_open, open_time: "09:00", close_time: "22:00" }, … }
 */
export type CategorySchedule = {
  schedule?: boolean
  schedule_days_times?: Record<string, { is_open?: boolean; open_time?: string; close_time?: string }> | null
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const DAY_LABEL: Record<string, string> = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' }

function mins(t?: string): number {
  if (!t) return -1
  const [h, m] = t.split(':')
  const hh = parseInt(h ?? '', 10), mm = parseInt(m ?? '', 10)
  return Number.isNaN(hh) || Number.isNaN(mm) ? -1 : hh * 60 + mm
}

/** Current day-of-week index (0 = Sunday) in PKT */
function pktDayIndex(): number {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).getUTCDay()
}

function window12(open?: string, close?: string): string {
  return `${(open ?? '').slice(0, 5)} – ${(close ?? '').slice(0, 5)}`
}

export type CategoryScheduleState = {
  /** true when the category can be ordered from right now */
  open: boolean
  /** When closed: when it is next available, e.g. "Today 09:00 – 22:00" / "Tue 09:00 – 22:00" */
  nextWindow?: string
}

export function getCategoryScheduleState(cat: CategorySchedule): CategoryScheduleState {
  const days = cat.schedule_days_times
  if (!cat.schedule || !days) return { open: true }

  const now = getPKTMinutesSinceMidnight()
  const today = pktDayIndex()

  const todayEntry = days[DAY_KEYS[today]!]
  if (todayEntry?.is_open) {
    const o = mins(todayEntry.open_time)
    const c = mins(todayEntry.close_time)
    if (o < 0 || c < 0) return { open: true } // malformed — don't hide
    const inside = c > o ? now >= o && now < c : now >= o || now < c // overnight window
    if (inside) return { open: true }
    if (now < o) return { open: false, nextWindow: `Today ${window12(todayEntry.open_time, todayEntry.close_time)}` }
  }

  // Next day that is open
  for (let i = 1; i <= 7; i++) {
    const key = DAY_KEYS[(today + i) % 7]!
    const e = days[key]
    if (e?.is_open) {
      const when = i === 1 ? 'Tomorrow' : DAY_LABEL[key]
      return { open: false, nextWindow: `${when} ${window12(e.open_time, e.close_time)}` }
    }
  }
  return { open: false }
}
