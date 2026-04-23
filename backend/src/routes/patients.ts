import { Router, Request, Response, NextFunction } from 'express'
import { query } from '../lib/db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { BadRequest, NotFound, Forbidden } from '../lib/errors'

const router = Router()

// ──────────────────────────────────────────────
// GET /api/patients  (protected — doctor from JWT)
// ?filter=urgent|unread  &cursor=<id>&limit=20
// ──────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { filter, cursor, limit: rawLimit } = req.query

    const limit = Math.min(Math.max(parseInt(String(rawLimit || '20'), 10) || 20, 1), 50)

    let filterClause = ''
    if (filter === 'urgent') filterClause = 'AND m.is_urgent = true'
    else if (filter === 'unread') filterClause = 'AND m.unread_count > 0'

    let cursorClause = ''
    const params: unknown[] = [doctorId]
    let paramIdx = 2

    if (cursor) {
      cursorClause = `AND m.created_at < (SELECT created_at FROM patient_doctor_mappings WHERE id = $${paramIdx})`
      params.push(cursor)
      paramIdx++
    }

    params.push(limit + 1) // fetch one extra for hasMore

    const sql = `
      SELECT
        p.id, p.phone, p.name, p.created_at AS patient_created_at,
        m.id AS mapping_id, m.is_urgent, m.unread_count, m.status, m.source,
        m.patient_type, m.created_at AS mapping_created_at,
        (SELECT content FROM messages
         WHERE patient_phone = p.phone AND doctor_id = $1
         ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages
         WHERE patient_phone = p.phone AND doctor_id = $1
         ORDER BY created_at DESC LIMIT 1) AS last_message_time
      FROM patient_doctor_mappings m
      JOIN patients p ON p.id = m.patient_id
      WHERE m.doctor_id = $1 AND m.status = 'active'
        ${filterClause}
        ${cursorClause}
      ORDER BY m.created_at DESC
      LIMIT $${paramIdx}
    `

    const result = await query(sql, params)
    const hasMore = result.rows.length > limit
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows

    const patients = rows.map((r) => ({
      id: r.id,
      phone: r.phone,
      name: r.name,
      isUrgent: r.is_urgent,
      unreadCount: r.unread_count,
      status: r.status,
      source: r.source,
      patientType: r.patient_type,
      lastMessage: r.last_message || '',
      lastMessageTime: r.last_message_time || r.mapping_created_at,
      mappingId: r.mapping_id,
    }))

    res.json({
      success: true,
      patients,
      hasMore,
      nextCursor: hasMore ? rows[rows.length - 1].mapping_id : null,
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// GET /api/patients/:id  (protected — verify mapping)
// ──────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const patientId = req.params.id

    const result = await query(
      `SELECT p.id, p.phone, p.name, p.created_at,
              m.id AS mapping_id, m.is_urgent, m.unread_count, m.status, m.source,
              m.patient_type, m.created_at AS mapping_created_at
       FROM patients p
       JOIN patient_doctor_mappings m ON m.patient_id = p.id
       WHERE p.id = $1 AND m.doctor_id = $2 AND m.status = 'active'`,
      [patientId, doctorId]
    )

    if (result.rows.length === 0) throw new NotFound('Patient not found')

    const r = result.rows[0]
    res.json({
      success: true,
      patient: {
        id: r.id,
        phone: r.phone,
        name: r.name,
        isUrgent: r.is_urgent,
        unreadCount: r.unread_count,
        status: r.status,
        source: r.source,
        patientType: r.patient_type,
        mappingId: r.mapping_id,
        createdAt: r.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// PATCH /api/patients/:id  (protected — verify mapping)
// Body: { name?, isUrgent?, status? }
// ──────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const patientId = req.params.id
    const { name, isUrgent, status } = req.body

    // Verify mapping exists
    const mappingResult = await query(
      'SELECT id FROM patient_doctor_mappings WHERE patient_id = $1 AND doctor_id = $2',
      [patientId, doctorId]
    )
    if (mappingResult.rows.length === 0) throw new Forbidden('Not your patient')

    const mappingId = mappingResult.rows[0].id

    // Update patient name if provided
    if (name !== undefined) {
      await query('UPDATE patients SET name = $1 WHERE id = $2', [name, patientId])
    }

    // Update mapping fields (isUrgent, status)
    const mFields: string[] = []
    const mValues: unknown[] = []
    let idx = 1

    if (isUrgent !== undefined) {
      mFields.push(`is_urgent = $${idx++}`)
      mValues.push(isUrgent)
    }
    if (status !== undefined) {
      mFields.push(`status = $${idx++}`)
      mValues.push(status)
    }

    if (mFields.length > 0) {
      mValues.push(mappingId)
      await query(
        `UPDATE patient_doctor_mappings SET ${mFields.join(', ')} WHERE id = $${idx}`,
        mValues
      )
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
