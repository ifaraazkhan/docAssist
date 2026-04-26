import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { query, withTransaction } from '../lib/db'
import { normalizePhone } from '../lib/phone'
import { signToken } from '../lib/jwt'
import { sendWhatsAppMessage, sendWhatsAppMenu, sendWhatsAppButtons, sendWhatsAppSpecialtyList, sendWhatsAppCTAButton } from '../lib/whatsapp'
import { webhookVerify } from '../middleware/webhookVerify'
import { generateDoctorCode, generateSlug } from '../lib/clinic-code'

const router = Router()

const GREETINGS = ['hi', 'hello', 'hey', 'helo', 'menu', 'help', 'start', 'namaste', 'namaskar']
const CANCEL_KEYWORDS = ['cancel appointment', 'cancel token', 'cancel booking', 'cancel opd', 'cancel']
const STOP_KEYWORDS = ['stop', 'unsubscribe', 'leave', 'opt out', 'optout']
const DOCTOR_SIGNUP_CODE = 'DOCTOR_SIGNUP'

/**
 * Word-boundary keyword match. `lowerText.includes(kw)` was matching
 * "I might cancel my plans" → triggered cancel flow. We need word-aware
 * matching that still works for multi-word keywords like "cancel booking".
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function keywordMatches(lowerText: string, keyword: string): boolean {
  const kw = keyword.toLowerCase().trim()
  if (!kw) return false
  // \b doesn't work well for non-ASCII; this regex requires the keyword
  // to sit between non-word chars or string boundaries.
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(kw)}([^a-z0-9]|$)`, 'i')
  return re.test(lowerText)
}

// Doctor menu button IDs (sent when an onboarded doctor messages the bot)
const MENU_DASHBOARD = 'DR_MENU_DASHBOARD'
const MENU_SHARE = 'DR_MENU_SHARE'
const MENU_REFER = 'DR_MENU_REFER'

// Patient global button IDs — handled at top of handleProtocolMatching
const PT_MAIN_MENU = 'PT_MAIN_MENU'
const PT_VIEW_DETAILS = 'PT_VIEW_DETAILS'
const PT_VIEW_TOKEN = 'PT_VIEW_TOKEN'
const PT_BOOK_APPT = 'PT_BOOK_APPT'

// ──────────────────────────────────────────────
// GET — Meta webhook verification
// ──────────────────────────────────────────────
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('[webhook] verified')
    res.status(200).send(challenge)
    return
  }

  res.status(403).send('Forbidden')
})

// ──────────────────────────────────────────────
// POST — incoming messages from Meta
// ──────────────────────────────────────────────
router.post('/', webhookVerify, async (req: Request, res: Response) => {
  const requestId = crypto.randomUUID()

  try {
    const entry = req.body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) {
      res.status(200).send('OK')
      return
    }

    const msg = messages[0]
    const rawFrom = msg.from
    const msgType = msg.type
    const wamid = msg.id // WhatsApp message ID for dedup
    const contactName = value?.contacts?.[0]?.profile?.name ?? null
    const waTimestamp = msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000) : null

    // Normalize phone
    const from = normalizePhone(rawFrom)

    // Extract text (ID for routing) and display text (title for chat display)
    let text = ''
    let displayText = ''
    if (msgType === 'text') {
      text = msg.text?.body ?? ''
      displayText = text
    } else if (msgType === 'interactive') {
      const listReply = msg.interactive?.list_reply
      const buttonReply = msg.interactive?.button_reply
      text = listReply?.id ?? buttonReply?.id ?? ''
      displayText = listReply?.title ?? buttonReply?.title ?? text
    } else {
      // Unsupported type — acknowledge silently
      res.status(200).send('OK')
      return
    }

    console.log(`[webhook][${requestId}] from=${from} type=${msgType} text="${text.substring(0, 50)}"`)

    // ── DEDUP via wamid ──
    if (wamid) {
      const dupeCheck = await query('SELECT id FROM messages WHERE wamid = $1', [wamid])
      if (dupeCheck.rows.length > 0) {
        console.log(`[webhook][${requestId}] duplicate wamid=${wamid}, skipping`)
        res.status(200).send('OK')
        return
      }
    }

    const trimmedText = text.trim()
    const upperText = trimmedText.toUpperCase()

    // ── BRANCH 1: DOCTOR_SIGNUP (text or button reply) ──
    if (upperText === DOCTOR_SIGNUP_CODE || upperText === 'DOCTOR_SIGNUP_BTN') {
      await handleDoctorSignup(from, contactName, requestId)
      res.status(200).send('OK')
      return
    }

    // Patient button reply — explain how to connect
    if (upperText === 'PATIENT_BTN') {
      await sendWhatsAppMessage(
        from,
        'To connect with your doctor, please use the *clinic code* or *QR code* they shared with you.\n\nType the code here to get started.'
      )
      res.status(200).send('OK')
      return
    }

    // ── BRANCH 2: Check if this is a doctor in onboarding ──
    const onboardingDoc = await query(
      `SELECT id, name, specialty, clinic_name, onboarding_step, onboarding_complete
       FROM doctors WHERE phone = $1 AND onboarding_complete = false`,
      [from]
    )

    if (onboardingDoc.rows.length > 0) {
      await handleDoctorOnboarding(from, trimmedText, onboardingDoc.rows[0], requestId)
      res.status(200).send('OK')
      return
    }

    // ── BRANCH 3: Clinic code (patient joining a doctor) ──
    // Extract DC-XXXX-NNNN or CLINIC_XXXX from anywhere in the message
    const clinicCodeMatch = upperText.match(/\b(DC-[A-Z]+-\d{4})\b/) || upperText.match(/\b(CLINIC_\w+)\b/)
    if (clinicCodeMatch) {
      await handleClinicCode(from, clinicCodeMatch[1], contactName, wamid, waTimestamp, requestId)
      res.status(200).send('OK')
      return
    }

    // ── BRANCH 4: Is this phone a registered doctor? ──
    const doctorCheck = await query(
      'SELECT id, name, clinic_name, doctor_code, phone, onboarding_complete, jwt_version FROM doctors WHERE phone = $1',
      [from]
    )
    if (doctorCheck.rows.length > 0) {
      const doc = doctorCheck.rows[0] as {
        id: string
        name: string | null
        clinic_name: string | null
        doctor_code: string | null
        phone: string
        onboarding_complete: boolean
        jwt_version: number
      }
      if (doc.onboarding_complete) {
        // Button taps from the doctor menu
        if (upperText === MENU_DASHBOARD.toUpperCase()) {
          await sendDoctorDashboardLink(from, doc, requestId)
        } else if (upperText === MENU_SHARE.toUpperCase()) {
          await sendDoctorShareLink(from, doc)
        } else if (upperText === MENU_REFER.toUpperCase()) {
          await sendDoctorReferralLink(from, doc)
        } else {
          // Any other message → show the welcome menu with 3 options
          await sendDoctorMenu(from, doc)
        }
      }
      res.status(200).send('OK')
      return
    }

    // ── BRANCH 5: Known patient — route to doctor(s) ──
    const mappings = await query(
      `SELECT pdm.id AS mapping_id, pdm.doctor_id, pdm.is_urgent, pdm.unread_count,
              d.name AS doctor_name, d.clinic_name
       FROM patient_doctor_mappings pdm
       JOIN patients p ON p.id = pdm.patient_id
       JOIN doctors d ON d.id = pdm.doctor_id
       WHERE p.phone = $1 AND pdm.status = 'active'
       ORDER BY pdm.created_at DESC`,
      [from]
    )

    if (mappings.rows.length > 0) {
      // Determine which doctor to route to
      let targetDoctorId: string
      let mappingId: string

      if (mappings.rows.length === 1) {
        targetDoctorId = mappings.rows[0].doctor_id
        mappingId = mappings.rows[0].mapping_id
      } else {
        // Multiple doctors — check wa_sessions for active session
        const session = await query(
          `SELECT doctor_id FROM wa_sessions
           WHERE patient_phone = $1 AND expires_at > now()
           ORDER BY last_msg_at DESC LIMIT 1`,
          [from]
        )

        if (session.rows.length > 0) {
          targetDoctorId = session.rows[0].doctor_id
          const m = mappings.rows.find((r) => r.doctor_id === targetDoctorId)
          mappingId = m ? m.mapping_id : mappings.rows[0].mapping_id
        } else {
          // Default to most recent mapping
          targetDoctorId = mappings.rows[0].doctor_id
          mappingId = mappings.rows[0].mapping_id
        }
      }

      // Passive name backfill: if patient never set a WhatsApp profile name when
      // they joined and has set one since, capture it for the doctor's inbox.
      if (contactName) {
        await query(
          'UPDATE patients SET name = $1 WHERE phone = $2 AND name IS NULL',
          [contactName, from]
        )
      }

      // Update/create wa_session (24hr window)
      // No unique constraint on (patient_phone, doctor_id) — just insert new row each time
      // We always query ORDER BY last_msg_at DESC LIMIT 1 so latest wins
      await query(
        `INSERT INTO wa_sessions (patient_phone, doctor_id, expires_at)
         VALUES ($1, $2, now() + interval '24 hours')`,
        [from, targetDoctorId]
      )

      // Save inbound message
      await query(
        `INSERT INTO messages (wamid, patient_phone, doctor_id, direction, sender, content, msg_type, wa_timestamp)
         VALUES ($1, $2, $3, 'inbound', 'patient', $4, $5, $6)`,
        [wamid, from, targetDoctorId, displayText, msgType === 'interactive' ? 'interactive' : 'text', waTimestamp]
      )

      // STOP keyword: opt patient out of this clinic
      // Only fires for plain text (not interactive button taps that happen to contain "stop")
      const lowerInbound = trimmedText.toLowerCase()
      if (msgType === 'text' && STOP_KEYWORDS.some((kw) => keywordMatches(lowerInbound, kw))) {
        await query(
          `UPDATE patient_doctor_mappings SET status = 'opted_out'
           WHERE id = $1`,
          [mappingId]
        )
        const doc = mappings.rows.find((r) => r.doctor_id === targetDoctorId)
        const clinicLabel = doc?.clinic_name || 'this clinic'
        const reply =
          `You've been unsubscribed from *${clinicLabel}*.\n\n` +
          `You will no longer receive replies here.\n\n` +
          `_To rejoin, share the clinic code again._`
        await sendWhatsAppMessage(from, reply)
        await query(
          `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type)
           VALUES ($1, $2, 'outbound', 'bot', $3, 'text')`,
          [from, targetDoctorId, reply]
        )
        console.log(`[webhook][${requestId}] patient ${from} opted out of doctor ${targetDoctorId}`)
        res.status(200).send('OK')
        return
      }

      // Protocol matching
      await handleProtocolMatching(from, text, targetDoctorId, mappingId, wamid, requestId)

      res.status(200).send('OK')
      return
    }

    // ── BRANCH 6: Unknown number, no code ──
    await sendWhatsAppButtons(
      from,
      'Welcome to *DrCliniq* — your clinic\'s WhatsApp assistant.\n\nHow would you like to proceed?',
      [
        { id: 'DOCTOR_SIGNUP_BTN', title: 'I\'m a Doctor' },
        { id: 'PATIENT_BTN', title: 'I\'m a Patient' },
      ]
    )

    res.status(200).send('OK')
  } catch (err) {
    console.error(`[webhook][${requestId}] error:`, err)
    res.status(200).send('OK') // always 200 to Meta
  }
})

// ──────────────────────────────────────────────
// HELPER: Strip "Dr." prefix from user input
// ──────────────────────────────────────────────
const DR_PREFIXES = /^(dr\.?\s+|doctor\s+)/i

function stripDrPrefix(name: string): string {
  return name.replace(DR_PREFIXES, '').trim()
}

/** Returns "Dr. <name>" — safe to call on any input, won't double-prefix */
function formatDrName(name: string): string {
  const clean = stripDrPrefix(name)
  return clean ? `Dr. ${clean}` : 'Doctor'
}

