import helmet from 'helmet'
import cors from 'cors'
import { RequestHandler } from 'express'

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

export const helmetMiddleware: RequestHandler = helmet()

export const corsMiddleware: RequestHandler = cors({
  origin: allowedOrigins,
  credentials: true,
})
