import { Router, Request, Response, NextFunction } from 'express'
import { query } from '../lib/db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { BadRequest, NotFound, Forbidden } from '../lib/errors'

const router = Router()

// ──────────────────────────────────────────────
// GET /api/notes?patientId=  (protected)
// ?cursor=<id>&limit=20
// ──────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { patientId, cursor, limit: rawLimit } = req.query

    if (!patientId) throw new BadRequest('patientId required')

    // Verify ownership
    const mappingCheck = await query(
      'SELECT id FROM patient_doctor_mappings WHERE patient_id = $1 AND doctor_id = $2',
      [patientId, doctorId]
    )
    if (mappingCheck.rows.length === 0) throw new Forbidden('Not your patient')

    const limit = Math.min(Math.max(parseInt(String(rawLimit || '20'), 10) || 20, 1), 50)
    const params: unknown[] = [patientId, doctorId]
    let paramIdx = 3

    let cursorClause = ''
    if (cursor) {
      cursorClause = `AND n.created_at > (SELECT created_at FROM private_notes WHERE id = $${paramIdx})`
      params.push(cursor)
      paramIdx++
    }

    params.push(limit + 1)

    const sql = `
      SELECT n.id, n.patient_id, n.doctor_id, n.content, n.created_at
      FROM private_notes n
      WHERE n.patient_id = $1 AND n.doctor_id = $2 AND n.deleted_at IS NULL
        ${cursorClause}
      ORDER BY n.created_at ASC
      LIMIT $${paramIdx}
    `

    const result = await query(sql, params)
    const hasMore = result.rows.length > limit
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows

    const notes = rows.map((r) => ({
      id: r.id,
      patientId: r.patient_id,
      doctorId: r.doctor_id,
      content: r.content,
      createdAt: r.created_at,
    }))

    res.json({
      success: true,
      notes,
      hasMore,
      nextCursor: hasMore ? rows[rows.length - 1].id : null,
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/notes  (protected)
// Body: { patientId, content }
// ──────────────────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { patientId, content } = req.body

    if (!patientId || !content) throw new BadRequest('patientId and content required')

    // Verify ownership
    const mappingCheck = await query(
      'SELECT id FROM patient_doctor_mappings WHERE patient_id = $1 AND doctor_id = $2',
      [patientId, doctorId]
    )
    if (mappingCheck.rows.length === 0) throw new Forbidden('Not your patient')

    const result = await query(
      `INSERT INTO private_notes (patient_id, doctor_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, patient_id, doctor_id, content, created_at`,
      [patientId, doctorId, content]
    )

    const note = result.rows[0]
    res.status(201).json({
      success: true,
      note: {
        id: note.id,
        patientId: note.patient_id,
        doctorId: note.doctor_id,
        content: note.content,
        createdAt: note.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// DELETE /api/notes/:id  (protected — soft delete)
// ──────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const noteId = req.params.id

    // Verify ownership
    const existing = await query(
      'SELECT id FROM private_notes WHERE id = $1 AND doctor_id = $2 AND deleted_at IS NULL',
      [noteId, doctorId]
    )
    if (existing.rows.length === 0) throw new NotFound('Note not found')

    // Soft delete
    await query('UPDATE private_notes SET deleted_at = now() WHERE id = $1', [noteId])

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
