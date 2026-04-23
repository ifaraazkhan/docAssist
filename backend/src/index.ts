import express, { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
dotenv.config()

import { helmetMiddleware, corsMiddleware } from './middleware/security'
import { apiLimiter, webhookLimiter } from './middleware/rateLimit'
import { captureRawBody } from './middleware/webhookVerify'
import { AppError } from './lib/errors'
import { pingDb } from './lib/db'

import authRoutes from './routes/auth'
import doctorRoutes from './routes/doctor'
import onboardingRoutes from './routes/onboarding'
import protocolRoutes from './routes/protocols'
import patientRoutes from './routes/patients'
import messageRoutes from './routes/messages'
import noteRoutes from './routes/notes'
import webhookRoutes from './routes/webhook'
import paymentRoutes from './routes/payments'
import specialtyRoutes from './routes/specialties'

const app = express()

// ── Trust proxy (Vercel/Railway reverse proxy) ──
app.set('trust proxy', 1)

// ── Security ──
app.use(helmetMiddleware)
app.use(corsMiddleware)

// ── Body parsing ──
// Webhook route needs raw body for signature verification
app.use('/api/webhook', express.json({ limit: '1mb', verify: captureRawBody }))
app.use('/api/payments/webhook', express.json({ limit: '1mb', verify: captureRawBody }))
app.use(express.json({ limit: '1mb' }))

// ── Rate limiting ──
app.use('/api/webhook', webhookLimiter)
app.use('/api', apiLimiter)

// ── Routes ──
app.use('/api/auth', authRoutes)
app.use('/api/doctor', doctorRoutes)
app.use('/api/onboarding', onboardingRoutes)
app.use('/api/protocols', protocolRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/webhook/whatsapp', webhookRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/specialties', specialtyRoutes)

// ── Health check ──
app.get('/health', async (_req, res) => {
  let dbOk = false
  try {
    dbOk = await pingDb()
  } catch { /* db down */ }
  res.json({ status: 'ok', db: dbOk })
})

// ── Global error handler ──
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    })
    return
  }

  console.error('[server] unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Start ──
const PORT = process.env.PORT ?? 4000
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

export default app
