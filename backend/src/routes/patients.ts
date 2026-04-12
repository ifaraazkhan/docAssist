import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/patients?doctorId=
router.get('/', async (req: Request, res: Response) => {
  const { doctorId } = req.query

  if (!doctorId) {
    res.status(400).json({ error: 'doctorId required' })
    return
  }

  const patients = await prisma.patient.findMany({
    where: { assignedTo: String(doctorId) },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result = patients.map((p) => ({
    id: p.id,
    phone: p.phone,
    name: p.name,
    isUrgent: p.isUrgent,
    lastMessage: p.messages[0]?.content ?? '',
    lastMessageTime: p.messages[0]?.createdAt ?? p.createdAt,
    unreadCount: 0, // extend later with a read/unread flag on messages
  }))

  res.json(result)
})

// GET /api/patients/:id
router.get('/:id', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
  })

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' })
    return
  }

  res.json(patient)
})

// PATCH /api/patients/:id — update name, isUrgent
router.patch('/:id', async (req: Request, res: Response) => {
  const { name, isUrgent } = req.body

  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(isUrgent !== undefined && { isUrgent }),
    },
  })

  res.json(patient)
})

export default router
