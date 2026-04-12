import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { sendWhatsAppMessage } from '../lib/whatsapp'

const router = Router()

// GET /api/messages?patientId=
router.get('/', async (req: Request, res: Response) => {
  const { patientId } = req.query

  if (!patientId) {
    res.status(400).json({ error: 'patientId required' })
    return
  }

  const messages = await prisma.message.findMany({
    where: { patientId: String(patientId) },
    orderBy: { createdAt: 'asc' },
  })

  res.json(messages)
})

// POST /api/messages/send — doctor replies from dashboard
router.post('/send', async (req: Request, res: Response) => {
  const { patientId, content } = req.body

  if (!patientId || !content) {
    res.status(400).json({ error: 'patientId and content required' })
    return
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } })

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' })
    return
  }

  // Save to DB first
  const message = await prisma.message.create({
    data: {
      patientId,
      content,
      sender: 'doctor',
    },
  })

  // Send via WhatsApp
  try {
    await sendWhatsAppMessage(patient.phone, content)
  } catch (err) {
    console.error('WhatsApp send failed:', err)
    // Message is saved in DB even if WhatsApp fails — don't block response
  }

  res.status(201).json(message)
})

export default router