/** Best label for a doctor: Dr. <name> → clinic_name → "Doctor" */
function preferredName(doc: { name: string | null; clinic_name: string | null }): string {
  if (doc.name) return formatDrName(doc.name)
  if (doc.clinic_name) return doc.clinic_name
  return 'Doctor'
}

// ──────────────────────────────────────────────
// HANDLER: Doctor menu — welcome card with 3 reply buttons
// ──────────────────────────────────────────────
async function sendDoctorMenu(
  phone: string,
  doc: { name: string | null; clinic_name: string | null }
) {
  await sendWhatsAppButtons(
    phone,
    `Welcome back, ${preferredName(doc)} 👋\n\nWhat would you like to do?`,
    [
      { id: MENU_DASHBOARD, title: 'Open Dashboard' },
      { id: MENU_SHARE, title: 'Share Link' },
      { id: MENU_REFER, title: 'Referral Link' },
    ]
  )
}

// ──────────────────────────────────────────────
// HANDLER: Send magic-link CTA to doctor
// ──────────────────────────────────────────────
async function sendDoctorDashboardLink(
  phone: string,
  doc: { id: string; name: string | null; clinic_name: string | null },
  requestId: string
) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await query('UPDATE magic_links SET used = true WHERE doctor_id = $1 AND used = false', [doc.id])
  await query(
    'INSERT INTO magic_links (token, doctor_id, purpose, expires_at) VALUES ($1, $2, $3, $4)',
    [token, doc.id, 'login', expiresAt]
  )
  const link = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`
  await sendWhatsAppCTAButton(
    phone,
    `${preferredName(doc)}, your dashboard is ready.\n\n_Link expires in 60 minutes._`,
    'Open Dashboard',
    link
  )
  console.log(`[webhook][${requestId}] dashboard link sent to doctor ${doc.id}`)
}

// ──────────────────────────────────────────────
// HANDLER: Send forwardable clinic share link
// Mirrors backend/src/routes/doctor.ts share-info logic
// ──────────────────────────────────────────────
async function sendDoctorShareLink(
  phone: string,
  doc: { name: string | null; clinic_name: string | null; doctor_code: string | null; phone: string }
) {
  if (!doc.doctor_code) {
    await sendWhatsAppMessage(
      phone,
      'Your clinic code is not generated yet. Please complete setup in the dashboard first.'
    )
    return
  }
  const waPhone = process.env.WHATSAPP_BUSINESS_PHONE || doc.phone
  const prefilled = `Hi! Clinic code: ${doc.doctor_code}`
  const shareUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(prefilled)}`
  const label = doc.clinic_name || preferredName(doc)
  await sendWhatsAppMessage(
    phone,
    `👋 Connect with *${label}* on WhatsApp:\n\n` +
    `${shareUrl}\n\n` +
    `_Forward this to your patients — they tap the link, WhatsApp opens, they're connected._`
  )
}

// ──────────────────────────────────────────────
// HANDLER: Send forwardable doctor-to-doctor referral link
// Mirrors PWA settings/refer page
// ──────────────────────────────────────────────
async function sendDoctorReferralLink(
  phone: string,
  doc: { doctor_code: string | null }
) {
  if (!doc.doctor_code) {
    await sendWhatsAppMessage(
      phone,
      'Your referral code is not generated yet. Please complete setup in the dashboard first.'
    )
    return
  }
  const referralLink = `https://drcliniq.in/join?ref=${doc.doctor_code}`
  await sendWhatsAppMessage(
    phone,
    `💡 Invite another doctor to DrCliniq:\n\n` +
    `Hey! I've been using DrCliniq to automate my WhatsApp clinic replies — saves me hours every week. Try it out:\n` +
    `${referralLink}\n\n` +
    `_Forward to a doctor friend._`
  )
}

// ──────────────────────────────────────────────
// HANDLER: Doctor signup via WhatsApp
// ──────────────────────────────────────────────
async function handleDoctorSignup(phone: string, contactName: string | null, requestId: string) {
  // Check if already a doctor
  const existing = await query(
    'SELECT id, onboarding_step, onboarding_complete, name, specialty, clinic_name FROM doctors WHERE phone = $1',
    [phone]
  )

  if (existing.rows.length > 0) {
    const doc = existing.rows[0]
    if (doc.onboarding_complete) {
      await sendWhatsAppMessage(phone, `Welcome back, ${formatDrName(doc.name || '')}. Send any message to see your dashboard, share link, and referral options.`)
    } else {
      // Resume onboarding
      await resumeOnboarding(phone, doc)
    }
    return
  }

  // New doctor — create row
  await query('INSERT INTO doctors (phone) VALUES ($1)', [phone])
  console.log(`[webhook][${requestId}] new doctor created: ${phone}`)

  await sendWhatsAppMessage(phone, 'Welcome to DrCliniq. Let\'s get your clinic set up.\n\nWhat is your full name?')
}

