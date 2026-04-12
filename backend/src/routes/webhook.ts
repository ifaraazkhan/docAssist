import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { sendWhatsAppMessage, sendWhatsAppMenu } from '../lib/whatsapp'

const router = Router()

// GET — Meta webhook verification
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified')
    res.status(200).send(challenge)
    return
  }

  res.status(403).send('Forbidden')
})

// POST — incoming patient messages from Meta
router.post('/', async (req: Request, res: Response) => {
  // Acknowledge immediately — Meta requires response within 20s
  res.status(200).send('OK')

  try {
    const body = req.body

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) return

    const msg = messages[0]
    const from = msg.from // patient's phone number
    const msgType = msg.type

    let text = ''

    if (msgType === 'text') {
      text = msg.text?.body ?? ''
    } else if (msgType === 'interactive') {
      // Patient selected from menu
      text = msg.interactive?.list_reply?.id ?? ''
    } else {
      // Voice, image, etc. — not handled in MVP
      return
    }

    // Get the default doctor (first one — expand later for multi-doctor)
    const doctor = await prisma.doctor.findFirst()
    if (!doctor) return

    // Find or create patient
    let patient = await prisma.patient.findUnique({ where: { phone: from } })

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          phone: from,
          name: value?.contacts?.[0]?.profile?.name ?? null,
          assignedTo: doctor.id,
        },
      })

      // First message — send welcome menu
      const menuProtocols = await prisma.protocol.findMany({
        where: { doctorId: doctor.id, isActive: true, addToMenu: true },
      })

      if (menuProtocols.length > 0) {
        await sendWhatsAppMenu(
          from,
          `Hi! I'm the assistant for ${doctor.clinicName ?? doctor.name}. How can I help you?`,
          menuProtocols.map((p) => ({ id: p.id, title: p.title }))
        )
      } else {
        await sendWhatsAppMessage(
          from,
          `Hi! I'm the assistant for ${doctor.clinicName ?? doctor.name}. Your message has been received. The doctor will respond shortly.`
        )
      }
    }

    // Save incoming message
    await prisma.message.create({
      data: {
        patientId: patient.id,
        content: text,
        sender: 'patient',
      },
    })

    // Match against protocols
    const protocols = await prisma.protocol.findMany({
      where: { doctorId: doctor.id, isActive: true },
    })

    // Check if it's a menu selection (interactive reply ID = protocol ID)
    let matched = protocols.find((p) => p.id === text)

    // Otherwise keyword match
    if (!matched) {
      const lowerText = text.toLowerCase()
      matched = protocols.find((p) =>
        p.keywords.some((kw) => lowerText.includes(kw.toLowerCase()))
      )
    }

    if (matched) {
      await sendWhatsAppMessage(from, matched.replyText)

      await prisma.message.create({
        data: {
          patientId: patient.id,
          content: matched.replyText,
          sender: 'bot',
          protocolName: matched.title,
        },
      })

      await prisma.protocol.update({
        where: { id: matched.id },
        data: { usageCount: { increment: 1 } },
      })
    } else {
      // No match — notify patient, flag for doctor
      await sendWhatsAppMessage(
        from,
        'Your message has been noted. The doctor will respond shortly.'
      )

      // Mark patient as needs attention
      await prisma.patient.update({
        where: { id: patient.id },
        data: { isUrgent: true },
      })
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
  }
})

export default router
