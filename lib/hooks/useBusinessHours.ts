import { useMemo, useEffect, useState } from 'react'
import { useGetMenu } from '@/api/client/browse'
import { useStoreSettings } from '@/lib/hooks/useCart'
import { useStoreLocation } from '@/lib/hooks/useStoreLocation'
import {
  isStoreOpenNow,
  getClosedMessage,
  formatTimeStr,
  getTodayHoliday,
} from '@/utils/businessHours'
import type { StoreStatus, Holiday } from '@/utils/businessHours'
import type { BranchBusinessHour } from '@/api/types'

export type { StoreStatus }

export interface BusinessHoursResult {
  /** Whether the branch is open right now */
  isOpen: boolean
  /** Full status object — has `reason`, `dayLabel`, `opensAt`, `nextOpenLabel` when closed */
  status: StoreStatus
  /** Ready-made one-liner for the closed banner */
  closedMessage: string | null
  /** True when today is a holiday */
  isHoliday: boolean
  /** The holiday's custom close_message, if today is a holiday */
  holidayMessage: string | null
  /** Today's opening time formatted, e.g. "10:00 AM" */
  todayOpensAt: string | null
  /** Today's closing time formatted, e.g. "11:59 PM" */
  todayClosesAt: string | null
  /** Raw business hours array */
  hours: BranchBusinessHour[]
  /** Raw holidays array */
  holidays: Holiday[]
  /** True while the underlying menu query is still loading */
  isLoading: boolean
}

/**
 * Reactive business-hours + holiday hook.
 * Re-evaluates every minute so banners appear/disappear automatically.
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
    const hours    = (menu?.branch_business_hours ?? []) as BranchBusinessHour[]
    const holidays = (menu?.holidays ?? []) as Holiday[]

    const status = isStoreOpenNow(hours, settings.close_store, holidays)

    // Today's entry for open/close times
    const JS_DAY_TO_API: Record<number, BranchBusinessHour['day']> = {
      0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
    }
    const todayKey   = JS_DAY_TO_API[new Date().getDay()]!
    const todayEntry = hours.find((h) => h.day === todayKey)

    const todayOpensAt  = formatTimeStr(todayEntry?.time_from)
    const todayClosesAt = formatTimeStr(todayEntry?.time_to)

    const todayHoliday  = getTodayHoliday(holidays)
    const isHoliday     = !!todayHoliday
    const holidayMessage = todayHoliday?.close_message?.trim() || null

    const closedMessage = status.open ? null : getClosedMessage(status)

    return {
      isOpen: status.open,
      status,
      closedMessage,
      isHoliday,
      holidayMessage,
      todayOpensAt,
      todayClosesAt,
      hours,
      holidays,
      isLoading,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu, settings.close_store, isLoading, tick])
}
