import { renderWelcomeCard, DoctorCardInput } from './imageCard'
import { uploadWhatsAppMedia, sendWhatsAppImage, sendWhatsAppMessage } from './whatsapp'
import { query } from './db'

const SUPPORTED_LANGS = ['en', 'hi'] as const

function buildCaption(doc: DoctorCardInput): string {
  const num = (process.env.DRCLINIQ_WA_NUMBER || '').replace(/[^0-9]/g, '')
  const waLink = num
    ? `https://wa.me/${num}?text=${encodeURIComponent(`Hi DrCliniq, I want to book with ${doc.doctorCode}`)}`
    : 'https://drcliniq.in'

  return [
    `🎉 Welcome, Dr. ${doc.name} — aap ab DrCliniq pe live hain!`,
    '',
    'Yeh aapka announcement card hai. Patients ko bhejne ke liye:',
    '',
    '✅ Apne WhatsApp Status pe lagayein',
    '✅ Instagram / Facebook pe post karein',
    '✅ Clinic ke noticeboard pe print karein',
    '',
    'Patients yeh QR scan karke aapse seedha appointment book kar sakte hain.',
    '',
    `Aapka share link:`,
    waLink,
    `Code: ${doc.doctorCode}`,
    '',
    'Koi bhi help chahiye toh yahin reply karein.',
    '— Team DrCliniq',
  ].join('\n')
}

/**
 * Generate + send a doctor's welcome announcement card on WhatsApp.
 * Fire-and-forget safe — caller can `void sendWelcomeCardToDoctor(...)`.
 * Errors are logged, never thrown to caller.
 */
export async function sendWelcomeCardToDoctor(doctorId: string): Promise<void> {
  try {
    const result = await query(
      `SELECT id, phone, name, specialty, clinic_name, city, doctor_code
       FROM doctors WHERE id = $1`,
      [doctorId]
    )
    if (result.rows.length === 0) {
      console.warn(`[welcomeCard] Doctor ${doctorId} not found`)
      return
    }

    const doc = result.rows[0]
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
      city: doc.city,
      doctorCode: doc.doctor_code,
    }

    const buffer = await renderWelcomeCard(cardInput)
    const mediaId = await uploadWhatsAppMedia(buffer, 'image/png', `welcome-${doc.doctor_code}.png`)

    await sendWhatsAppImage(doc.phone, { mediaId }, buildCaption(cardInput))

    // Mark sent (optional column — silently no-ops if column missing)
    try {
      await query(
        `UPDATE doctors SET welcome_card_sent_at = now() WHERE id = $1`,
        [doctorId]
      )
    } catch {
      /* welcome_card_sent_at column may not exist yet — ignore */
    }

    console.log(`[welcomeCard] Sent to doctor ${doctorId} (${doc.phone})`)
  } catch (err) {
    console.error(`[welcomeCard] Failed for doctor ${doctorId}:`, err)
    // swallow — never block onboarding
  }
}

export { SUPPORTED_LANGS }
