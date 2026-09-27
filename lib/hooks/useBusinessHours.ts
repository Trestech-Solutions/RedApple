import { useMemo, useEffect, useState } from 'react'
import { useGetMenu } from '@/api/client/browse'
import { useStoreSettings } from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'
import { isStoreOpenNow, getClosedMessage, formatTimeStr } from '@/utils/businessHours'
import type { StoreStatus } from '@/utils/businessHours'
import type { BranchBusinessHour } from '@/api/types'

export type { StoreStatus }

export interface BusinessHoursResult {
  /** Whether the branch is open right now */
  isOpen: boolean
  /** Full status object — has `reason`, `dayLabel`, `opensAt`, `nextOpenLabel` when closed */
  status: StoreStatus
  /** Ready-made one-liner for the closed banner, e.g. "Closed · Opens at 10:00 AM" */
  closedMessage: string | null
  /** Today's opening time formatted, e.g. "10:00 AM" — null if day is closed/unknown */
  todayOpensAt: string | null
  /** Today's closing time formatted, e.g. "11:59 PM" — null if day is closed/unknown */
  todayClosesAt: string | null
  /** Raw hours array from the API (branch-level preferred, falls back to restaurant-level) */
  hours: BranchBusinessHour[]
  /** True while the underlying menu query is still loading */
  isLoading: boolean
}

/**
 * Reactive business-hours hook.
 *
 * Re-evaluates every minute so the banner appears/disappears automatically
 * as the clock crosses an opening or closing time.
 */
export function useBusinessHours(): BusinessHoursResult {
  const { branchId, areaId } = useStoreLocation()
  const { settings } = useStoreSettings()
  const { data: menu, isLoading } = useGetMenu({ branchId, areaId })

  // Tick every 60 s so open/closed state stays current
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])

  return useMemo(() => {
    // Prefer branch-level hours; fall back to restaurant-level
    const hours = (menu?.branch_business_hours ?? []) as BranchBusinessHour[]

    const status = isStoreOpenNow(hours, settings.close_store)

    // Today's entry for open/close times
    const JS_DAY_TO_API: Record<number, BranchBusinessHour['day']> = {
      0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
    }
    const todayKey = JS_DAY_TO_API[new Date().getDay()]!
    const todayEntry = hours.find((h) => h.day === todayKey)

    const todayOpensAt  = formatTimeStr(todayEntry?.time_from)
    const todayClosesAt = formatTimeStr(todayEntry?.time_to)

    const closedMessage = status.open
      ? null
      : getClosedMessage(status)

    return {
      isOpen: status.open,
      status,
      closedMessage,
      todayOpensAt,
      todayClosesAt,
      hours,
      isLoading,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu, settings.close_store, isLoading, tick])
}