// ──────────────────────────────────────────────
// HANDLER: Doctor onboarding state machine
// ──────────────────────────────────────────────
async function handleDoctorOnboarding(
  phone: string,
  text: string,
  doc: { id: string; name: string | null; specialty: string | null; clinic_name: string | null; onboarding_step: string },
  requestId: string
) {
  const step = doc.onboarding_step

  if (step === 'name') {
    const cleanName = stripDrPrefix(text)
    await query("UPDATE doctors SET name = $1, onboarding_step = 'specialty', updated_at = now() WHERE id = $2", [cleanName, doc.id])

    // Fetch specialties from DB for list message
    const specResult = await query('SELECT name FROM specialties WHERE is_active = true ORDER BY sort_order ASC')
    const specialties = specResult.rows.map((r: { name: string }) => r.name)

    if (specialties.length > 0) {
      await sendWhatsAppSpecialtyList(
        phone,
        `Thank you, ${formatDrName(cleanName)}. Please select your specialty.`,
        specialties
      )
    } else {
      await sendWhatsAppMessage(phone, `Thank you, ${formatDrName(cleanName)}. What is your specialty?`)
    }
    console.log(`[webhook][${requestId}] onboarding: name collected`)

  } else if (step === 'specialty') {
    // Handle list reply (strip specialty_ prefix) or free text
    const rawSpecialty = text.startsWith('specialty_') ? text.replace('specialty_', '') : text

    // If "Other" selected, ask them to type it
    if (rawSpecialty === 'Other') {
      await query("UPDATE doctors SET onboarding_step = 'specialty_other', updated_at = now() WHERE id = $1", [doc.id])
      await sendWhatsAppMessage(phone, 'Please type your specialty.')
      console.log(`[webhook][${requestId}] onboarding: specialty=Other, asking for custom input`)
      return
    }

    await query("UPDATE doctors SET specialty = $1, onboarding_step = 'clinic_name', updated_at = now() WHERE id = $2", [rawSpecialty, doc.id])
    await sendWhatsAppMessage(phone, 'What is your clinic name?')
    console.log(`[webhook][${requestId}] onboarding: specialty collected`)

  } else if (step === 'specialty_other') {
    // Doctor typed a custom specialty — try to match against our list
    const specResult = await query('SELECT name FROM specialties WHERE is_active = true ORDER BY sort_order ASC')
    const allSpecs = specResult.rows.map((r: { name: string }) => r.name)
    const inputLower = text.toLowerCase().trim()

    // Fuzzy match: check if input matches any known specialty (case-insensitive, partial)
    const matched = allSpecs.find((s) => {
      const specLower = s.toLowerCase()
      return specLower === inputLower || specLower.includes(inputLower) || inputLower.includes(specLower)
    })

    if (matched) {
      // Found a match — confirm with the doctor
      await sendWhatsAppButtons(
        phone,
        `Did you mean *${matched}*?`,
        [
          { id: `specialty_confirm_${matched}`, title: 'Yes' },
          { id: 'specialty_confirm_no', title: 'No, keep mine' },
        ]
      )
      // Store their input temporarily, will finalize on confirmation
      await query("UPDATE doctors SET specialty = $1, updated_at = now() WHERE id = $2", [text, doc.id])
      // Save the matched suggestion for reference
      await query("UPDATE doctors SET onboarding_step = 'specialty_confirm', updated_at = now() WHERE id = $1", [doc.id])
      console.log(`[webhook][${requestId}] onboarding: custom specialty "${text}" matched "${matched}", confirming`)
    } else {
      // No match — store as-is and move on
      await query("UPDATE doctors SET specialty = $1, onboarding_step = 'clinic_name', updated_at = now() WHERE id = $2", [text, doc.id])
      await sendWhatsAppMessage(phone, 'What is your clinic name?')
      console.log(`[webhook][${requestId}] onboarding: custom specialty "${text}" stored (no match)`)
    }

  } else if (step === 'specialty_confirm') {
    // Doctor confirming a matched specialty suggestion
    const reply = text.startsWith('specialty_confirm_') ? text.replace('specialty_confirm_', '') : text.toUpperCase()

    if (reply === 'no' || reply === 'specialty_confirm_no' || reply === 'NO') {
      // Keep their original input (already stored in specialty column)
      await query("UPDATE doctors SET onboarding_step = 'clinic_name', updated_at = now() WHERE id = $1", [doc.id])
      await sendWhatsAppMessage(phone, 'What is your clinic name?')
    } else {
      // Use the matched specialty
      const matchedSpec = text.startsWith('specialty_confirm_') ? text.replace('specialty_confirm_', '') : doc.specialty
      await query("UPDATE doctors SET specialty = $1, onboarding_step = 'clinic_name', updated_at = now() WHERE id = $2", [matchedSpec, doc.id])
      await sendWhatsAppMessage(phone, 'What is your clinic name?')
    }
    console.log(`[webhook][${requestId}] onboarding: specialty confirmed`)

  } else if (step === 'clinic_name') {
    // Save clinic name and move to confirmation step
    await query("UPDATE doctors SET clinic_name = $1, onboarding_step = 'confirm', updated_at = now() WHERE id = $2", [text, doc.id])

    await sendWhatsAppButtons(
      phone,
      `Please confirm your details:\n\n` +
      `*Name:* ${formatDrName(doc.name || '')}\n` +
      `*Specialty:* ${doc.specialty}\n` +
      `*Clinic:* ${text}\n\n` +
      `Is this correct?`,
      [
        { id: 'CONFIRM_YES', title: 'Yes, confirm' },
        { id: 'CONFIRM_NO', title: 'Start over' },
      ]
    )
    console.log(`[webhook][${requestId}] onboarding: clinic_name collected, awaiting confirmation`)

  } else if (step === 'confirm') {
    const upper = text.toUpperCase()
    if (upper === 'CONFIRM_NO' || upper === 'NO') {
      // Reset onboarding
      await query("UPDATE doctors SET name = NULL, specialty = NULL, clinic_name = NULL, onboarding_step = 'name', updated_at = now() WHERE id = $1", [doc.id])
      await sendWhatsAppMessage(phone, 'No problem. Let\'s start over.\n\nWhat is your full name?')
      console.log(`[webhook][${requestId}] onboarding: reset by doctor`)
      return
    }

    // Confirm and complete — generate code, slug, create system protocol
    await withTransaction(async (client) => {
      await client.query('SELECT id FROM doctors WHERE id = $1 FOR UPDATE', [doc.id])

      const doctorCode = await generateDoctorCode()
      const slug = await generateSlug(doc.name || 'doctor')

      await client.query(
        `UPDATE doctors SET
           doctor_code = $1, short_link_slug = $2,
           onboarding_step = 'done', onboarding_complete = true, updated_at = now()
         WHERE id = $3`,
        [doctorCode, slug, doc.id]
      )

      // Create "Clinic Details" system protocol
      const clinicText = `*${doc.clinic_name}*\n${formatDrName(doc.name || '')} — ${doc.specialty || 'Specialist'}`
      await client.query(
        `INSERT INTO protocols (doctor_id, title, keywords, reply_text, protocol_type, is_active, add_to_menu)
         VALUES ($1, 'Clinic Details', $2, $3, 'system', true, true)`,
        [doc.id, ['clinic', 'details', 'info', 'about', 'address', 'timing', 'hours'], clinicText]
      )

      // Create "Book Appointment" system protocol (inactive by default)
      await client.query(
        `INSERT INTO protocols (doctor_id, title, keywords, reply_text, protocol_type, is_active, add_to_menu)
         VALUES ($1, 'Book Appointment', $2, $3, 'system', false, false)`,
        [doc.id, ['appointment', 'book', 'token', 'opd', 'booking'], 'Book an appointment']
      )

      // Generate magic link for PWA login
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await client.query(
        'INSERT INTO magic_links (token, doctor_id, purpose, expires_at) VALUES ($1, $2, $3, $4)',
        [token, doc.id, 'setup', expiresAt]
      )

      const link = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`

      await sendWhatsAppCTAButton(
        phone,
        `Your clinic is now live on DrCliniq.\n\n` +
        `*Clinic code:* ${doctorCode}\n\n` +
        `Open your dashboard to set up auto-reply protocols and share your clinic code with patients.\n\n` +
        `_Link expires in 60 minutes._`,
        'Open Dashboard',
        link
      )

      console.log(`[webhook][${requestId}] onboarding complete: code=${doctorCode} slug=${slug}`)
    })
  }
}

// ──────────────────────────────────────────────
// HANDLER: Resume onboarding from last step
// ──────────────────────────────────────────────
async function resumeOnboarding(phone: string, doc: { onboarding_step: string; name: string | null; specialty?: string | null; clinic_name?: string | null }) {
  const drName = doc.name ? formatDrName(doc.name) : ''

  if (doc.onboarding_step === 'specialty' && doc.name) {
    // Show specialty list
    const specResult = await query('SELECT name FROM specialties WHERE is_active = true ORDER BY sort_order ASC')
    const specialties = specResult.rows.map((r: { name: string }) => r.name)
    if (specialties.length > 0) {
      await sendWhatsAppSpecialtyList(phone, `Welcome back, ${drName}. Please select your specialty.`, specialties)
      return
    }
  }

  if (doc.onboarding_step === 'specialty_other') {
    await sendWhatsAppMessage(phone, `Welcome back${drName ? ', ' + drName : ''}. Please type your specialty.`)
    return
  }

  if (doc.onboarding_step === 'specialty_confirm') {
    // Re-ask — they had a pending specialty confirmation
    await sendWhatsAppMessage(phone, `Welcome back${drName ? ', ' + drName : ''}. Please type your specialty.`)
    await query("UPDATE doctors SET onboarding_step = 'specialty_other', updated_at = now() WHERE id = $1", [doc.id])
    return
  }

  if (doc.onboarding_step === 'confirm' && doc.name && doc.specialty && doc.clinic_name) {
    await sendWhatsAppButtons(
      phone,
      `Welcome back. Please confirm your details:\n\n` +
      `*Name:* ${drName}\n` +
      `*Specialty:* ${doc.specialty}\n` +
      `*Clinic:* ${doc.clinic_name}\n\n` +
      `Is this correct?`,
      [
        { id: 'CONFIRM_YES', title: 'Yes, confirm' },
        { id: 'CONFIRM_NO', title: 'Start over' },
      ]
    )
    return
  }

  const prompts: Record<string, string> = {
    name: 'Let\'s continue setting up. What is your full name?',
    specialty: `Welcome back${drName ? ', ' + drName : ''}. What is your specialty?`,
    clinic_name: `Welcome back${drName ? ', ' + drName : ''}. What is your clinic name?`,
  }
  const msg = prompts[doc.onboarding_step] || 'Let\'s continue setting up. What is your full name?'
  await sendWhatsAppMessage(phone, msg)
}

// ──────────────────────────────────────────────
// HANDLER: CLINIC_XXXX code — patient joining
// ──────────────────────────────────────────────
async function handleClinicCode(
  phone: string,
  code: string,
  contactName: string | null,
  wamid: string | null,
  waTimestamp: Date | null,
  requestId: string
) {
  // Lookup doctor by code
  const docResult = await query(
    'SELECT id, name, clinic_name FROM doctors WHERE doctor_code = $1 AND onboarding_complete = true',
    [code]
  )

  if (docResult.rows.length === 0) {
    await sendWhatsAppMessage(phone, "Sorry, we couldn't find a clinic with that code. Please check and try again.")
    return
  }

  const doctor = docResult.rows[0]

  await withTransaction(async (client) => {
    // Find or create patient
    let patientResult = await client.query('SELECT id FROM patients WHERE phone = $1', [phone])

    if (patientResult.rows.length === 0) {
      patientResult = await client.query(
        'INSERT INTO patients (phone, name) VALUES ($1, $2) RETURNING id',
        [phone, contactName]
      )
    }

    const patientId = patientResult.rows[0].id

    // Create mapping (ignore if already exists)
    await client.query(
      `INSERT INTO patient_doctor_mappings (patient_id, doctor_id, source, patient_type)
       VALUES ($1, $2, $3, 'new')
       ON CONFLICT (patient_id, doctor_id) DO NOTHING`,
      [patientId, doctor.id, code]
    )

    // Save the inbound message
    if (wamid) {
      await client.query(
        `INSERT INTO messages (wamid, patient_phone, doctor_id, direction, sender, content, msg_type, wa_timestamp)
         VALUES ($1, $2, $3, 'inbound', 'patient', $4, 'text', $5)
         ON CONFLICT (wamid) DO NOTHING`,
        [wamid, phone, doctor.id, code, waTimestamp]
      )
    }
  })

  // Send welcome + menu (custom greeting includes T&C acknowledgement)
  const termsUrl = `${process.env.APP_URL || 'https://drcliniq.in'}/terms`
  const welcomeText =
    `Welcome to *${doctor.clinic_name || formatDrName(doctor.name || '')}*.\n` +
    `How can we help you today?\n\n` +
    `_By continuing, you agree to our Terms & Privacy Policy: ${termsUrl}_`

  await sendMainMenu(phone, doctor.id, 1, welcomeText)

  console.log(`[webhook][${requestId}] patient ${phone} joined doctor ${doctor.id} via ${code}`)
}

// ──────────────────────────────────────────────
// HANDLER: Protocol matching for patient messages
// ──────────────────────────────────────────────
async function handleProtocolMatching(
  phone: string,
  text: string,
  doctorId: string,
  mappingId: string,
  wamid: string | null,
  requestId: string
) {
  const lowerText = text.toLowerCase().trim()
  const isGreeting = GREETINGS.includes(lowerText)

  // ── Patient global navigation ──
  if (text === PT_MAIN_MENU) {
    await sendMainMenu(phone, doctorId)
    return
  }

  if (text.startsWith('MENU_PAGE_')) {
    const page = parseInt(text.replace('MENU_PAGE_', ''), 10)
    if (page > 0) await sendMainMenu(phone, doctorId, page)
    return
  }

  if (text === PT_VIEW_TOKEN) {
    await handleViewToken(phone, doctorId)
    return
  }

  if (text === PT_VIEW_DETAILS) {
    const reply = await renderClinicDetails(doctorId)
    await sendReplyWithTail(phone, doctorId, reply)
    await query(
      `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type)
       VALUES ($1, $2, 'outbound', 'bot', $3, 'text')`,
      [phone, doctorId, reply]
    )
    return
  }

  if (text === PT_BOOK_APPT) {
    const sys = await query(
      `SELECT id FROM protocols
       WHERE doctor_id = $1 AND protocol_type = 'system' AND title = 'Book Appointment' AND deleted_at IS NULL
       LIMIT 1`,
      [doctorId]
    )
    if (sys.rows.length > 0) {
      await handleAppointmentBooking(phone, doctorId, sys.rows[0].id, requestId)
    } else {
      await sendReplyWithTail(phone, doctorId, 'Booking is not enabled for this clinic.', null)
    }
    return
  }

  // ── Cancel / reschedule routing (interactive reply IDs) ──
  if (text.startsWith('CANCEL_ASK_')) {
    await handleCancelAsk(phone, doctorId, text.replace('CANCEL_ASK_', ''), requestId)
    return
  }
  if (text.startsWith('CANCEL_CONFIRM_')) {
    await handleCancelConfirm(phone, doctorId, text.replace('CANCEL_CONFIRM_', ''), requestId)
    return
  }
  if (text === 'CANCEL_ABORT') {
    await handleCancelAbort(phone, doctorId)
    return
  }
  if (text.startsWith('CANCEL_REASON_')) {
    // Format: CANCEL_REASON_<apptId>_<reason>
    const payload = text.replace('CANCEL_REASON_', '')
    const lastUnderscore = payload.lastIndexOf('_')
    if (lastUnderscore > 0) {
      const apptId = payload.substring(0, lastUnderscore)
      const reason = payload.substring(lastUnderscore + 1)
      await handleCancelReason(phone, doctorId, apptId, reason, requestId)
    }
    return
  }
  if (text.startsWith('RESCHEDULE_')) {
    await handleReschedule(phone, doctorId, text.replace('RESCHEDULE_', ''), requestId)
    return
  }

  // ── Appointment day selection (interactive reply) ──
  if (text.startsWith('appt_day_')) {
    const dateStr = text.replace('appt_day_', '')
    await handleAppointmentDaySelect(phone, doctorId, dateStr, requestId)
    return
  }

  // ── Appointment session selection (interactive reply) ──
  if (text.startsWith('appt_session_')) {
    const payload = text.replace('appt_session_', '')
    // Format: sessionId_YYYY-MM-DD
    const lastUnderscore = payload.lastIndexOf('_')
    const datePart = payload.substring(lastUnderscore - 4) // grab _YYYY-MM-DD (11 chars from end)
    // Actually split by known date format at end
    const dateMatch = payload.match(/_(\d{4}-\d{2}-\d{2})$/)
    const sessionId = dateMatch ? payload.replace(`_${dateMatch[1]}`, '') : payload
    const bookingDate = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0]
    await handleAppointmentSessionSelect(phone, doctorId, sessionId, bookingDate, requestId)
    return
  }

  // ── Cancel appointment ──
  if (CANCEL_KEYWORDS.some((kw) => keywordMatches(lowerText, kw))) {
    await handleAppointmentCancel(phone, doctorId, requestId)
    return
  }

  // Greeting → show main menu
  if (isGreeting) {
    await sendMainMenu(phone, doctorId)
    console.log(`[webhook][${requestId}] menu sent`)
    return
  }

  // Protocol matching: ID exact match first, then keyword match
  const allProtocols = await query(
    `SELECT id, title, keywords, reply_text, disclaimer, protocol_type FROM protocols
     WHERE doctor_id = $1 AND is_active = true AND deleted_at IS NULL`,
    [doctorId]
  )

  let matched = allProtocols.rows.find((p) => p.id === text)

  if (!matched) {
    matched = allProtocols.rows.find((p) =>
      p.keywords.some((kw: string) => keywordMatches(lowerText, kw))
    )
  }

  if (matched) {
    let reply: string

    // System "Book Appointment" protocol — show OPD sessions
    if (matched.protocol_type === 'system' && matched.title === 'Book Appointment') {
      await handleAppointmentBooking(phone, doctorId, matched.id, requestId)
      return
    }

    // System "Clinic Details" protocol — build dynamically from doctor profile
    if (matched.protocol_type === 'system' && matched.title === 'Clinic Details') {
      reply = await renderClinicDetails(doctorId)
    } else {
      // Regular protocol reply
      reply = matched.reply_text
      if (matched.disclaimer) {
        reply += `\n\n⚠️ _${matched.disclaimer}_`
      }
    }

    await sendReplyWithTail(phone, doctorId, reply)

    // Save bot response
    await query(
      `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type, protocol_id)
       VALUES ($1, $2, 'outbound', 'bot', $3, 'text', $4)`,
      [phone, doctorId, reply, matched.id]
    )

    // Increment usage
    await query('UPDATE protocols SET usage_count = usage_count + 1 WHERE id = $1', [matched.id])

    console.log(`[webhook][${requestId}] protocol matched: ${matched.title}`)
  } else {
    // No match — notify doctor will respond
    await sendReplyWithTail(
      phone,
      doctorId,
      'Your message has been noted. The doctor will respond shortly.'
    )

    // Mark urgent + increment unread
    await query(
      'UPDATE patient_doctor_mappings SET is_urgent = true, unread_count = unread_count + 1 WHERE id = $1',
      [mappingId]
    )

    console.log(`[webhook][${requestId}] no match, marked urgent`)
  }
}

// ──────────────────────────────────────────────
// HELPER: 24h time → human readable AM/PM
// ──────────────────────────────────────────────
function formatTime(time: string): string {
  const [h, m] = time.substring(0, 5).split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`
}

// ──────────────────────────────────────────────
// HELPER: IST-aware time helpers
// Server may run in UTC; clinics operate in IST. All booking decisions
// use these helpers so an OPD that ends 9pm IST never accepts a 10pm IST tap.
// ──────────────────────────────────────────────
const IST_OFFSET_MIN = 5 * 60 + 30
const BOOKING_CUTOFF_MINUTES = 5 // refuse booking within last 5 minutes of session

function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MIN * 60 * 1000)
}

