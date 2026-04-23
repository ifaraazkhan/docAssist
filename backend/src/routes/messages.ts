import { Router, Request, Response, NextFunction } from 'express'
import { query } from '../lib/db'
import { sendWhatsAppMessage } from '../lib/whatsapp'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { BadRequest, NotFound, Forbidden } from '../lib/errors'

const router = Router()

// ──────────────────────────────────────────────
// GET /api/messages?patientId=  (protected)
// ?cursor=<id>&limit=50
// ──────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { patientId, cursor, limit: rawLimit } = req.query

    if (!patientId) throw new BadRequest('patientId required')

    // Verify ownership via mapping
    const mappingCheck = await query(
      `SELECT m.id FROM patient_doctor_mappings m
       JOIN patients p ON p.id = m.patient_id
       WHERE p.id = $1 AND m.doctor_id = $2`,
      [patientId, doctorId]
    )
    if (mappingCheck.rows.length === 0) throw new Forbidden('Not your patient')

    // Get patient phone for message lookup
    const patientResult = await query('SELECT phone FROM patients WHERE id = $1', [patientId])
    if (patientResult.rows.length === 0) throw new NotFound('Patient not found')
    const patientPhone = patientResult.rows[0].phone

    const limit = Math.min(Math.max(parseInt(String(rawLimit || '50'), 10) || 50, 1), 100)
    const params: unknown[] = [patientPhone, doctorId]
    let paramIdx = 3

    let cursorClause = ''
    if (cursor) {
      // Paginate older messages (scroll-up)
      cursorClause = `AND msg.created_at < (SELECT created_at FROM messages WHERE id = $${paramIdx})`
      params.push(cursor)
      paramIdx++
    }

    params.push(limit + 1)

    // Without cursor → newest messages first (initial load)
    // With cursor → older messages (scroll-up)
    const sql = `
      SELECT msg.id, msg.wamid, msg.patient_phone, msg.doctor_id, msg.direction,
             msg.sender, msg.content, msg.msg_type, msg.protocol_id,
             msg.wa_timestamp, msg.created_at
      FROM messages msg
      WHERE msg.patient_phone = $1 AND msg.doctor_id = $2
        ${cursorClause}
      ORDER BY msg.created_at DESC
      LIMIT $${paramIdx}
    `

    const result = await query(sql, params)
    const hasMore = result.rows.length > limit
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows

    // Reverse so messages are in chronological order for display
    const messages = rows.reverse().map((r) => ({
      id: r.id,
      wamid: r.wamid,
      patientPhone: r.patient_phone,
      doctorId: r.doctor_id,
      direction: r.direction,
      sender: r.sender,
      content: r.content,
      msgType: r.msg_type,
      protocolId: r.protocol_id,
      waTimestamp: r.wa_timestamp,
      createdAt: r.created_at,
    }))

    res.json({
      success: true,
      messages,
      hasMore,
      nextCursor: hasMore ? rows[rows.length - 1].id : null,
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/messages/send  (protected — doctor replies)
// Body: { patientId, content }
// ──────────────────────────────────────────────
router.post('/send', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { patientId, content } = req.body

    if (!patientId || !content) throw new BadRequest('patientId and content required')

    // Verify ownership + get phone
    const result = await query(
      `SELECT p.phone, m.id AS mapping_id
       FROM patients p
       JOIN patient_doctor_mappings m ON m.patient_id = p.id
       WHERE p.id = $1 AND m.doctor_id = $2`,
      [patientId, doctorId]
    )
    if (result.rows.length === 0) throw new NotFound('Patient not found')

    const { phone, mapping_id } = result.rows[0]

    // Save message to DB
    const msgResult = await query(
      `INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type)
       VALUES ($1, $2, 'outbound', 'doctor', $3, 'text')
       RETURNING id, patient_phone, doctor_id, direction, sender, content, msg_type, created_at`,
      [phone, doctorId, content]
    )

    const message = msgResult.rows[0]

    // Reset unread count on mapping
    await query(
      'UPDATE patient_doctor_mappings SET unread_count = 0, last_read_at = now() WHERE id = $1',
      [mapping_id]
    )

    // Send via WhatsApp (don't block response on failure)
    try {
      await sendWhatsAppMessage(phone, content)
    } catch (err) {
      console.error('[messages] WhatsApp send failed:', err)
    }

    res.status(201).json({
      success: true,
      message: {
        id: message.id,
        patientPhone: message.patient_phone,
        doctorId: message.doctor_id,
        direction: message.direction,
        sender: message.sender,
        content: message.content,
        msgType: message.msg_type,
        createdAt: message.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/messages/read  (protected)
// Body: { patientId }
// ──────────────────────────────────────────────
router.post('/read', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { patientId } = req.body

    if (!patientId) throw new BadRequest('patientId required')

    const result = await query(
      `UPDATE patient_doctor_mappings
       SET unread_count = 0, last_read_at = now()
       WHERE patient_id = $1 AND doctor_id = $2
       RETURNING id`,
      [patientId, doctorId]
    )

    if (result.rows.length === 0) throw new NotFound('Mapping not found')

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
