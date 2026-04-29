import { Router, Request, Response, NextFunction } from 'express'
import { query, withTransaction } from '../lib/db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { BadRequest, Forbidden, NotFound } from '../lib/errors'
import { generateDoctorCode, generateSlug } from '../lib/clinic-code'
import { sendWelcomeCardToDoctor } from '../lib/welcomeCard'
import { renderWelcomeCard } from '../lib/imageCard'

const router = Router()

const FREE_PROTOCOL_LIMIT = 3 // max non-system protocols on free plan

// ──────────────────────────────────────────────
// GET /api/onboarding/status  (protected)
// ──────────────────────────────────────────────
router.get('/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor

    const result = await query(
      `SELECT id, phone, name, specialty, clinic_name, city,
              clinic_address, clinic_phone, clinic_hours_start, clinic_hours_end,
              onboarding_complete, onboarding_step, doctor_code, short_link_slug
       FROM doctors WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) throw new NotFound('Doctor not found')

    const doc = result.rows[0]
    res.json({
      success: true,
      onboardingComplete: doc.onboarding_complete,
      onboardingStep: doc.onboarding_step,
      profileData: {
        name: doc.name,
        specialty: doc.specialty,
        clinicName: doc.clinic_name,
        city: doc.city,
        clinicAddress: doc.clinic_address,
        clinicPhone: doc.clinic_phone,
        clinicHoursStart: doc.clinic_hours_start,
        clinicHoursEnd: doc.clinic_hours_end,
        doctorCode: doc.doctor_code,
        shortLinkSlug: doc.short_link_slug,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/onboarding/confirm-profile  (protected)
// Body: { name?, specialty?, clinicName?, city?, clinicAddress?, clinicPhone?, clinicHoursStart?, clinicHoursEnd? }
// ──────────────────────────────────────────────
router.post('/confirm-profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor
    const {
      name, specialty, clinicName, clinic_name,
      city,
      clinicAddress, clinic_address,
      clinicHoursStart, clinic_hours_start,
      clinicHoursEnd, clinic_hours_end,
      clinicPhone, clinic_phone,
    } = req.body

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
    addField('clinic_name', clinicName ?? clinic_name)
    addField('city', city)
    addField('clinic_address', clinicAddress ?? clinic_address)
    addField('clinic_hours_start', clinicHoursStart ?? clinic_hours_start)
    addField('clinic_hours_end', clinicHoursEnd ?? clinic_hours_end)
    addField('clinic_phone', clinicPhone ?? clinic_phone)

    if (fields.length > 0) {
      values.push(id)
      await query(
        `UPDATE doctors SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx}`,
        values
      )
    }

    // Update Clinic Details protocol text if hours provided
    if (clinicHoursStart || clinic_hours_start || clinicHoursEnd || clinic_hours_end) {
      const docResult = await query(
        `SELECT name, specialty, clinic_name, city, clinic_address, clinic_phone,
                clinic_hours_start, clinic_hours_end
         FROM doctors WHERE id = $1`,
        [id]
      )
      if (docResult.rows.length > 0) {
        const doc = docResult.rows[0]
        const clinicText = buildClinicDetailsText(doc)
        await query(
          `UPDATE protocols SET reply_text = $1, updated_at = now()
           WHERE doctor_id = $2 AND protocol_type = 'system' AND title = 'Clinic Details' AND deleted_at IS NULL`,
          [clinicText, id]
        )
      }
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/onboarding/select-protocols  (protected)
// Body: { libraryProtocolIds: [], customProtocols?: [{title, keywords, replyText}] }
// ──────────────────────────────────────────────
router.post('/select-protocols', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor
    const { libraryProtocolIds = [], customProtocols = [] } = req.body

    if (!Array.isArray(libraryProtocolIds)) throw new BadRequest('libraryProtocolIds must be an array')
    if (!Array.isArray(customProtocols)) throw new BadRequest('customProtocols must be an array')

    // Check plan limit
    const planResult = await query('SELECT plan FROM doctors WHERE id = $1', [id])
    if (planResult.rows.length === 0) throw new NotFound('Doctor not found')
    const plan = planResult.rows[0].plan

    // Count existing non-system protocols
    const countResult = await query(
      `SELECT COUNT(*) as cnt FROM protocols
       WHERE doctor_id = $1 AND protocol_type != 'system' AND deleted_at IS NULL`,
      [id]
    )
    const existingCount = parseInt(countResult.rows[0].cnt, 10)
    const newCount = libraryProtocolIds.length + customProtocols.length

    if (plan === 'free' && existingCount + newCount > FREE_PROTOCOL_LIMIT) {
      throw new Forbidden(
        `Free plan allows max ${FREE_PROTOCOL_LIMIT} protocols. You have ${existingCount}, trying to add ${newCount}.`,
        'PLAN_LIMIT'
      )
    }

    await withTransaction(async (client) => {
      // Clone library protocols
      if (libraryProtocolIds.length > 0) {
        const libResult = await client.query(
          `SELECT id, title, keywords, reply_text, disclaimer
           FROM library_protocols WHERE id = ANY($1)`,
          [libraryProtocolIds]
        )

        for (const lib of libResult.rows) {
          await client.query(
            `INSERT INTO protocols (doctor_id, library_source_id, title, keywords, reply_text, disclaimer, protocol_type, add_to_menu)
             VALUES ($1, $2, $3, $4, $5, $6, 'library', true)`,
            [id, lib.id, lib.title, lib.keywords, lib.reply_text, lib.disclaimer]
          )
        }
      }

      // Create custom protocols
      for (const cp of customProtocols) {
        if (!cp.title || !cp.replyText) continue
        const keywords = Array.isArray(cp.keywords)
          ? cp.keywords
          : (cp.keywords || '').split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean)

        await client.query(
          `INSERT INTO protocols (doctor_id, title, keywords, reply_text, protocol_type, add_to_menu)
           VALUES ($1, $2, $3, $4, 'custom', true)`,
          [id, cp.title, keywords, cp.replyText]
        )
      }

      // Mark onboarding complete + generate doctor_code & slug if missing
      const docRow = await client.query(
        'SELECT name, clinic_name, doctor_code, short_link_slug FROM doctors WHERE id = $1',
        [id]
      )
      const docInfo = docRow.rows[0]

      const doctorCode = docInfo.doctor_code || await generateDoctorCode()
      const slug = docInfo.short_link_slug || await generateSlug(docInfo.name || docInfo.clinic_name || 'doctor')

      await client.query(
        `UPDATE doctors SET onboarding_complete = true, onboarding_step = 'done',
         doctor_code = $2, short_link_slug = $3, updated_at = now()
         WHERE id = $1`,
        [id, doctorCode, slug]
      )
    })

    // Fetch doctor code and slug for response
    const docResult = await query(
      'SELECT doctor_code, short_link_slug FROM doctors WHERE id = $1',
      [id]
    )
    const doc = docResult.rows[0]
    const baseUrl = process.env.APP_URL || 'http://localhost:3000'

    res.json({
      success: true,
      doctorCode: doc.doctor_code,
      shortLink: doc.short_link_slug ? `${baseUrl}/dr/${doc.short_link_slug}` : null,
    })

    // Fire-and-forget welcome card on first onboarding completion
    void sendWelcomeCardToDoctor(id)
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// GET /api/onboarding/welcome-card/preview  (protected)
// Returns the rendered PNG inline — used to verify card design before WhatsApp send.
// ──────────────────────────────────────────────
router.get('/welcome-card/preview', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor
    const result = await query(
      `SELECT name, specialty, clinic_name, city, doctor_code FROM doctors WHERE id = $1`,
      [id]
    )
    if (result.rows.length === 0) throw new NotFound('Doctor not found')
    const doc = result.rows[0]

    const buffer = await renderWelcomeCard({
      name: doc.name || 'Doctor',
      specialty: doc.specialty,
      clinicName: doc.clinic_name,
      city: doc.city,
      doctorCode: doc.doctor_code || 'DC-DEMO-0001',
    })

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store')
    res.send(buffer)
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/onboarding/welcome-card/resend  (protected)
// Manually re-sends welcome card on WhatsApp (e.g. doctor wants a fresh copy).
// ──────────────────────────────────────────────
router.post('/welcome-card/resend', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor
    void sendWelcomeCardToDoctor(id)
    res.json({ success: true, message: 'Welcome card queued for delivery' })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// Helper: build Clinic Details protocol text
// ──────────────────────────────────────────────
function buildClinicDetailsText(doc: Record<string, unknown>): string {
  const lines: string[] = []
  if (doc.clinic_name) lines.push(`🏥 *${doc.clinic_name}*`)
  if (doc.name) lines.push(`👨‍⚕️ Dr. ${doc.name}`)
  if (doc.specialty) lines.push(`📋 ${doc.specialty}`)
  if (doc.clinic_address) lines.push(`📍 ${doc.clinic_address}`)
  if (doc.city) lines.push(`🌆 ${doc.city}`)
  if (doc.clinic_phone) lines.push(`📞 ${doc.clinic_phone}`)
  if (doc.clinic_hours_start && doc.clinic_hours_end) {
    lines.push(`🕐 ${doc.clinic_hours_start} – ${doc.clinic_hours_end}`)
  }
  return lines.length > 0 ? lines.join('\n') : 'Clinic details not yet configured.'
}

export default router
