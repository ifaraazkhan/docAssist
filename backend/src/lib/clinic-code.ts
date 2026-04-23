import { query } from './db'

/**
 * Generate a memorable, recallable clinic code.
 *
 * Format: DC-<WORD>-<4digits>
 * Examples: DC-CARE-4821, DC-HEAL-1037, DC-STAR-5692
 *
 * The word is picked from a curated list of positive medical/clinic words.
 * The 4-digit suffix provides uniqueness (10,000 combos per word × 24 words = 240k unique codes).
 */

const CODE_WORDS = [
  'CARE', 'HEAL', 'LIFE', 'STAR', 'WELL', 'CURE',
  'HOPE', 'SAFE', 'GLOW', 'PURE', 'VIBE', 'EASE',
  'MIND', 'BODY', 'FLEX', 'CALM', 'RISE', 'PEAK',
  'AURA', 'BOLD', 'NEST', 'PLUS', 'WISE', 'WAVE',
]

/**
 * Generate a unique doctor_code with retry on collision.
 * Checks the doctors table for uniqueness.
 */
export async function generateDoctorCode(maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]
    const num = Math.floor(1000 + Math.random() * 9000) // 4-digit: 1000–9999
    const code = `DC-${word}-${num}`

    const exists = await query(
      'SELECT 1 FROM doctors WHERE doctor_code = $1',
      [code]
    )
    if (exists.rows.length === 0) return code
  }

  // Fallback: timestamp-based (guaranteed unique in practice)
  const ts = Date.now().toString(36).toUpperCase().slice(-6)
  return `DC-${ts}`
}

/**
 * Generate a URL-friendly slug from doctor name.
 * Format: dr-firstname-lastname-XXX
 */
export async function generateSlug(name: string, maxRetries = 5): Promise<string> {
  const base = (name || 'doctor')
    .toLowerCase()
    .replace(/^dr\.?\s*/i, '') // strip "Dr." prefix
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 20)

  for (let i = 0; i < maxRetries; i++) {
    const suffix = Math.floor(100 + Math.random() * 900) // 3-digit
    const slug = `dr-${base}-${suffix}`

    const exists = await query(
      'SELECT 1 FROM doctors WHERE short_link_slug = $1',
      [slug]
    )
    if (exists.rows.length === 0) return slug
  }

  // Fallback
  const ts = Date.now().toString(36).slice(-5)
  return `dr-${base}-${ts}`
}
