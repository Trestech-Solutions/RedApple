/** Price after item-level discount: percent → base − pct%, otherwise fixed → base − amount. */
export function applyItemDiscount(base: number, discount: unknown, type: unknown): number {
  const val = parseFloat(String(discount ?? ''))
  if (isNaN(val) || val <= 0 || base <= 0) return base
  const isPercent = String(type ?? '').toLowerCase().trim().startsWith('percent')
  const save = isPercent ? Math.round(base * Math.min(val, 100) / 100) : Math.min(Math.round(val), base)
  return base - save
}
