import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// Hardcoded login — swap with real auth later
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const doctor = await prisma.doctor.findUnique({ where: { email } })

  if (!doctor) {
    res.status(404).json({ error: 'Doctor not found' })
    return
  }

  res.json({ success: true, doctor })
})

export default router
