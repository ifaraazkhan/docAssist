import { Router, Request, Response, NextFunction } from 'express'
import { query, withTransaction } from '../lib/db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import {
  createOrder,
  verifySignature,
  verifyWebhookSignature,
  razorpayKeyId,
  PLAN_PRICING,
} from '../lib/razorpay'
import { BadRequest, NotFound, Forbidden } from '../lib/errors'

const router = Router()

const VALID_PLANS = ['pro', 'clinic_plus']

// ──────────────────────────────────────────────
// POST /api/payments/create-order  (protected)
// Body: { plan: 'pro' | 'clinic_plus' }
// ──────────────────────────────────────────────
router.post('/create-order', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { plan } = req.body

    if (!plan || !VALID_PLANS.includes(plan)) {
      throw new BadRequest('plan must be "pro" or "clinic_plus"')
    }

    // Check current plan — can't buy same or lower
    const docResult = await query('SELECT plan FROM doctors WHERE id = $1', [doctorId])
    if (docResult.rows.length === 0) throw new NotFound('Doctor not found')

    const currentPlan = docResult.rows[0].plan
    if (currentPlan === plan) throw new BadRequest('You are already on this plan')
    if (currentPlan === 'clinic_plus') throw new BadRequest('You are already on the highest plan')
    if (currentPlan === 'pro' && plan === 'pro') throw new BadRequest('You are already on Pro')

    const amount = PLAN_PRICING[plan]
    if (!amount) throw new BadRequest('Invalid plan')

    // Create Razorpay order via SDK
    const order = await createOrder(amount, doctorId, plan)

    // Save to DB
    await query(
      `INSERT INTO payments (doctor_id, razorpay_order_id, amount_paise, plan, status)
       VALUES ($1, $2, $3, $4, 'created')`,
      [doctorId, order.id, amount, plan]
    )

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId,
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/payments/verify  (protected — UI calls after Razorpay checkout)
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// ──────────────────────────────────────────────
router.post('/verify', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new BadRequest('razorpay_order_id, razorpay_payment_id, and razorpay_signature are required')
    }

    // Verify the payment row belongs to this doctor
    const paymentResult = await query(
      'SELECT id, plan, status FROM payments WHERE razorpay_order_id = $1 AND doctor_id = $2',
      [razorpay_order_id, doctorId]
    )
    if (paymentResult.rows.length === 0) throw new NotFound('Payment not found')

    const payment = paymentResult.rows[0]
    if (payment.status === 'paid') throw new BadRequest('Payment already verified')

    // Verify signature using Razorpay SDK pattern
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!isValid) {
      // Mark as failed
      await query(
        "UPDATE payments SET status = 'failed' WHERE id = $1",
        [payment.id]
      )
      throw new Forbidden('Invalid payment signature')
    }

    // All good — update payment + upgrade doctor plan in a transaction
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE payments
         SET status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2
         WHERE id = $3`,
        [razorpay_payment_id, razorpay_signature, payment.id]
      )

      await client.query(
        'UPDATE doctors SET plan = $1, updated_at = now() WHERE id = $2',
        [payment.plan, doctorId]
      )
    })

    res.json({ success: true, plan: payment.plan })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/payments/webhook  (Razorpay server-to-server callback)
// No auth — verified via X-Razorpay-Signature header
// ──────────────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined
    if (!signature) {
      res.status(401).json({ error: 'Missing signature' })
      return
    }

    // Get raw body for signature verification
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody
    const bodyForVerification = rawBody || JSON.stringify(req.body)

    const isValid = verifyWebhookSignature(bodyForVerification, signature)
    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    const event = req.body
    const eventType: string = event.event

    // Handle payment events
    if (eventType === 'payment.captured') {
      const payment = event.payload?.payment?.entity
      if (!payment) {
        res.json({ status: 'ok' })
        return
      }

      const orderId = payment.order_id
      const paymentId = payment.id

      // Update payment record if not already paid (idempotent)
      const paymentRow = await query(
        "SELECT id, plan, doctor_id, status FROM payments WHERE razorpay_order_id = $1",
        [orderId]
      )

      if (paymentRow.rows.length > 0 && paymentRow.rows[0].status !== 'paid') {
        const row = paymentRow.rows[0]

        await withTransaction(async (client) => {
          await client.query(
            `UPDATE payments SET status = 'paid', razorpay_payment_id = $1 WHERE id = $2`,
            [paymentId, row.id]
          )
          await client.query(
            'UPDATE doctors SET plan = $1, updated_at = now() WHERE id = $2',
            [row.plan, row.doctor_id]
          )
        })

        console.log(`[razorpay-webhook] Payment captured: order=${orderId}, doctor=${row.doctor_id}, plan=${row.plan}`)
      }
    } else if (eventType === 'payment.failed') {
      const payment = event.payload?.payment?.entity
      if (payment?.order_id) {
        await query(
          "UPDATE payments SET status = 'failed' WHERE razorpay_order_id = $1 AND status = 'created'",
          [payment.order_id]
        )
        console.log(`[razorpay-webhook] Payment failed: order=${payment.order_id}`)
      }
    }

    // Always return 200 to Razorpay
    res.json({ status: 'ok' })
  } catch (err) {
    console.error('[razorpay-webhook] Error:', err)
    // Always return 200 to prevent retries
    res.json({ status: 'ok' })
  }
})

// ──────────────────────────────────────────────
// GET /api/payments/history  (protected)
// ──────────────────────────────────────────────
router.get('/history', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id

    const result = await query(
      `SELECT id, razorpay_order_id, razorpay_payment_id, amount_paise,
              plan, status, created_at
       FROM payments
       WHERE doctor_id = $1
       ORDER BY created_at DESC`,
      [doctorId]
    )

    const payments = result.rows.map((r) => ({
      id: r.id,
      orderId: r.razorpay_order_id,
      paymentId: r.razorpay_payment_id,
      amount: r.amount_paise / 100, // Convert paise to rupees for display
      amountPaise: r.amount_paise,
      plan: r.plan,
      status: r.status,
      createdAt: r.created_at,
    }))

    res.json({ success: true, payments })
  } catch (err) {
    next(err)
  }
})

export default router
