import { Router, Request, Response, NextFunction } from 'express'
import { query } from '../lib/db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { BadRequest, NotFound, Forbidden } from '../lib/errors'

const router = Router()

const FREE_SESSION_LIMIT = 2

// ──────────────────────────────────────────────
// GET /api/appointments/sessions  (list OPD sessions)
// ──────────────────────────────────────────────
router.get('/sessions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id

    const result = await query(
      `SELECT id, name, start_time, end_time, days, avg_minutes, is_active, created_at, updated_at
       FROM opd_sessions
       WHERE doctor_id = $1
       ORDER BY start_time ASC`,
      [doctorId]
    )

    const sessions = result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      startTime: r.start_time?.substring(0, 5),
      endTime: r.end_time?.substring(0, 5),
      days: r.days,
      avgMinutes: r.avg_minutes,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))

    res.json({ success: true, sessions })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/appointments/sessions  (create OPD session)
// ──────────────────────────────────────────────
router.post('/sessions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { name, startTime, endTime, days, avgMinutes } = req.body

    if (!name || !startTime || !endTime) throw new BadRequest('name, startTime, endTime required')

    // Plan-based session limit
    const planResult = await query('SELECT plan FROM doctors WHERE id = $1', [doctorId])
    if (planResult.rows[0].plan === 'free') {
      const countResult = await query(
        'SELECT COUNT(*) as cnt FROM opd_sessions WHERE doctor_id = $1',
        [doctorId]
      )
      if (parseInt(countResult.rows[0].cnt, 10) >= FREE_SESSION_LIMIT) {
        throw new Forbidden(
          `Free plan allows max ${FREE_SESSION_LIMIT} OPD sessions. Upgrade to add more.`,
          'PLAN_LIMIT'
        )
      }
    }

    const result = await query(
      `INSERT INTO opd_sessions (doctor_id, name, start_time, end_time, days, avg_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [doctorId, name.trim(), startTime, endTime, days ?? '1111110', avgMinutes ?? 5]
    )

    const r = result.rows[0]
    res.status(201).json({
      success: true,
      session: {
        id: r.id,
        name: r.name,
        startTime: r.start_time?.substring(0, 5),
        endTime: r.end_time?.substring(0, 5),
        days: r.days,
        avgMinutes: r.avg_minutes,
        isActive: r.is_active,
        createdAt: r.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// PATCH /api/appointments/sessions/:id  (update OPD session)
// ──────────────────────────────────────────────
router.patch('/sessions/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const sessionId = req.params.id
    const { name, startTime, endTime, days, avgMinutes, isActive } = req.body

    // Verify ownership
    const existing = await query(
      'SELECT id FROM opd_sessions WHERE id = $1 AND doctor_id = $2',
      [sessionId, doctorId]
    )
    if (existing.rows.length === 0) throw new NotFound('OPD session not found')

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const addField = (col: string, val: unknown) => {
      if (val !== undefined) {
        fields.push(`${col} = $${idx++}`)
        values.push(val)
      }
    }

    addField('name', name?.trim())
    addField('start_time', startTime)
    addField('end_time', endTime)
    addField('days', days)
    addField('avg_minutes', avgMinutes)
    addField('is_active', isActive)

    if (fields.length === 0) throw new BadRequest('No fields to update')

    values.push(sessionId)
    const sql = `UPDATE opd_sessions SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`
    const result = await query(sql, values)

    const r = result.rows[0]
    res.json({
      success: true,
      session: {
        id: r.id,
        name: r.name,
        startTime: r.start_time?.substring(0, 5),
        endTime: r.end_time?.substring(0, 5),
        days: r.days,
        avgMinutes: r.avg_minutes,
        isActive: r.is_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// DELETE /api/appointments/sessions/:id  (delete OPD session)
// ──────────────────────────────────────────────
router.delete('/sessions/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const sessionId = req.params.id

    const existing = await query(
      'SELECT id FROM opd_sessions WHERE id = $1 AND doctor_id = $2',
      [sessionId, doctorId]
    )
    if (existing.rows.length === 0) throw new NotFound('OPD session not found')

    await query('DELETE FROM opd_sessions WHERE id = $1', [sessionId])

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// GET /api/appointments?date=YYYY-MM-DD  (today's queue)
// ──────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0]

    const result = await query(
      `SELECT a.id, a.session_id, a.patient_phone, a.patient_name, a.token_number,
              a.appointment_date, a.status, a.booked_via, a.created_at,
              s.name AS session_name, s.start_time, s.end_time, s.avg_minutes
       FROM appointments a
       JOIN opd_sessions s ON s.id = a.session_id
       WHERE a.doctor_id = $1 AND a.appointment_date = $2
       ORDER BY s.start_time ASC, a.token_number ASC`,
      [doctorId, date]
    )

    const appointments = result.rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      sessionName: r.session_name,
      sessionStart: r.start_time?.substring(0, 5),
      sessionEnd: r.end_time?.substring(0, 5),
      patientPhone: r.patient_phone,
      patientName: r.patient_name,
      tokenNumber: r.token_number,
      appointmentDate: r.appointment_date,
      status: r.status,
      bookedVia: r.booked_via,
      avgMinutes: r.avg_minutes,
      createdAt: r.created_at,
    }))

    res.json({ success: true, appointments, date })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// PATCH /api/appointments/:id  (update status)
// ──────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const appointmentId = req.params.id
    const { status } = req.body

    if (!status || !['completed', 'no_show', 'cancelled'].includes(status)) {
      throw new BadRequest('status must be completed, no_show, or cancelled')
    }

    const existing = await query(
      'SELECT id FROM appointments WHERE id = $1 AND doctor_id = $2',
      [appointmentId, doctorId]
    )
    if (existing.rows.length === 0) throw new NotFound('Appointment not found')

    await query('UPDATE appointments SET status = $1 WHERE id = $2', [status, appointmentId])

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
