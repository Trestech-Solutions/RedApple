// Pakistani mobile numbers: 03XX-XXXXXXX (11 digits), operator codes 300-359.
// Accepts 03001234567, 3001234567, 923001234567, +92 300 1234567.
const PK_MOBILE_RE = /^3[0-5]\d{8}$/

export function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/\D/g, '')
  if (cleaned.startsWith('92')) cleaned = cleaned.slice(2)
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1)
  return '0' + cleaned
}

/** Returns an error message, or '' when the number is a valid Pakistani mobile number. */
export function validatePakistaniPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 'Mobile number is required'
  const national = normalizePhone(raw).slice(1)
  if (!PK_MOBILE_RE.test(national)) {
    return 'Enter a valid Pakistani mobile number (e.g. 0300 1234567)'
  }
  return ''
}
