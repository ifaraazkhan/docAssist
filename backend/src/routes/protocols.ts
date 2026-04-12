import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/protocols?doctorId=
router.get('/', async (req: Request, res: Response) => {
  const { doctorId } = req.query

  if (!doctorId) {
    res.status(400).json({ error: 'doctorId required' })
    return
  }

  const protocols = await prisma.protocol.findMany({
    where: { doctorId: String(doctorId) },
    orderBy: { createdAt: 'desc' },
  })

  res.json(protocols)
})

// POST /api/protocols
router.post('/', async (req: Request, res: Response) => {
  const { doctorId, title, keywords, replyText, addToMenu } = req.body

  if (!doctorId || !title || !keywords || !replyText) {
    res.status(400).json({ error: 'doctorId, title, keywords, replyText required' })
    return
  }

  const protocol = await prisma.protocol.create({
    data: {
      doctorId,
      title,
      keywords: Array.isArray(keywords)
        ? keywords
        : keywords.split(',').map((k: string) => k.trim().toLowerCase()),
      replyText,
      addToMenu: addToMenu ?? false,
    },
  })

  res.status(201).json(protocol)
})

// PATCH /api/protocols/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { title, keywords, replyText, isActive, addToMenu } = req.body

  const protocol = await prisma.protocol.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(keywords !== undefined && {
        keywords: Array.isArray(keywords)
          ? keywords
          : keywords.split(',').map((k: string) => k.trim().toLowerCase()),
      }),
      ...(replyText !== undefined && { replyText }),
      ...(isActive !== undefined && { isActive }),
      ...(addToMenu !== undefined && { addToMenu }),
    },
  })

  res.json(protocol)
})

// DELETE /api/protocols/:id
router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.protocol.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router
