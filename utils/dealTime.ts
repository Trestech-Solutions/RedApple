/**
 * Deal time-window utilities — Pakistan Standard Time (PKT = UTC+5)
 *
 * No external libraries needed: we compute PKT by adding 5 hours
 * to the current UTC time, then compare against the deal's
 * start_time / end_time strings (format "HH:MM:SS" from the API).
 */

/** Parse "HH:MM:SS" or "HH:MM" → total minutes since midnight. Returns -1 on invalid input. */
function parseTimeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr) return -1
  const parts = timeStr.split(':')
  const h = parseInt(parts[0] ?? '', 10)
  const m = parseInt(parts[1] ?? '', 10)
  if (isNaN(h) || isNaN(m)) return -1
  return h * 60 + m
}

/**
 * Get current time in Pakistan Standard Time as minutes since midnight.
 * PKT = UTC + 5 hours (no DST observed).
 */
export function getPKTMinutesSinceMidnight(): number {
  const nowUtcMs  = Date.now()
  const pktOffsetMs = 5 * 60 * 60 * 1000   // +5 hours in ms
  const pktMs     = nowUtcMs + pktOffsetMs
  const pktDate   = new Date(pktMs)
  return pktDate.getUTCHours() * 60 + pktDate.getUTCMinutes()
}

/**
 * Returns true if the current PKT time falls within [start_time, end_time).
 *
 * Rules:
 * - If both start_time and end_time are null/undefined/"00:00:00" → no time
 *   restriction, always show the deal (returns true).
 * - end_time of "00:00:00" while start_time is set is treated as midnight
 *   (i.e. the window runs from start_time until midnight).
 * - If start_time > end_time the two are treated as swapped: the item is
 *   available between end_time and start_time on the same day (24h clock).
 */
export function isDealActiveNowPKT(
  startTime: string | null | undefined,
  endTime:   string | null | undefined
): boolean {
  const startMins = parseTimeToMinutes(startTime)
  const endMins   = parseTimeToMinutes(endTime)

  // No restriction — both missing or both midnight
  const noRestriction =
    (startMins <= 0 && endMins <= 0) ||
    (startMins === 0 && endMins === 0)

  if (noRestriction) return true

  const nowMins = getPKTMinutesSinceMidnight()

  if (startMins < 0 || endMins < 0) return true  // malformed — don't hide

  // end_time 00:00 = midnight: window runs from start until the end of the day
  const endAdj = endMins === 0 ? 24 * 60 : endMins

  // Normal window (e.g. 09:00 – 22:00)
  if (startMins <= endAdj) {
    return nowMins >= startMins && nowMins < endAdj
  }

  // start > end: treated as the SAME-DAY window between the two times (end → start),
  // e.g. start 12:22 / end 11:11 → available 11:11–12:22 only (24h clock).
  return nowMins >= endMins && nowMins < startMins
}
