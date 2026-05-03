import crypto from 'crypto'
import { renderWelcomeCard, DoctorCardInput } from './imageCard'
import { uploadWhatsAppMedia, sendWhatsAppImage, sendWhatsAppCTAButton } from './whatsapp'
import { query } from './db'

const SUPPORTED_LANGS = ['en', 'hi'] as const

function buildCaption(doc: DoctorCardInput): string {
  return [
    `🎉 Welcome, Dr. ${doc.name} — aap ab DrCliniq pe live hain!`,
    '',
    'Yeh aapka announcement card hai. Patients ke saath share karein:',
    '',
    '✅ WhatsApp Status pe lagayein',
    '✅ Instagram / Facebook pe post karein',
    '✅ Clinic noticeboard pe print karein',
    '',
    `Code: ${doc.doctorCode}`,
  ].join('\n')
}

function preferredName(name: string | null | undefined, clinicName?: string | null): string {
  if (name && name.trim()) {
    const n = name.trim()
    return n.startsWith('Dr.') || n.startsWith('Dr ') ? n : `Dr. ${n}`
  }
  if (clinicName && clinicName.trim()) return clinicName.trim()
  return 'Doctor'
}

/**
 * Generate a fresh magic-link token for the doctor and send a one-tap
 * "Open Dashboard" CTA on WhatsApp. The link opens the PWA already signed in.
 */
async function sendDashboardLoginLink(
  doctorId: string,
  phone: string,
  displayName: string
): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 60 min

  // Invalidate any existing unused magic links for this doctor
  await query(
    'UPDATE magic_links SET used = true WHERE doctor_id = $1 AND used = false',
    [doctorId]
  )
  await query(
    'INSERT INTO magic_links (token, doctor_id, purpose, expires_at) VALUES ($1, $2, $3, $4)',
    [token, doctorId, 'login', expiresAt]
  )

  const link = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`
  await sendWhatsAppCTAButton(
    phone,
    `${displayName}, your DrCliniq dashboard is ready.\n\nTap below to open — you'll be signed in automatically.\n\n_Link expires in 60 minutes._`,
    'Open Dashboard',
    link
  )
}

/**
 * Generate + send a doctor's welcome announcement card on WhatsApp,
 * followed by a one-tap dashboard login CTA.
 *
 * Fire-and-forget safe — caller can `void sendWelcomeCardToDoctor(...)`.
 * Errors are logged, never thrown to caller.
 */
export async function sendWelcomeCardToDoctor(doctorId: string): Promise<void> {
  console.log(`[welcomeCard] Starting for doctor ${doctorId}`)
  try {
    const result = await query(
      `SELECT id, phone, name, specialty, clinic_name, clinic_address, city, doctor_code
       FROM doctors WHERE id = $1`,
      [doctorId]
    )
    if (result.rows.length === 0) {
      console.warn(`[welcomeCard] Doctor ${doctorId} not found`)
      return
    }

    const doc = result.rows[0]
    console.log(`[welcomeCard] Doctor found: phone=${doc.phone}, code=${doc.doctor_code}, name=${doc.name}`)
    if (!doc.phone) {
      console.warn(`[welcomeCard] Doctor ${doctorId} has no phone`)
      return
    }
    if (!doc.doctor_code) {
      console.warn(`[welcomeCard] Doctor ${doctorId} has no doctor_code — skipping welcome card`)
      return
    }

    const cardInput: DoctorCardInput = {
      name: doc.name || 'Doctor',
      specialty: doc.specialty,
      clinicName: doc.clinic_name,
      clinicAddress: doc.clinic_address,
      city: doc.city,
      doctorCode: doc.doctor_code,
    }

    // 1) Render + send the announcement card image
    console.log(`[welcomeCard] Rendering card...`)
    const buffer = await renderWelcomeCard(cardInput)
    console.log(`[welcomeCard] Card rendered (${buffer.length} bytes), uploading media...`)
    const mediaId = await uploadWhatsAppMedia(buffer, 'image/png', `welcome-${doc.doctor_code}.png`)
    console.log(`[welcomeCard] Media uploaded (id=${mediaId}), sending image...`)
    await sendWhatsAppImage(doc.phone, { mediaId }, buildCaption(cardInput))
    console.log(`[welcomeCard] Image sent to doctor ${doctorId} (${doc.phone})`)

    // Mark image sent (column is optional — silently no-ops if missing)
    try {
      await query(
        `UPDATE doctors SET welcome_card_sent_at = now() WHERE id = $1`,
        [doctorId]
      )
    } catch {
      /* welcome_card_sent_at column may not exist yet — ignore */
    }

    // 2) Send dashboard CTA so the doctor lands in the PWA already signed in.
    // Wrapped separately so an image-send success isn't undone by a CTA failure.
    try {
      await sendDashboardLoginLink(
        doctorId,
        doc.phone,
        preferredName(doc.name, doc.clinic_name)
      )
      console.log(`[welcomeCard] Dashboard CTA sent to doctor ${doctorId}`)
    } catch (err) {
      console.error(`[welcomeCard] Dashboard CTA failed for doctor ${doctorId}:`, err)
    }
  } catch (err) {
    console.error(`[welcomeCard] Failed for doctor ${doctorId}:`, err)
    // swallow — never block onboarding
  }
}

export { SUPPORTED_LANGS }