function todayStrIST(): string {
  return nowIST().toISOString().split('T')[0]
}

function nowMinutesIST(): number {
  const ist = nowIST()
  return ist.getUTCHours() * 60 + ist.getUTCMinutes()
}

/** "21:00:00" or "21:00" → minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.substring(0, 5).split(':').map(Number)
  return h * 60 + m
}

/** Is this session still bookable right now (today only)? */
function isSessionBookableToday(session: { end_time: string }): boolean {
  return timeToMinutes(session.end_time) - BOOKING_CUTOFF_MINUTES > nowMinutesIST()
}

// ──────────────────────────────────────────────
// PATIENT TAIL HELPERS
// Every dead-end reply ends with [Primary CTA] [Main Menu] so the patient
// never has to type "hi" again to summon the menu. The CTA is state-aware:
// active booking → "View My Token"; otherwise → "Book Appointment".
// ──────────────────────────────────────────────
async function pickPrimaryCta(
  phone: string,
  doctorId: string
): Promise<{ id: string; title: string }> {
  const active = await query(
    `SELECT 1 FROM appointments
     WHERE patient_phone = $1 AND doctor_id = $2
       AND appointment_date >= CURRENT_DATE AND status = 'booked'
     LIMIT 1`,
    [phone, doctorId]
  )
  if (active.rows.length > 0) return { id: PT_VIEW_TOKEN, title: 'View My Token' }
  return { id: PT_BOOK_APPT, title: 'Book Appointment' }
}

