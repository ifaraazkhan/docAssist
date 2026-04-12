import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth'
import protocolRoutes from './routes/protocols'
import patientRoutes from './routes/patients'
import messageRoutes from './routes/messages'
import noteRoutes from './routes/notes'
import webhookRoutes from './routes/webhook'

const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000']

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/protocols', protocolRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/webhook/whatsapp', webhookRoutes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Local dev only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT ?? 4000
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`)
  })
}

export default app
