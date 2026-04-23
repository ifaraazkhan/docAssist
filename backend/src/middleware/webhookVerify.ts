import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

const APP_SECRET = process.env.APP_SECRET || ''

/**
 * Verify Meta webhook X-Hub-Signature-256 header.
 * Must be applied BEFORE express.json() parses the body,
 * or use express.json({ verify: bufferRawBody }) to capture raw body.
 *
 * For now, skip verification if APP_SECRET is not configured (dev mode).
 */
export function webhookVerify(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip in dev when APP_SECRET is not set
  if (!APP_SECRET || APP_SECRET === 'your_meta_app_secret_here') {
    next()
    return
  }

  const signature = req.headers['x-hub-signature-256'] as string | undefined
  if (!signature) {
    res.status(401).json({ error: 'Missing signature' })
    return
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody
  if (!rawBody) {
    // rawBody not captured — skip verification with warning
    console.warn('[webhook] rawBody not available, skipping signature verification')
    next()
    return
  }

  const expected = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(rawBody)
    .digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    res.status(401).json({ error: 'Invalid signature' })
    return
  }

  next()
}

/**
 * Use as the `verify` option in express.json() to capture raw body
 * for webhook signature verification.
 *
 * Usage: app.use('/api/webhook', express.json({ verify: captureRawBody }))
 */
export function captureRawBody(
  req: Request,
  _res: Response,
  buf: Buffer
): void {
  ;(req as Request & { rawBody?: Buffer }).rawBody = buf
}