/**
 * Send a text reply with a 2-button tail [Primary CTA] [Main Menu].
 * If `customCta` is null, only the Main Menu button is shown.
 */
async function sendReplyWithTail(
  phone: string,
  doctorId: string,
  body: string,
  customCta?: { id: string; title: string } | null
) {
  const cta = customCta === undefined ? await pickPrimaryCta(phone, doctorId) : customCta
  const buttons = cta
    ? [
        { id: cta.id, title: cta.title.substring(0, 20) },
        { id: PT_MAIN_MENU, title: 'Main Menu' },
      ]
    : [{ id: PT_MAIN_MENU, title: 'Main Menu' }]
  await sendWhatsAppButtons(phone, body, buttons)
}

/**
 * Render the Clinic Details system protocol body. Extracted so the
 * VIEW_DETAILS handler and the regular keyword/menu path share rendering.
 */
async function renderClinicDetails(doctorId: string): Promise<string> {
  const docResult = await query(
    `SELECT name, specialty, clinic_name, clinic_address, city,
            clinic_phone, doctor_code, phone
     FROM doctors WHERE id = $1`,
    [doctorId]
  )
  const doc = docResult.rows[0]

  const parts: string[] = []
  if (doc.clinic_name) parts.push(`*${doc.clinic_name}*`)
  if (doc.name) parts.push(`${formatDrName(doc.name)}${doc.specialty ? ' — ' + doc.specialty : ''}`)
  if (doc.clinic_address || doc.city) {
    const addr = [doc.clinic_address, doc.city].filter(Boolean).join(', ')
    parts.push(`📍 ${addr}`)
  }

  const sessResult = await query(
    `SELECT name, start_time, end_time, days FROM opd_sessions
     WHERE doctor_id = $1 AND is_active = true ORDER BY start_time ASC`,
    [doctorId]
  )
  if (sessResult.rows.length > 0) {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const unionDays = '0000000'.split('')
    for (const s of sessResult.rows) {
      const d = s.days || '1111110'
      for (let i = 0; i < 7; i++) {
        if (d[i] === '1') unionDays[i] = '1'
      }
    }
    const openDays = dayNames.filter((_, i) => unionDays[i] === '1').join(', ')
    for (const s of sessResult.rows) {
      parts.push(`⏰ ${s.name}: ${formatTime(s.start_time)}–${formatTime(s.end_time)}`)
    }
    parts.push(`📅 ${openDays}`)
  }

  if (doc.clinic_phone) parts.push(`📞 ${doc.clinic_phone}`)

  const waPhone = process.env.WHATSAPP_BUSINESS_PHONE || doc.phone
  if (doc.doctor_code) {
    const clinicLabel = doc.clinic_name || formatDrName(doc.name || '')
    const shareLink = `https://wa.me/${waPhone}?text=${encodeURIComponent('Hi! Clinic code: ' + doc.doctor_code)}`
    parts.push('')
    parts.push(`_Connect with ${clinicLabel} via WhatsApp_ 👇`)
    parts.push(shareLink)
  }

  return parts.join('\n')
}

/**
 * Send the main menu list message (greeting + up to 10 menu protocols).
 * Used both on first clinic-code join and on every greeting / Main Menu tap.
 * Pagination for >10 protocols comes in a follow-up commit.
 */
// Menu pagination — WhatsApp list messages are capped at 10 rows.
// Page 1: 2 pinned (View Details + Book Appointment) + up to 7 protocols + 1 "More" row = 10
// Pages 2+: up to 9 protocols + 1 "More" row = 10
const MENU_PAGE1_PROTOCOLS = 7
const MENU_PAGE_N_PROTOCOLS = 9

async function sendMainMenu(
  phone: string,
  doctorId: string,
  page = 1,
  customGreeting?: string
) {
  const docResult = await query('SELECT name, clinic_name FROM doctors WHERE id = $1', [doctorId])
  const doc = docResult.rows[0]
  const clinicLabel = doc?.clinic_name ?? formatDrName(doc?.name ?? '')

  // Doctor-configured menu protocols (system protocols are pinned separately)
  const menuProtocols = await query(
    `SELECT id, title FROM protocols
     WHERE doctor_id = $1 AND is_active = true AND add_to_menu = true AND deleted_at IS NULL
       AND protocol_type != 'system'
     ORDER BY usage_count DESC, created_at ASC`,
    [doctorId]
  )

  const greeting = customGreeting ?? `Welcome to *${clinicLabel}*. How can we help you?`

  const safePage = Math.max(1, Math.floor(page))
  let items: { id: string; title: string }[] = []
  let cursor = 0

  if (safePage === 1) {
    // Pinned: View Details + Book Appointment always at top of page 1
    items.push(
      { id: PT_VIEW_DETAILS, title: 'View Details' },
      { id: PT_BOOK_APPT, title: 'Book Appointment' }
    )
    const slice = menuProtocols.rows.slice(0, MENU_PAGE1_PROTOCOLS)
    for (const p of slice) items.push({ id: p.id, title: p.title.substring(0, 24) })
    cursor = slice.length
  } else {
    const start = MENU_PAGE1_PROTOCOLS + (safePage - 2) * MENU_PAGE_N_PROTOCOLS
    const slice = menuProtocols.rows.slice(start, start + MENU_PAGE_N_PROTOCOLS)
    for (const p of slice) items.push({ id: p.id, title: p.title.substring(0, 24) })
    cursor = start + slice.length
  }

  // "More options →" if more protocols remain
  if (cursor < menuProtocols.rows.length) {
    items.push({ id: `MENU_PAGE_${safePage + 1}`, title: 'More options →' })
  }
  // On page 2+, also offer "← Back to top" if no more (so patient isn't stuck deep)
  if (safePage > 1 && cursor >= menuProtocols.rows.length && items.length < 10) {
    items.push({ id: 'MENU_PAGE_1', title: '← Back to top' })
  }

  if (items.length === 0) {
    await sendWhatsAppMessage(
      phone,
      greeting + '\n\nType your query and the doctor will respond shortly.'
    )
    return
  }

  await sendWhatsAppMenu(phone, greeting, items)
}

