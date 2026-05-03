import { Router, Request, Response, NextFunction } from 'express'
import { query } from '../lib/db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { BadRequest, Conflict, NotFound } from '../lib/errors'

const router = Router()

// ──────────────────────────────────────────────
// GET /api/doctor/profile  (protected)
// ──────────────────────────────────────────────
router.get('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor

    const result = await query(
      `SELECT id, phone, email, name, specialty, clinic_name, city,
              clinic_address, clinic_phone, clinic_hours_start, clinic_hours_end,
              clinic_days, clinic_closed, clinic_closed_message,
              doctor_code, short_link_slug, plan, onboarding_complete, onboarding_step,
              whatsapp_connected, created_at
       FROM doctors WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) throw new NotFound('Doctor not found')

    const doc = result.rows[0]
    res.json({
      success: true,
      doctor: {
        id: doc.id,
        phone: doc.phone,
        email: doc.email,
        name: doc.name,
        specialty: doc.specialty,
        clinicName: doc.clinic_name,
        city: doc.city,
        clinicAddress: doc.clinic_address,
        clinicPhone: doc.clinic_phone,
        clinicHoursStart: doc.clinic_hours_start,
        clinicHoursEnd: doc.clinic_hours_end,
        clinicDays: doc.clinic_days,
        clinicClosed: doc.clinic_closed,
        clinicClosedMessage: doc.clinic_closed_message,
        doctorCode: doc.doctor_code,
        shortLinkSlug: doc.short_link_slug,
        plan: doc.plan,
        onboardingComplete: doc.onboarding_complete,
        onboardingStep: doc.onboarding_step,
        whatsappConnected: doc.whatsapp_connected,
        createdAt: doc.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// PATCH /api/doctor/profile  (protected)
// ──────────────────────────────────────────────
const SLUG_REGEX = /^[a-z0-9-]{3,30}$/
const OFFENSIVE_SLUGS = ['admin', 'doctor', 'api', 'www', 'app', 'help', 'support', 'test', 'null', 'undefined']

router.patch('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor
    const b = req.body

    // Accept both camelCase and snake_case
    const name = b.name
    const specialty = b.specialty
    const clinic_name = b.clinic_name ?? b.clinicName
    const city = b.city
    const clinic_address = b.clinic_address ?? b.clinicAddress
    const clinic_phone = b.clinic_phone ?? b.clinicPhone
    const clinic_hours_start = b.clinic_hours_start ?? b.clinicHoursStart
    const clinic_hours_end = b.clinic_hours_end ?? b.clinicHoursEnd
    const clinic_days = b.clinic_days ?? b.clinicDays
    const clinic_closed = b.clinic_closed ?? b.clinicClosed
    const clinic_closed_message = b.clinic_closed_message ?? b.clinicClosedMessage
    const short_link_slug = b.short_link_slug ?? b.shortLinkSlug
    const email = b.email

    // Slug validation
    if (short_link_slug !== undefined) {
      if (!SLUG_REGEX.test(short_link_slug)) {
        throw new BadRequest('Slug must be 3-30 characters, lowercase alphanumeric and hyphens only')
      }
      if (OFFENSIVE_SLUGS.includes(short_link_slug)) {
        throw new BadRequest('This slug is reserved')
      }
      // Uniqueness check
      const slugCheck = await query(
        'SELECT id FROM doctors WHERE short_link_slug = $1 AND id != $2',
        [short_link_slug, id]
      )
      if (slugCheck.rows.length > 0) throw new Conflict('Slug already taken')
    }

    // Build dynamic UPDATE
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const addField = (col: string, val: unknown) => {
      if (val !== undefined) {
        fields.push(`${col} = $${idx++}`)
        values.push(val)
      }
    }

    addField('name', name)
    addField('specialty', specialty)
    addField('clinic_name', clinic_name)
    addField('city', city)
    addField('clinic_address', clinic_address)
    addField('clinic_phone', clinic_phone)
    addField('clinic_hours_start', clinic_hours_start)
    addField('clinic_hours_end', clinic_hours_end)
    addField('clinic_days', clinic_days)
    addField('clinic_closed', clinic_closed)
    addField('clinic_closed_message', clinic_closed_message)
    addField('short_link_slug', short_link_slug)
    addField('email', email)

    if (fields.length === 0) throw new BadRequest('No fields to update')

    values.push(id)
    const sql = `UPDATE doctors SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`
    const result = await query(sql, values)
    const doc = result.rows[0]

    // Auto-update "Clinic Details" system protocol when clinic info changes
    if (clinic_name !== undefined || clinic_phone !== undefined ||
        clinic_hours_start !== undefined || clinic_hours_end !== undefined ||
        clinic_days !== undefined || clinic_closed !== undefined ||
        clinic_closed_message !== undefined ||
        clinic_address !== undefined || city !== undefined) {
      const clinicText = buildClinicDetailsText(doc)
      await query(
        `UPDATE protocols SET reply_text = $1, updated_at = now()
         WHERE doctor_id = $2 AND protocol_type = 'system' AND title = 'Clinic Details' AND deleted_at IS NULL`,
        [clinicText, id]
      )
    }

    res.json({
      success: true,
      doctor: {
        id: doc.id,
        phone: doc.phone,
        email: doc.email,
        name: doc.name,
        specialty: doc.specialty,
        clinicName: doc.clinic_name,
        city: doc.city,
        clinicAddress: doc.clinic_address,
        clinicPhone: doc.clinic_phone,
        clinicHoursStart: doc.clinic_hours_start,
        clinicHoursEnd: doc.clinic_hours_end,
        clinicDays: doc.clinic_days,
        clinicClosed: doc.clinic_closed,
        clinicClosedMessage: doc.clinic_closed_message,
        doctorCode: doc.doctor_code,
        shortLinkSlug: doc.short_link_slug,
        plan: doc.plan,
        onboardingComplete: doc.onboarding_complete,
        onboardingStep: doc.onboarding_step,
        whatsappConnected: doc.whatsapp_connected,
        createdAt: doc.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// GET /api/doctor/share-info  (protected)
// ──────────────────────────────────────────────
router.get('/share-info', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor

    const result = await query(
      'SELECT doctor_code, short_link_slug, phone, name, clinic_name FROM doctors WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) throw new NotFound('Doctor not found')

    const doc = result.rows[0]
    const baseUrl = process.env.APP_URL || 'http://localhost:3000'
    const shortLink = doc.short_link_slug ? `${baseUrl}/dr/${doc.short_link_slug}` : null
    // QR data = wa.me link with DrCliniq business number + friendly pre-filled message
    const waPhone = process.env.WHATSAPP_BUSINESS_PHONE || ''
    const clinicLabel = doc.clinic_name || (doc.name ? `Dr. ${doc.name}` : 'DrCliniq')
    const prefilledMsg = doc.doctor_code
      ? `Hi! Clinic code: ${doc.doctor_code}`
      : null
    const qrData = prefilledMsg
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(prefilledMsg)}`
      : null

    res.json({
      success: true,
      shortLink,
      doctorCode: doc.doctor_code,
      qrData,
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// Helper: build Clinic Details protocol text
// ──────────────────────────────────────────────
function buildClinicDetailsText(doc: Record<string, unknown>): string {
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const lines: string[] = []

  // ── Clinic closed banner ──
  if (doc.clinic_closed) {
    lines.push('🔴 *CLINIC TEMPORARILY CLOSED*')
    if (doc.clinic_closed_message) {
      lines.push(`_${doc.clinic_closed_message}_`)
    }
    lines.push('') // blank line separator
  }

  // ── Header ──
  if (doc.clinic_name) lines.push(`🏥 *${doc.clinic_name}*`)
  if (doc.name) lines.push(`👨‍⚕️ Dr. ${doc.name}`)
  if (doc.specialty) lines.push(`📋 ${doc.specialty}`)

  // ── Location ──
  if (doc.clinic_address || doc.city) {
    lines.push('') // separator
    if (doc.clinic_address) lines.push(`📍 ${doc.clinic_address}`)
    if (doc.city) lines.push(`🌆 ${doc.city}`)
  }
  if (doc.clinic_phone) lines.push(`📞 ${doc.clinic_phone}`)

  // ── Timing & Days ──
  if (doc.clinic_hours_start && doc.clinic_hours_end) {
    lines.push('') // separator
    lines.push(`⏰ *Timings:* ${doc.clinic_hours_start} – ${doc.clinic_hours_end}`)
  }

  if (doc.clinic_days && typeof doc.clinic_days === 'string') {
    const days = doc.clinic_days as string
    const openDays = days
      .split('')
      .map((c: string, i: number) => (c === '1' ? DAY_NAMES[i] : null))
      .filter(Boolean) as string[]
    const closedDays = days
      .split('')
      .map((c: string, i: number) => (c === '0' ? DAY_NAMES[i] : null))
      .filter(Boolean) as string[]

    if (openDays.length > 0 && openDays.length < 7) {
      lines.push(`📅 *Open:* ${openDays.join(', ')}`)
      if (closedDays.length > 0) {
        lines.push(`🚫 *Closed:* ${closedDays.join(', ')}`)
      }
    } else if (openDays.length === 7) {
      lines.push(`📅 *Open:* All days`)
    }

    // Today's status
    // JS getDay(): 0=Sun, 1=Mon ... 6=Sat → map to our index (0=Mon ... 6=Sun)
    const jsDay = new Date().getDay() // 0-6 (Sun-Sat)
    const todayIdx = jsDay === 0 ? 6 : jsDay - 1 // convert to Mon=0 ... Sun=6
    const todayName = DAY_NAMES[todayIdx]
    const isOpenToday = days[todayIdx] === '1'

    lines.push('') // separator
    if (!isOpenToday || doc.clinic_closed) {
      lines.push(`❌ *Closed today (${todayName})*`)
    } else {
      lines.push(`✅ *Open today (${todayName})* — ${doc.clinic_hours_start || ''} to ${doc.clinic_hours_end || ''}`)
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'Clinic details not yet configured.'
}

export default router
