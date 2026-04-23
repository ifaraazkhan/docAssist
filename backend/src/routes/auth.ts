import { Router, Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { query } from '../lib/db'
import { normalizePhone, isValidIndianPhone } from '../lib/phone'
import { signToken } from '../lib/jwt'
import { generateOtp, sendOtp } from '../lib/sms'
import { sendWhatsAppMessage } from '../lib/whatsapp'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { authLimiter } from '../middleware/rateLimit'
import { BadRequest, Unauthorized, NotFound } from '../lib/errors'

const router = Router()

// ──────────────────────────────────────────────
// POST /api/auth/login  (legacy hardcoded — keep for now)
// ──────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      throw new Unauthorized('Invalid credentials')
    }

    const result = await query(
      'SELECT * FROM doctors WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      throw new NotFound('Doctor not found')
    }

    const doctor = result.rows[0]
    const token = signToken(doctor.id, doctor.jwt_version)

    res.json({ success: true, token, doctor })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/auth/start-signup
// Body: { phone }
// ──────────────────────────────────────────────
router.post('/start-signup', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone: rawPhone } = req.body
    if (!rawPhone) throw new BadRequest('Phone is required')

    const phone = normalizePhone(rawPhone)
    if (!isValidIndianPhone(phone)) throw new BadRequest('Invalid Indian phone number')

    const existing = await query('SELECT id, onboarding_complete, onboarding_step FROM doctors WHERE phone = $1', [phone])

    if (existing.rows.length > 0) {
      const doc = existing.rows[0]

      if (doc.onboarding_complete) {
        // Existing doctor — send magic link
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 60 min

        // Invalidate old unused links
        await query(
          'UPDATE magic_links SET used = true WHERE doctor_id = $1 AND used = false',
          [doc.id]
        )

        await query(
          'INSERT INTO magic_links (token, doctor_id, purpose, expires_at) VALUES ($1, $2, $3, $4)',
          [token, doc.id, 'login', expiresAt]
        )

        // Send magic link via WhatsApp (don't block on failure)
        const link = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`
        try {
          await sendWhatsAppMessage(phone, `Your DrCliniq login link (valid 60 min):\n${link}`)
        } catch (err) {
          console.error('[auth] WhatsApp send failed (magic link):', err)
        }

        res.json({ success: true, status: 'existing', magicLink: link })
        return
      }

      // Incomplete onboarding — tell them to resume
      res.json({ success: true, status: 'resuming', onboardingStep: doc.onboarding_step })
      return
    }

    // New doctor — create minimal row
    const result = await query(
      'INSERT INTO doctors (phone) VALUES ($1) RETURNING id',
      [phone]
    )

    const doctorId = result.rows[0].id

    // Generate and send OTP for verification
    const otp = generateOtp()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 min

    await query(
      'INSERT INTO otp_verifications (phone, otp_hash, expires_at) VALUES ($1, $2, $3)',
      [phone, otpHash, expiresAt]
    )

    await sendOtp(phone, otp)

    res.json({ success: true, status: 'new', doctorId })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/auth/magic-link
// Body: { phone }
// ──────────────────────────────────────────────
router.post('/magic-link', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone: rawPhone } = req.body
    if (!rawPhone) throw new BadRequest('Phone is required')

    const phone = normalizePhone(rawPhone)
    if (!isValidIndianPhone(phone)) throw new BadRequest('Invalid Indian phone number')

    const docResult = await query('SELECT id, onboarding_complete FROM doctors WHERE phone = $1', [phone])
    if (docResult.rows.length === 0) throw new NotFound('Doctor not found. Complete signup first.')

    const doc = docResult.rows[0]
    if (!doc.onboarding_complete) throw new BadRequest('Complete onboarding first')

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    // Invalidate old unused links
    await query('UPDATE magic_links SET used = true WHERE doctor_id = $1 AND used = false', [doc.id])

    await query(
      'INSERT INTO magic_links (token, doctor_id, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [token, doc.id, 'login', expiresAt]
    )

    const link = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`
    try {
      await sendWhatsAppMessage(phone, `Your DrCliniq login link (valid 60 min):\n${link}`)
    } catch (err) {
      console.error('[auth] WhatsApp send failed (magic link):', err)
    }

    res.json({ success: true, magicLink: link })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/auth/magic-link/verify
// Body: { token }
// ──────────────────────────────────────────────
router.post('/magic-link/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body
    if (!token) throw new BadRequest('Token is required')

    const result = await query(
      `SELECT ml.id, ml.doctor_id, ml.used, ml.expires_at,
              d.id AS doc_id, d.phone, d.email, d.name, d.specialty, d.clinic_name,
              d.plan, d.onboarding_complete, d.onboarding_step, d.jwt_version,
              d.whatsapp_connected, d.doctor_code, d.short_link_slug
       FROM magic_links ml
       JOIN doctors d ON d.id = ml.doctor_id
       WHERE ml.token = $1`,
      [token]
    )

    if (result.rows.length === 0) throw new Unauthorized('Invalid link', 'INVALID_LINK')

    const row = result.rows[0]

    if (row.used) throw new Unauthorized('Link already used', 'LINK_USED')
    if (new Date(row.expires_at) < new Date()) throw new Unauthorized('Link expired', 'LINK_EXPIRED')

    // Mark link as used
    await query('UPDATE magic_links SET used = true WHERE id = $1', [row.id])

    const jwt = signToken(row.doctor_id, row.jwt_version)

    const doctor = {
      id: row.doc_id,
      phone: row.phone,
      email: row.email,
      name: row.name,
      specialty: row.specialty,
      clinicName: row.clinic_name,
      plan: row.plan,
      onboardingComplete: row.onboarding_complete,
      onboardingStep: row.onboarding_step,
      whatsappConnected: row.whatsapp_connected,
      doctorCode: row.doctor_code,
      shortLinkSlug: row.short_link_slug,
    }

    res.json({ success: true, token: jwt, doctor })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/auth/otp/send
// Body: { phone }
// ──────────────────────────────────────────────
router.post('/otp/send', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone: rawPhone } = req.body
    if (!rawPhone) throw new BadRequest('Phone is required')

    const phone = normalizePhone(rawPhone)
    if (!isValidIndianPhone(phone)) throw new BadRequest('Invalid Indian phone number')

    // Check doctor exists
    const docResult = await query('SELECT id FROM doctors WHERE phone = $1', [phone])
    if (docResult.rows.length === 0) throw new NotFound('Doctor not found. Complete signup first.')

    const otp = generateOtp()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await query(
      'INSERT INTO otp_verifications (phone, otp_hash, expires_at) VALUES ($1, $2, $3)',
      [phone, otpHash, expiresAt]
    )

    await sendOtp(phone, otp)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/auth/otp/verify
// Body: { phone, otp }
// ──────────────────────────────────────────────
router.post('/otp/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone: rawPhone, otp } = req.body
    if (!rawPhone || !otp) throw new BadRequest('Phone and OTP are required')

    const phone = normalizePhone(rawPhone)
    if (!isValidIndianPhone(phone)) throw new BadRequest('Invalid Indian phone number')

    // Get latest OTP for this phone
    const otpResult = await query(
      `SELECT id, otp_hash, attempts, verified, expires_at
       FROM otp_verifications
       WHERE phone = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone]
    )

    if (otpResult.rows.length === 0) throw new Unauthorized('No OTP found. Request a new one.', 'NO_OTP')

    const otpRow = otpResult.rows[0]

    if (otpRow.verified) throw new Unauthorized('OTP already used', 'OTP_USED')
    if (new Date(otpRow.expires_at) < new Date()) throw new Unauthorized('OTP expired', 'OTP_EXPIRED')
    if (otpRow.attempts >= 3) throw new Unauthorized('Too many attempts. Request a new OTP.', 'AUTH_INVALID')

    // Increment attempts
    await query('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1', [otpRow.id])

    const isValid = await bcrypt.compare(otp, otpRow.otp_hash)
    if (!isValid) throw new Unauthorized('Invalid OTP', 'AUTH_INVALID')

    // Mark verified
    await query('UPDATE otp_verifications SET verified = true WHERE id = $1', [otpRow.id])

    // Get doctor
    const docResult = await query(
      `SELECT id, phone, email, name, specialty, clinic_name, plan,
              onboarding_complete, onboarding_step, jwt_version,
              whatsapp_connected, doctor_code, short_link_slug
       FROM doctors WHERE phone = $1`,
      [phone]
    )

    if (docResult.rows.length === 0) throw new NotFound('Doctor not found')

    const doc = docResult.rows[0]
    const jwt = signToken(doc.id, doc.jwt_version)

    const doctor = {
      id: doc.id,
      phone: doc.phone,
      email: doc.email,
      name: doc.name,
      specialty: doc.specialty,
      clinicName: doc.clinic_name,
      plan: doc.plan,
      onboardingComplete: doc.onboarding_complete,
      onboardingStep: doc.onboarding_step,
      whatsappConnected: doc.whatsapp_connected,
      doctorCode: doc.doctor_code,
      shortLinkSlug: doc.short_link_slug,
    }

    res.json({ success: true, token: jwt, doctor })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ──────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor

    const result = await query(
      `SELECT id, phone, email, name, specialty, clinic_name, plan,
              onboarding_complete, onboarding_step, jwt_version,
              whatsapp_connected, doctor_code, short_link_slug,
              city, clinic_address, clinic_phone, clinic_hours_start, clinic_hours_end,
              clinic_days, clinic_closed, clinic_closed_message,
              created_at
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
        plan: doc.plan,
        onboardingComplete: doc.onboarding_complete,
        onboardingStep: doc.onboarding_step,
        whatsappConnected: doc.whatsapp_connected,
        doctorCode: doc.doctor_code,
        shortLinkSlug: doc.short_link_slug,
        createdAt: doc.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/auth/logout-all  (protected)
// ──────────────────────────────────────────────
router.post('/logout-all', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = (req as AuthenticatedRequest).doctor

    await query('UPDATE doctors SET jwt_version = jwt_version + 1 WHERE id = $1', [id])

    res.json({ success: true, message: 'All sessions invalidated' })
  } catch (err) {
    next(err)
  }
})

export default router