/**
 * Show the patient's current active booking (token + session + day).
 * Triggered by VIEW_TOKEN button or after a booking is created.
 */
async function handleViewToken(phone: string, doctorId: string) {
  const bookingResult = await query(
    `SELECT a.token_number, a.appointment_date, s.name AS session_name,
            s.start_time, s.end_time
     FROM appointments a
     JOIN opd_sessions s ON s.id = a.session_id
     WHERE a.patient_phone = $1 AND a.doctor_id = $2
       AND a.appointment_date >= CURRENT_DATE AND a.status = 'booked'
     ORDER BY a.appointment_date ASC LIMIT 1`,
    [phone, doctorId]
  )
  if (bookingResult.rows.length === 0) {
    await sendReplyWithTail(phone, doctorId, 'You have no active bookings.')
    return
  }
  const b = bookingResult.rows[0]
  const dayLabel = formatDayLabel(b.appointment_date.toISOString().split('T')[0])
  const sessionTime = `${formatTime(b.start_time)}–${formatTime(b.end_time)}`
  const reply =
    `🎫 *Token #${b.token_number}*\n` +
    `📋 ${b.session_name}\n` +
    `📅 ${dayLabel} · ${sessionTime}\n\n` +
    `_Reply "cancel" to cancel this booking._`
  await sendReplyWithTail(phone, doctorId, reply, null) // no primary CTA — patient is already viewing
}

// ──────────────────────────────────────────────
// HELPER: Get next N available dates for OPD
// For today, a session must still have time left (end_time minus cutoff > now).
// ──────────────────────────────────────────────
function getAvailableDates(
  sessions: { days: string; end_time: string }[],
  count: number
): Date[] {
  const dates: Date[] = []
  const base = nowIST()
  const todayStr = todayStrIST()
  // Check up to 14 days ahead
  for (let i = 0; i < 14 && dates.length < count; i++) {
    const check = new Date(base)
    check.setUTCDate(base.getUTCDate() + i)
    const dayIndex = (check.getUTCDay() + 6) % 7 // 0=Mon
    const checkStr = check.toISOString().split('T')[0]
    const isToday = checkStr === todayStr
    const hasSession = sessions.some((s) => {
      const days = s.days || '1111110'
      if (days[dayIndex] !== '1') return false
      if (isToday && !isSessionBookableToday(s)) return false
      return true
    })
    if (hasSession) dates.push(check)
  }
  return dates
}

// ──────────────────────────────────────────────
// HANDLER: Appointment booking — Step 1: show available days
// ──────────────────────────────────────────────
async function handleAppointmentBooking(
  phone: string,
  doctorId: string,
  protocolId: string,
  requestId: string,
  opts: { skipExistingCheck?: boolean } = {}
) {
  // ── One-booking-max guard ──
  // If patient already has an active future booking with this doctor, show a
  // Reschedule / Cancel card instead of letting them create a second booking.
  // Skipped when called from the Reschedule path (old booking already cancelled).
  if (!opts.skipExistingCheck) {
    const existing = await query(
      `SELECT a.id, a.token_number, a.appointment_date, s.name AS session_name,
              s.start_time, s.end_time
       FROM appointments a
       JOIN opd_sessions s ON s.id = a.session_id
       WHERE a.patient_phone = $1 AND a.doctor_id = $2
         AND a.appointment_date >= CURRENT_DATE AND a.status = 'booked'
       ORDER BY a.appointment_date ASC LIMIT 1`,
      [phone, doctorId]
    )
    if (existing.rows.length > 0) {
      const b = existing.rows[0]
      const dayLabel = formatDayLabel(b.appointment_date.toISOString().split('T')[0])
      const timeRange = `${formatTime(b.start_time)}–${formatTime(b.end_time)}`
      const body =
        `You already have an active booking:\n\n` +
        `🎫 *Token #${b.token_number}*\n` +
        `📋 ${b.session_name}\n` +
        `📅 ${dayLabel} · ${timeRange}\n\n` +
        `_Only one active booking is allowed at a time._`
      await sendWhatsAppButtons(phone, body, [
        { id: `RESCHEDULE_${b.id}`, title: 'Reschedule' },
        { id: `CANCEL_ASK_${b.id}`, title: 'Cancel booking' },
        { id: PT_MAIN_MENU, title: 'Main Menu' },
      ])
      console.log(`[webhook][${requestId}] booking blocked — patient ${phone} has active token #${b.token_number}`)
      return
    }
  }

  // Get active sessions
  const sessionsResult = await query(
    `SELECT id, name, start_time, end_time, days, avg_minutes
     FROM opd_sessions
     WHERE doctor_id = $1 AND is_active = true
     ORDER BY start_time ASC`,
    [doctorId]
  )

  if (sessionsResult.rows.length === 0) {
    await sendWhatsAppMessage(phone, 'Sorry, appointment booking is not available at this time.')
    return
  }

  // Get next 3 available dates
  const availDates = getAvailableDates(sessionsResult.rows as { days: string; end_time: string }[], 3)

  if (availDates.length === 0) {
    await sendWhatsAppMessage(phone, 'Sorry, no OPD sessions are available in the coming days.')
    return
  }

  // Increment protocol usage
  await query('UPDATE protocols SET usage_count = usage_count + 1 WHERE id = $1', [protocolId])

  // Get doctor info
  const docResult = await query('SELECT name, clinic_name, plan FROM doctors WHERE id = $1', [doctorId])
  const doc = docResult.rows[0]
  const clinicLabel = doc?.clinic_name || formatDrName(doc?.name || '')
  const plan = doc?.plan || 'free'

  // Count booked tokens per date
  const dateStrs = availDates.map((d) => d.toISOString().split('T')[0])
  const countResult = await query(
    `SELECT appointment_date::text AS dt, COUNT(*) AS cnt
     FROM appointments
     WHERE doctor_id = $1 AND appointment_date = ANY($2) AND status = 'booked'
     GROUP BY appointment_date`,
    [doctorId, dateStrs]
  )
  const bookedMap: Record<string, number> = {}
  for (const r of countResult.rows) {
    bookedMap[r.dt] = parseInt(r.cnt, 10)
  }

  // Build day items (IST-aware)
  const todayStr = todayStrIST()
  const tomorrowDate = new Date(nowIST())
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1)
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0]

  const dayItems = availDates.map((d) => {
    const ds = d.toISOString().split('T')[0]
    const booked = bookedMap[ds] || 0
    let label: string
    if (ds === todayStr) {
      label = 'Today'
    } else if (ds === tomorrowStr) {
      label = 'Tomorrow'
    } else {
      label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }
    // Free plan cap info
    const remaining = 10 - booked
    const slotsInfo = plan === 'free'
      ? remaining <= 0 ? ' · Full' : ` · ${remaining} left`
      : booked > 0 ? ` · ${booked} booked` : ''

    return {
      id: `appt_day_${ds}`,
      // Buttons: max 20 chars
      btnTitle: `${label}${slotsInfo}`.substring(0, 20),
      // List: max 24 chars
      listTitle: `${label}${slotsInfo}`.substring(0, 24),
    }
  })

  const bodyText = `📅 *Book Appointment*\n${clinicLabel}\n\nSelect a day:`

  if (dayItems.length <= 3) {
    await sendWhatsAppButtons(phone, bodyText, dayItems.map((d) => ({ id: d.id, title: d.btnTitle })))
  } else {
    await sendWhatsAppMenu(phone, bodyText, dayItems.map((d) => ({ id: d.id, title: d.listTitle })))
  }

  // Save bot response
  await query(
    `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type, protocol_id)
     VALUES ($1, $2, 'outbound', 'bot', $3, 'text', $4)`,
    [phone, doctorId, bodyText, protocolId]
  )

  console.log(`[webhook][${requestId}] appointment days shown: ${dayItems.length}`)
}

