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
  try {
    const body = req.body
    console.log('[webhook] body:', JSON.stringify(body))

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) {
      console.log('[webhook] no messages in payload, skipping')
      return
    }

    const msg = messages[0]
    const from = msg.from
    const msgType = msg.type
    console.log('[webhook] from:', from, 'type:', msgType)

    let text = ''

    if (msgType === 'text') {
      text = msg.text?.body ?? ''
    } else if (msgType === 'interactive') {
      text = msg.interactive?.list_reply?.id ?? ''
    } else {
      console.log('[webhook] unsupported message type:', msgType)
      return
    }

    console.log('[webhook] text:', text)

    const doctor = await prisma.doctor.findFirst()
    if (!doctor) {
      console.log('[webhook] no doctor found in DB')
      return
    }
    console.log('[webhook] doctor:', doctor.id)

    let patient = await prisma.patient.findUnique({ where: { phone: from } })

    if (!patient) {
      console.log('[webhook] new patient, creating...')
      patient = await prisma.patient.create({
        data: {
          phone: from,
          name: value?.contacts?.[0]?.profile?.name ?? null,
          assignedTo: doctor.id,
        },
      })

      const menuProtocols = await prisma.protocol.findMany({
        where: { doctorId: doctor.id, isActive: true, addToMenu: true },
      })

      console.log('[webhook] menu protocols:', menuProtocols.length)

      if (menuProtocols.length > 0) {
        await sendWhatsAppMenu(
          from,
          `Hi! I'm the assistant for ${doctor.clinicName ?? doctor.name}. How can I help you?`,
          menuProtocols.map((p) => ({ id: p.id, title: p.title }))
        )
        console.log('[webhook] menu sent')
      } else {
        await sendWhatsAppMessage(
          from,
          `Hi! I'm the assistant for ${doctor.clinicName ?? doctor.name}. Your message has been received. The doctor will respond shortly.`
        )
        console.log('[webhook] welcome message sent')
      }
    } else {
      console.log('[webhook] existing patient:', patient.id)
    }

    await prisma.message.create({
      data: { patientId: patient.id, content: text, sender: 'patient' },
    })

    const protocols = await prisma.protocol.findMany({
      where: { doctorId: doctor.id, isActive: true },
    })

    let matched = protocols.find((p) => p.id === text)

    if (!matched) {
      const lowerText = text.toLowerCase()
      matched = protocols.find((p) =>
        p.keywords.some((kw) => lowerText.includes(kw.toLowerCase()))
      )
    }

    console.log('[webhook] matched protocol:', matched?.title ?? 'none')

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
      await sendWhatsAppMessage(from, 'Your message has been noted. The doctor will respond shortly.')
      await prisma.patient.update({
        where: { id: patient.id },
        data: { isUrgent: true },
      })
    }

    console.log('[webhook] processing complete')
    res.status(200).send('OK')
  } catch (err) {
    console.error('[webhook] error:', err)
    res.status(200).send('OK') // always return 200 to Meta
  }
})

export default router
