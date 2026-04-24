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
const DOCTOR_SIGNUP_CODE = 'DOCTOR_SIGNUP'

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
      'SELECT id, name, onboarding_complete, jwt_version FROM doctors WHERE phone = $1',
      [from]
    )
    if (doctorCheck.rows.length > 0) {
      const doc = doctorCheck.rows[0]
      if (doc.onboarding_complete) {
        const lowerText = trimmedText.toLowerCase()
        const wantsLogin = GREETINGS.includes(lowerText) ||
          ['login', 'dashboard', 'link', 'open', 'app'].includes(lowerText)

        if (wantsLogin) {
          // Send magic link
          const token = crypto.randomBytes(32).toString('hex')
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
          await query('UPDATE magic_links SET used = true WHERE doctor_id = $1 AND used = false', [doc.id])
          await query(
            'INSERT INTO magic_links (token, doctor_id, purpose, expires_at) VALUES ($1, $2, $3, $4)',
            [token, doc.id, 'login', expiresAt]
          )
          const link = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`
          await sendWhatsAppCTAButton(
            from,
            `Welcome back, ${formatDrName(doc.name || '')}.\n\n_Link expires in 60 minutes._`,
            'Open Dashboard',
            link
          )
        }
        // Silently ignore other messages from doctors (they use the PWA to chat)
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
      await sendWhatsAppMessage(phone, `Welcome back, ${formatDrName(doc.name || '')}. Reply with any message to receive your dashboard link.`)
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

  // Send welcome + menu
  const menuProtocols = await query(
    `SELECT id, title FROM protocols
     WHERE doctor_id = $1 AND is_active = true AND add_to_menu = true AND deleted_at IS NULL`,
    [doctor.id]
  )

  const termsUrl = `${process.env.APP_URL || 'https://drcliniq.in'}/terms`
  const welcomeText = `Welcome to *${doctor.clinic_name || formatDrName(doctor.name || '')}*.\nHow can we help you today?\n\n_By continuing, you agree to our Terms & Privacy Policy: ${termsUrl}_`

  if (menuProtocols.rows.length > 0) {
    await sendWhatsAppMenu(
      phone,
      welcomeText,
      menuProtocols.rows.map((p) => ({ id: p.id, title: p.title }))
    )
  } else {
    await sendWhatsAppMessage(phone, welcomeText + '\n\nType your query and the doctor will respond shortly.')
  }

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
  if (CANCEL_KEYWORDS.some((kw) => lowerText.includes(kw))) {
    await handleAppointmentCancel(phone, doctorId, requestId)
    return
  }

  // Fetch menu protocols
  const menuProtocols = await query(
    `SELECT id, title FROM protocols
     WHERE doctor_id = $1 AND is_active = true AND add_to_menu = true AND deleted_at IS NULL`,
    [doctorId]
  )

  // Greeting → show menu
  if (isGreeting && menuProtocols.rows.length > 0) {
    const docResult = await query('SELECT name, clinic_name FROM doctors WHERE id = $1', [doctorId])
    const doc = docResult.rows[0]

    await sendWhatsAppMenu(
      phone,
      `Welcome to *${doc?.clinic_name ?? formatDrName(doc?.name ?? '')}*. How can we help you?`,
      menuProtocols.rows.map((p) => ({ id: p.id, title: p.title }))
    )

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
      p.keywords.some((kw: string) => lowerText.includes(kw.toLowerCase()))
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

      // Derive timing from OPD sessions
      const sessResult = await query(
        `SELECT name, start_time, end_time, days FROM opd_sessions
         WHERE doctor_id = $1 AND is_active = true ORDER BY start_time ASC`,
        [doctorId]
      )
      if (sessResult.rows.length > 0) {
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        // Union of all active days across sessions
        const unionDays = '0000000'.split('')
        for (const s of sessResult.rows) {
          const d = s.days || '1111110'
          for (let i = 0; i < 7; i++) {
            if (d[i] === '1') unionDays[i] = '1'
          }
        }
        const openDays = dayNames.filter((_, i) => unionDays[i] === '1').join(', ')
        // Show each OPD session
        for (const s of sessResult.rows) {
          parts.push(`⏰ ${s.name}: ${formatTime(s.start_time)}–${formatTime(s.end_time)}`)
        }
        parts.push(`📅 ${openDays}`)
      }

      if (doc.clinic_phone) parts.push(`📞 ${doc.clinic_phone}`)

      // Add shareable link
      const waPhone = process.env.WHATSAPP_BUSINESS_PHONE || doc.phone
      if (doc.doctor_code) {
        const clinicLabel = doc.clinic_name || formatDrName(doc.name || '')
        const shareLink = `https://wa.me/${waPhone}?text=${encodeURIComponent('Hi! Clinic code: ' + doc.doctor_code)}`
        parts.push('')
        parts.push(`_Connect with ${clinicLabel} via WhatsApp_ 👇`)
        parts.push(shareLink)
      }

      reply = parts.join('\n')
    } else {
      // Regular protocol reply
      reply = matched.reply_text
      if (matched.disclaimer) {
        reply += `\n\n⚠️ _${matched.disclaimer}_`
      }
    }

    await sendWhatsAppMessage(phone, reply)

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
    await sendWhatsAppMessage(phone, 'Your message has been noted. The doctor will respond shortly.')

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
// HELPER: Get next N available dates for OPD
// ──────────────────────────────────────────────
function getAvailableDates(
  sessions: { days: string }[],
  count: number
): Date[] {
  const dates: Date[] = []
  const d = new Date()
  // Check up to 14 days ahead
  for (let i = 0; i < 14 && dates.length < count; i++) {
    const check = new Date(d)
    check.setDate(d.getDate() + i)
    const dayIndex = (check.getDay() + 6) % 7 // 0=Mon
    // Check if any session runs on this day
    const hasSession = sessions.some((s) => {
      const days = s.days || '1111110'
      return days[dayIndex] === '1'
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
  requestId: string
) {
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
  const availDates = getAvailableDates(sessionsResult.rows, 3)

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

  // Build day items
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const dayItems = availDates.map((d) => {
    const ds = d.toISOString().split('T')[0]
    const booked = bookedMap[ds] || 0
    let label: string
    if (ds === todayStr) {
      label = 'Today'
    } else if (ds === tomorrowStr) {
      label = 'Tomorrow'
    } else {
      label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    }
    // Free plan cap info
    const slotsInfo = plan === 'free'
      ? ` · ${Math.max(0, 10 - booked)} left`
      : booked > 0 ? ` · ${booked} booked` : ''

    return {
      id: `appt_day_${ds}`,
      // Buttons: max 20 chars
      btnTitle: `${label}${slotsInfo}`.substring(0, 20),
      // List: max 24 chars
      listTitle: `${label}${slotsInfo}`.substring(0, 24),
    }
  })

  // Show OPD timings in body
  const sessionLines = sessionsResult.rows.map((s) =>
    `  • ${s.name}: ${formatTime(s.start_time)}–${formatTime(s.end_time)}`
  ).join('\n')

  const bodyText = `📅 *Book Appointment*\n${clinicLabel}\n\n${sessionLines}\n\nSelect a day:`

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

  const bookingDate = new Date(dateStr + 'T00:00:00')
  const dayIndex = (bookingDate.getDay() + 6) % 7 // 0=Mon

  // Check if patient already has a booking for this date
  const existingBooking = await query(
    `SELECT a.id, a.token_number, s.name AS session_name FROM appointments a
     JOIN opd_sessions s ON s.id = a.session_id
     WHERE a.patient_phone = $1 AND a.doctor_id = $2 AND a.appointment_date = $3 AND a.status = 'booked'`,
    [phone, doctorId, dateStr]
  )

  if (existingBooking.rows.length > 0) {
    const t = existingBooking.rows[0].token_number
    const sn = existingBooking.rows[0].session_name
    const dayLabel = formatDayLabel(dateStr)
    await sendWhatsAppMessage(
      phone,
      `You already have *Token #${t}* for ${sn} on ${dayLabel}.\n\nTo cancel, reply "cancel".`
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
    return days[dayIndex] === '1'
  })

  if (daySessions.length === 0) {
    await sendWhatsAppMessage(phone, 'No OPD sessions available on this day. Please choose another day.')
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

/** Human label for a date: Today / Tomorrow / Wed, 28 Apr */
function formatDayLabel(dateStr: string): string {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  if (dateStr === todayStr) return 'Today'
  if (dateStr === tomorrowStr) return 'Tomorrow'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
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

  // Check if patient already has any booking for this date
  const existingBooking = await query(
    `SELECT a.id, a.token_number, s.name AS session_name FROM appointments a
     JOIN opd_sessions s ON s.id = a.session_id
     WHERE a.patient_phone = $1 AND a.doctor_id = $2 AND a.appointment_date = $3 AND a.status = 'booked'`,
    [phone, doctorId, bookingDate]
  )

  if (existingBooking.rows.length > 0) {
    const t = existingBooking.rows[0].token_number
    const sn = existingBooking.rows[0].session_name
    await sendWhatsAppMessage(
      phone,
      `You already have *Token #${t}* for ${sn} on ${formatDayLabel(bookingDate)}.\n\nTo cancel, reply "cancel".`
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
    if (parseInt(dailyCount.rows[0].cnt, 10) >= 10) {
      await sendWhatsAppMessage(
        phone,
        'Sorry, all appointment slots are full for this day. Please contact the clinic directly or try another day.'
      )
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
    `To cancel, reply "cancel"`

  await sendWhatsAppMessage(phone, reply)

  // Save bot response
  await query(
    `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type)
     VALUES ($1, $2, 'outbound', 'bot', $3, 'text')`,
    [phone, doctorId, reply]
  )

  console.log(`[webhook][${requestId}] appointment booked: token #${tokenNumber} session=${session.name} date=${bookingDate}`)
}

// ──────────────────────────────────────────────
// HANDLER: Cancel appointment
// ──────────────────────────────────────────────
async function handleAppointmentCancel(
  phone: string,
  doctorId: string,
  requestId: string
) {
  // Find latest active booking (today or future)
  const booking = await query(
    `SELECT a.id, a.token_number, a.appointment_date, s.name AS session_name
     FROM appointments a
     JOIN opd_sessions s ON s.id = a.session_id
     WHERE a.patient_phone = $1 AND a.doctor_id = $2
       AND a.appointment_date >= CURRENT_DATE AND a.status = 'booked'
     ORDER BY a.appointment_date ASC, a.created_at DESC LIMIT 1`,
    [phone, doctorId]
  )

  if (booking.rows.length === 0) {
    await sendWhatsAppMessage(phone, 'You don\'t have any upcoming appointments to cancel.')
    return
  }

  const b = booking.rows[0]
  await query('UPDATE appointments SET status = $1 WHERE id = $2', ['cancelled', b.id])

  const dayLabel = formatDayLabel(b.appointment_date.toISOString().split('T')[0])
  const reply = `Your appointment (Token #${b.token_number}, ${b.session_name}, ${dayLabel}) has been cancelled.`
  await sendWhatsAppMessage(phone, reply)

  // Save bot response
  await query(
    `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type)
     VALUES ($1, $2, 'outbound', 'bot', $3, 'text')`,
    [phone, doctorId, reply]
  )

  console.log(`[webhook][${requestId}] appointment cancelled: token #${b.token_number}`)
}

export default router
