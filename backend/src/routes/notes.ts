import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/notes?patientId=
router.get('/', async (req: Request, res: Response) => {
  const { patientId } = req.query

  if (!patientId) {
    res.status(400).json({ error: 'patientId required' })
    return
  }

  const notes = await prisma.privateNote.findMany({
    where: { patientId: String(patientId) },
    orderBy: { createdAt: 'asc' },
  })

  res.json(notes)
})

// POST /api/notes
router.post('/', async (req: Request, res: Response) => {
  const { patientId, content } = req.body

  if (!patientId || !content) {
    res.status(400).json({ error: 'patientId and content required' })
    return
  }

  const note = await prisma.privateNote.create({
    data: { patientId, content },
  })

  res.status(201).json(note)
})

// DELETE /api/notes/:id
router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.privateNote.delete({ where: { id: String(req.params.id) } })
  res.json({ success: true })
})

export default router
