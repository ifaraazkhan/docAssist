import Razorpay from 'razorpay'
import crypto from 'crypto'

const KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

const instance = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
})

export { KEY_ID as razorpayKeyId }

// Plan pricing in paise (INR × 100)
export const PLAN_PRICING: Record<string, number> = {
  pro: 99900,         // ₹999
  clinic_plus: 249900, // ₹2,499
}

export async function createOrder(
  amountPaise: number,
  doctorId: string,
  plan: string
): Promise<{ id: string; amount: number; currency: string }> {
  const order = await instance.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `doc_${doctorId}_${Date.now()}`,
    notes: { doctorId, plan },
  })

  return { id: order.id, amount: order.amount as number, currency: order.currency }
}

export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = orderId + '|' + paymentId
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

/**
 * Verify Razorpay webhook signature (X-Razorpay-Signature header).
 * Uses webhook secret (same as KEY_SECRET for basic setup, 
 * or a separate webhook secret if configured in Razorpay dashboard).
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string,
  secret?: string
): boolean {
  const webhookSecret = secret || KEY_SECRET
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}
