/**
 * Normalize Indian phone numbers to E.164 format WITHOUT the + prefix.
 * Output: 12-digit string like "919876543210"
 *
 * Handles:
 *   +919876543210  → 919876543210
 *   919876543210   → 919876543210
 *   09876543210    → 919876543210
 *   9876543210     → 919876543210
 *   +91 98765 43210 → 919876543210
 */
export function normalizePhone(input: string): string {
  // Strip all non-digit characters
  const digits = input.replace(/\D/g, '')

  // 10 digits → prepend 91
  if (digits.length === 10) {
    return `91${digits}`
  }

  // 11 digits starting with 0 → strip leading 0, prepend 91
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`
  }

  // 12 digits starting with 91 → already correct
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits
  }

  // 13 digits starting with 091 → strip leading 0
  if (digits.length === 13 && digits.startsWith('091')) {
    return digits.slice(1)
  }

  // If nothing matched, return cleaned digits as-is (caller should validate)
  return digits
}

/**
 * Validate that a normalized phone looks like a valid Indian mobile number.
 * Must be 12 digits, start with 91, followed by 6-9 (Indian mobile prefix).
 */
export function isValidIndianPhone(normalized: string): boolean {
  return /^91[6-9]\d{9}$/.test(normalized)
}