// ──────────────────────────────────────────────
// HANDLER: Appointment — Step 2: patient picks day, show sessions
// ──────────────────────────────────────────────
async function handleAppointmentDaySelect(
  phone: string,
  doctorId: string,
  dateStr: string,
  requestId: string
) {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    await sendWhatsAppMessage(phone, 'Invalid date. Please try booking again.')
    return
  }

  // Reject past dates (e.g. stale button tap)
  if (dateStr < todayStrIST()) {
    await sendWhatsAppMessage(phone, 'That date has already passed. Please book again.')
    return
  }

  const bookingDate = new Date(dateStr + 'T00:00:00')
  const dayIndex = (bookingDate.getDay() + 6) % 7 // 0=Mon
  const isToday = dateStr === todayStrIST()

  // Check if patient already has any active future booking (one-booking-max)
  const existingBooking = await query(
    `SELECT a.id, a.token_number, a.appointment_date, s.name AS session_name FROM appointments a
     JOIN opd_sessions s ON s.id = a.session_id
     WHERE a.patient_phone = $1 AND a.doctor_id = $2
       AND a.appointment_date >= CURRENT_DATE AND a.status = 'booked'
     ORDER BY a.appointment_date ASC LIMIT 1`,
    [phone, doctorId]
  )

  if (existingBooking.rows.length > 0) {
    const b = existingBooking.rows[0]
    const dayLabel = formatDayLabel(b.appointment_date.toISOString().split('T')[0])
    await sendWhatsAppButtons(
      phone,
      `You already have *Token #${b.token_number}* for ${b.session_name} on ${dayLabel}.\n\n_Only one active booking is allowed at a time._`,
      [
        { id: `RESCHEDULE_${b.id}`, title: 'Reschedule' },
        { id: `CANCEL_ASK_${b.id}`, title: 'Cancel booking' },
        { id: PT_MAIN_MENU, title: 'Main Menu' },
      ]
    )
    return
  }

  // Get sessions active on this day
  const sessionsResult = await query(
    `SELECT id, name, start_time, end_time, days, avg_minutes
     FROM opd_sessions
     WHERE doctor_id = $1 AND is_active = true
     ORDER BY start_time ASC`,
    [doctorId]
  )

  const daySessions = sessionsResult.rows.filter((s) => {
    const days = s.days || '1111110'
    if (days[dayIndex] !== '1') return false
    if (isToday && !isSessionBookableToday(s as { end_time: string })) return false
    return true
  })

  if (daySessions.length === 0) {
    const msg = isToday
      ? 'OPD has ended for today. Please choose another day.'
      : 'No OPD sessions available on this day. Please choose another day.'
    await sendWhatsAppMessage(phone, msg)
    return
  }

  // Smart skip: if only 1 session, book directly
  if (daySessions.length === 1) {
    await handleAppointmentSessionSelect(phone, doctorId, daySessions[0].id, dateStr, requestId)
    return
  }

  // Get booked counts per session for this date
  const countResult = await query(
    `SELECT session_id, COUNT(*) AS cnt FROM appointments
     WHERE doctor_id = $1 AND appointment_date = $2 AND status = 'booked'
     GROUP BY session_id`,
    [doctorId, dateStr]
  )
  const sessionCounts: Record<string, number> = {}
  for (const r of countResult.rows) {
    sessionCounts[r.session_id] = parseInt(r.cnt, 10)
  }

  const dayLabel = formatDayLabel(dateStr)

  const sessionItems = daySessions.map((s) => {
    const booked = sessionCounts[s.id] || 0
    const timeRange = `${formatTime(s.start_time)}-${formatTime(s.end_time)}`
    const shortName = s.name.replace(/ OPD$/i, '')
    return {
      // appt_session_{sessionId}_{date}
      id: `appt_session_${s.id}_${dateStr}`,
      btnTitle: `${shortName} ${timeRange}`.substring(0, 20),
      listTitle: `${s.name} ${timeRange}`.substring(0, 24),
    }
  })

  const bodyText = `📅 *${dayLabel}*\nSelect a session:`

  if (sessionItems.length <= 3) {
    await sendWhatsAppButtons(phone, bodyText, sessionItems.map((s) => ({ id: s.id, title: s.btnTitle })))
  } else {
    await sendWhatsAppMenu(phone, bodyText, sessionItems.map((s) => ({ id: s.id, title: s.listTitle })))
  }

  // Save bot response
  await query(
    `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type)
     VALUES ($1, $2, 'outbound', 'bot', $3, 'text')`,
    [phone, doctorId, bodyText]
  )

  console.log(`[webhook][${requestId}] appointment sessions shown for ${dateStr}: ${daySessions.length}`)
}

/** Human label for a date: Today / Tomorrow / 28 Apr */
function formatDayLabel(dateStr: string): string {
  const todayStr = todayStrIST()
  const tomorrowDate = new Date(nowIST())
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1)
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0]

  if (dateStr === todayStr) return 'Today'
  if (dateStr === tomorrowStr) return 'Tomorrow'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ──────────────────────────────────────────────
// HANDLER: Appointment — Step 3: patient picks session, book token
// ──────────────────────────────────────────────
async function handleAppointmentSessionSelect(
  phone: string,
  doctorId: string,
  sessionId: string,
  bookingDate: string,
  requestId: string
) {
  // Verify session belongs to this doctor
  const sessionResult = await query(
    'SELECT id, name, start_time, end_time, avg_minutes FROM opd_sessions WHERE id = $1 AND doctor_id = $2 AND is_active = true',
    [sessionId, doctorId]
  )

  if (sessionResult.rows.length === 0) {
    await sendWhatsAppMessage(phone, 'This session is no longer available. Please try booking again.')
    return
  }

  const session = sessionResult.rows[0]

  // OPD-window guard: reject past dates and ended sessions for today
  if (bookingDate < todayStrIST()) {
    await sendWhatsAppMessage(phone, 'That date has already passed. Please book again.')
    return
  }
  if (bookingDate === todayStrIST() && !isSessionBookableToday(session as { end_time: string })) {
    await sendWhatsAppMessage(
      phone,
      `Sorry, *${session.name}* has ended for today. Please book for another day.`
    )
    return
  }

  // Check if patient already has any active future booking (one-booking-max)
  const existingBooking = await query(
    `SELECT a.id, a.token_number, a.appointment_date, s.name AS session_name FROM appointments a
     JOIN opd_sessions s ON s.id = a.session_id
     WHERE a.patient_phone = $1 AND a.doctor_id = $2
       AND a.appointment_date >= CURRENT_DATE AND a.status = 'booked'
     ORDER BY a.appointment_date ASC LIMIT 1`,
    [phone, doctorId]
  )

  if (existingBooking.rows.length > 0) {
    const b = existingBooking.rows[0]
    const dayLabel = formatDayLabel(b.appointment_date.toISOString().split('T')[0])
    await sendWhatsAppButtons(
      phone,
      `You already have *Token #${b.token_number}* for ${b.session_name} on ${dayLabel}.\n\n_Only one active booking is allowed at a time._`,
      [
        { id: `RESCHEDULE_${b.id}`, title: 'Reschedule' },
        { id: `CANCEL_ASK_${b.id}`, title: 'Cancel booking' },
        { id: PT_MAIN_MENU, title: 'Main Menu' },
      ]
    )
    return
  }

  // Free plan: check 10/day cap across all sessions
  const planResult = await query('SELECT plan FROM doctors WHERE id = $1', [doctorId])
  const plan = planResult.rows[0]?.plan || 'free'

  if (plan === 'free') {
    const dailyCount = await query(
      `SELECT COUNT(*) as cnt FROM appointments
       WHERE doctor_id = $1 AND appointment_date = $2 AND status = 'booked'`,
      [doctorId, bookingDate]
    )
    const currentCount = parseInt(dailyCount.rows[0].cnt, 10)
    if (currentCount >= 10) {
      await sendReplyWithTail(
        phone,
        doctorId,
        "Today's queue is full. Please try tomorrow or contact the clinic directly.",
        null
      )

      // Alert doctor about missed booking (save as system message)
      const patientResult2 = await query('SELECT name FROM patients WHERE phone = $1', [phone])
      const pName = patientResult2.rows[0]?.name || phone
      await query(
        `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type)
         VALUES ($1, $2, 'inbound', 'system', $3, 'text')`,
        [phone, doctorId, `⚠️ ${pName} tried to book an appointment but your free plan limit (10/day) was reached. Upgrade to accept unlimited bookings.`]
      )

      // Mark patient as urgent so doctor sees the alert in inbox
      await query(
        `UPDATE patient_doctor_mappings SET is_urgent = true, unread_count = unread_count + 1
         WHERE patient_phone = $1 AND doctor_id = $2`,
        [phone, doctorId]
      )

      console.log(`[webhook][${requestId}] free plan appointment limit reached, patient ${phone} turned away`)
      return
    }
  }

  // Get patient name
  const patientResult = await query('SELECT name FROM patients WHERE phone = $1', [phone])
  const patientName = patientResult.rows[0]?.name || null

  // Atomic token assignment
  const insertResult = await query(
    `INSERT INTO appointments (doctor_id, session_id, patient_phone, patient_name, token_number, appointment_date)
     VALUES ($1, $2, $3, $4,
       (SELECT COALESCE(MAX(token_number), 0) + 1 FROM appointments
        WHERE session_id = $2 AND appointment_date = $5 AND status != 'cancelled'),
       $5)
     RETURNING token_number`,
    [doctorId, sessionId, phone, patientName, bookingDate]
  )
  const tokenNumber = insertResult.rows[0].token_number

  // Calculate estimated wait
  const waitMinutes = (tokenNumber - 1) * (session.avg_minutes || 5)
  const waitText = waitMinutes > 0 ? `⏱️ Est. wait: ~${waitMinutes} min from session start` : '⏱️ You are first in queue!'

  // Get doctor name
  const docResult = await query('SELECT name, clinic_name FROM doctors WHERE id = $1', [doctorId])
  const doc = docResult.rows[0]
  const drName = doc?.name ? formatDrName(doc.name) : 'Doctor'

  const dayLabel = formatDayLabel(bookingDate)
  const sessionTime = `${formatTime(session.start_time)}–${formatTime(session.end_time)}`

  const reply =
    `✅ *Token #${tokenNumber} booked!*\n\n` +
    `📋 ${drName}'s ${session.name}\n` +
    `📅 ${dayLabel} · ${sessionTime}\n` +
    `🔢 Token: *#${tokenNumber}*\n` +
    `${waitText}\n\n` +
    `_Reply "cancel" to cancel this booking._`

  // Tail: View My Token (most likely next intent right after booking) + Main Menu
  await sendReplyWithTail(
    phone,
    doctorId,
    reply,
    { id: PT_VIEW_TOKEN, title: 'View My Token' }
  )

  // Save bot response
  await query(
    `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type)
     VALUES ($1, $2, 'outbound', 'bot', $3, 'text')`,
    [phone, doctorId, reply]
  )

  console.log(`[webhook][${requestId}] appointment booked: token #${tokenNumber} session=${session.name} date=${bookingDate}`)
}

// ──────────────────────────────────────────────
// CANCEL FLOW
// Two-step: Ask → Confirm → (optional Reason). The patient typing "cancel"
// or tapping "Cancel booking" anywhere goes through ASK first; cancellation
// only happens after explicit Yes confirmation.
// ──────────────────────────────────────────────

/** Step 1 — keyword "cancel" entry: find their booking and route to ASK */
async function handleAppointmentCancel(
  phone: string,
  doctorId: string,
  requestId: string
) {
  const booking = await query(
    `SELECT a.id FROM appointments a
     WHERE a.patient_phone = $1 AND a.doctor_id = $2
       AND a.appointment_date >= CURRENT_DATE AND a.status = 'booked'
     ORDER BY a.appointment_date ASC, a.created_at DESC LIMIT 1`,
    [phone, doctorId]
  )

  if (booking.rows.length === 0) {
    await sendReplyWithTail(
      phone,
      doctorId,
      "You don't have any upcoming appointments to cancel."
    )
    return
  }

  await handleCancelAsk(phone, doctorId, booking.rows[0].id, requestId)
}

/** Step 2 — show confirm card with [Yes, cancel] [No, keep it] */
async function handleCancelAsk(
  phone: string,
  doctorId: string,
  apptId: string,
  requestId: string
) {
  const result = await query(
    `SELECT a.id, a.token_number, a.appointment_date, a.status,
            s.name AS session_name, s.start_time, s.end_time
     FROM appointments a
     JOIN opd_sessions s ON s.id = a.session_id
     WHERE a.id = $1 AND a.patient_phone = $2 AND a.doctor_id = $3`,
    [apptId, phone, doctorId]
  )
  if (result.rows.length === 0 || result.rows[0].status !== 'booked') {
    await sendReplyWithTail(phone, doctorId, 'This booking is no longer active.')
    return
  }
  const b = result.rows[0]
  const dayLabel = formatDayLabel(b.appointment_date.toISOString().split('T')[0])
  const timeRange = `${formatTime(b.start_time)}–${formatTime(b.end_time)}`
  const body =
    `Cancel this booking?\n\n` +
    `🎫 *Token #${b.token_number}*\n` +
    `📋 ${b.session_name}\n` +
    `📅 ${dayLabel} · ${timeRange}\n\n` +
    `_This can't be undone._`
  await sendWhatsAppButtons(phone, body, [
    { id: `CANCEL_CONFIRM_${b.id}`, title: 'Yes, cancel' },
    { id: 'CANCEL_ABORT', title: 'No, keep it' },
  ])
  console.log(`[webhook][${requestId}] cancel confirm shown for token #${b.token_number}`)
}

/** Step 3 — execute cancel + ask reason */
async function handleCancelConfirm(
  phone: string,
  doctorId: string,
  apptId: string,
  requestId: string
) {
  const result = await query(
    `UPDATE appointments
     SET status = 'cancelled', cancelled_at = now()
     WHERE id = $1 AND patient_phone = $2 AND doctor_id = $3 AND status = 'booked'
     RETURNING token_number, appointment_date, session_id`,
    [apptId, phone, doctorId]
  )

  if (result.rows.length === 0) {
    await sendReplyWithTail(phone, doctorId, 'This booking is no longer active.')
    return
  }

  const tokenNumber = result.rows[0].token_number
  const sessionResult = await query(
    'SELECT name FROM opd_sessions WHERE id = $1',
    [result.rows[0].session_id]
  )
  const sessionName = sessionResult.rows[0]?.name ?? 'Appointment'
  const dayLabel = formatDayLabel(result.rows[0].appointment_date.toISOString().split('T')[0])

  // Cancellation confirmation + optional reason buttons
  const body =
    `✅ *Token #${tokenNumber}* (${sessionName}, ${dayLabel}) has been cancelled.\n\n` +
    `_Optional: tell us why so the doctor knows._`
  await sendWhatsAppButtons(phone, body, [
    { id: `CANCEL_REASON_${apptId}_better`, title: 'Got better' },
    { id: `CANCEL_REASON_${apptId}_clash`, title: 'Schedule clash' },
    { id: `CANCEL_REASON_${apptId}_other`, title: 'Other reason' },
  ])

  await query(
    `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type)
     VALUES ($1, $2, 'outbound', 'bot', $3, 'text')`,
    [phone, doctorId, body]
  )

  console.log(`[webhook][${requestId}] appointment cancelled: token #${tokenNumber}`)
}

/** Step 4 (optional) — save reason + close loop with tail */
async function handleCancelReason(
  phone: string,
  doctorId: string,
  apptId: string,
  reason: string,
  requestId: string
) {
  await query(
    `UPDATE appointments SET cancellation_reason = $1
     WHERE id = $2 AND patient_phone = $3 AND doctor_id = $4`,
    [reason, apptId, phone, doctorId]
  )
  await sendReplyWithTail(
    phone,
    doctorId,
    'Thanks for letting us know. Hope to see you again soon.',
    { id: PT_BOOK_APPT, title: 'Book Again' }
  )
  console.log(`[webhook][${requestId}] cancel reason saved: ${reason}`)
}

/** Cancel-abort — user chose "No, keep it" */
async function handleCancelAbort(phone: string, doctorId: string) {
  await sendReplyWithTail(
    phone,
    doctorId,
    'Booking kept. Your token is still active.',
    { id: PT_VIEW_TOKEN, title: 'View My Token' }
  )
}

// ──────────────────────────────────────────────
// RESCHEDULE — atomic cancel old (reason='rescheduled') + show day picker
// ──────────────────────────────────────────────
async function handleReschedule(
  phone: string,
  doctorId: string,
  apptId: string,
  requestId: string
) {
  const result = await query(
    `UPDATE appointments
     SET status = 'cancelled', cancelled_at = now(), cancellation_reason = 'rescheduled'
     WHERE id = $1 AND patient_phone = $2 AND doctor_id = $3 AND status = 'booked'
     RETURNING token_number`,
    [apptId, phone, doctorId]
  )
  if (result.rows.length === 0) {
    await sendReplyWithTail(phone, doctorId, 'That booking is no longer active.')
    return
  }
  console.log(`[webhook][${requestId}] rescheduling — old token #${result.rows[0].token_number} cancelled`)

  // Find Book Appointment system protocol id
  const sys = await query(
    `SELECT id FROM protocols
     WHERE doctor_id = $1 AND protocol_type = 'system' AND title = 'Book Appointment' AND deleted_at IS NULL
     LIMIT 1`,
    [doctorId]
  )
  const protocolId = sys.rows[0]?.id ?? apptId // fallback so usage_count update doesn't crash
  await handleAppointmentBooking(phone, doctorId, protocolId, requestId, { skipExistingCheck: true })
}

export default router
