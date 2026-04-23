import { Router, Request, Response, NextFunction } from 'express'
import { query } from '../lib/db'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'
import { BadRequest, NotFound, Forbidden } from '../lib/errors'

const router = Router()

const FREE_PROTOCOL_LIMIT = 3

// ──────────────────────────────────────────────
// GET /api/protocols  (protected — doctor from JWT)
// ──────────────────────────────────────────────
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id

    const result = await query(
      `SELECT id, doctor_id, library_source_id, title, keywords, reply_text,
              is_active, add_to_menu, usage_count, disclaimer, protocol_type, created_at, updated_at
       FROM protocols
       WHERE doctor_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [doctorId]
    )

    const protocols = result.rows.map((r) => ({
      id: r.id,
      doctorId: r.doctor_id,
      librarySourceId: r.library_source_id,
      title: r.title,
      keywords: r.keywords,
      replyText: r.reply_text,
      isActive: r.is_active,
      addToMenu: r.add_to_menu,
      usageCount: r.usage_count,
      disclaimer: r.disclaimer,
      protocolType: r.protocol_type,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))

    res.json({ success: true, protocols })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// GET /api/protocols/library  (protected — browse templates)
// ?specialty=General Physician
// ──────────────────────────────────────────────
router.get('/library', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { specialty } = req.query

    let sql = 'SELECT id, title, specialty, keywords, reply_text, reply_hindi, disclaimer, created_at FROM library_protocols'
    const params: unknown[] = []

    if (specialty) {
      sql += ' WHERE specialty = $1'
      params.push(specialty)
    }

    sql += ' ORDER BY specialty, title'

    const result = await query(sql, params)

    const protocols = result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      specialty: r.specialty,
      keywords: r.keywords,
      replyText: r.reply_text,
      replyHindi: r.reply_hindi,
      disclaimer: r.disclaimer,
      createdAt: r.created_at,
    }))

    res.json({ success: true, protocols })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/protocols/library/:id/add  (protected — clone from library)
// ──────────────────────────────────────────────
router.post('/library/:id/add', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const libraryId = req.params.id

    // Plan limit check
    await checkProtocolLimit(doctorId)

    // Get library protocol
    const libResult = await query(
      'SELECT id, title, keywords, reply_text, disclaimer FROM library_protocols WHERE id = $1',
      [libraryId]
    )
    if (libResult.rows.length === 0) throw new NotFound('Library protocol not found')

    const lib = libResult.rows[0]

    // Check if already cloned
    const dupeCheck = await query(
      `SELECT id FROM protocols WHERE doctor_id = $1 AND library_source_id = $2 AND deleted_at IS NULL`,
      [doctorId, libraryId]
    )
    if (dupeCheck.rows.length > 0) throw new BadRequest('Protocol already added')

    const result = await query(
      `INSERT INTO protocols (doctor_id, library_source_id, title, keywords, reply_text, disclaimer, protocol_type, add_to_menu)
       VALUES ($1, $2, $3, $4, $5, $6, 'library', true)
       RETURNING *`,
      [doctorId, libraryId, lib.title, lib.keywords, lib.reply_text, lib.disclaimer]
    )

    const r = result.rows[0]
    res.status(201).json({
      success: true,
      protocol: {
        id: r.id,
        doctorId: r.doctor_id,
        librarySourceId: r.library_source_id,
        title: r.title,
        keywords: r.keywords,
        replyText: r.reply_text,
        isActive: r.is_active,
        addToMenu: r.add_to_menu,
        usageCount: r.usage_count,
        disclaimer: r.disclaimer,
        protocolType: r.protocol_type,
        createdAt: r.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// POST /api/protocols  (protected — create custom)
// Body: { title, keywords, replyText, addToMenu? }
// ──────────────────────────────────────────────
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const { title, keywords, replyText, addToMenu } = req.body

    if (!title || !keywords || !replyText) throw new BadRequest('title, keywords, replyText required')

    // Plan limit check
    await checkProtocolLimit(doctorId)

    const kw = Array.isArray(keywords)
      ? keywords
      : keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean)

    const result = await query(
      `INSERT INTO protocols (doctor_id, title, keywords, reply_text, add_to_menu, protocol_type)
       VALUES ($1, $2, $3, $4, $5, 'custom')
       RETURNING *`,
      [doctorId, title, kw, replyText, addToMenu ?? false]
    )

    const r = result.rows[0]
    res.status(201).json({
      success: true,
      protocol: {
        id: r.id,
        doctorId: r.doctor_id,
        title: r.title,
        keywords: r.keywords,
        replyText: r.reply_text,
        isActive: r.is_active,
        addToMenu: r.add_to_menu,
        usageCount: r.usage_count,
        protocolType: r.protocol_type,
        createdAt: r.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// PATCH /api/protocols/:id  (protected — update)
// ──────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const protocolId = req.params.id
    const { title, keywords, replyText, isActive, addToMenu } = req.body

    // Verify ownership
    const existing = await query(
      'SELECT id, protocol_type FROM protocols WHERE id = $1 AND doctor_id = $2 AND deleted_at IS NULL',
      [protocolId, doctorId]
    )
    if (existing.rows.length === 0) throw new NotFound('Protocol not found')

    const protocolType = existing.rows[0].protocol_type

    // System protocol restrictions: can toggle isActive and edit replyText, but NOT change type or title
    if (protocolType === 'system') {
      if (title !== undefined || keywords !== undefined) {
        throw new Forbidden('Cannot change title or keywords of system protocol')
      }
    }

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const addField = (col: string, val: unknown) => {
      if (val !== undefined) {
        fields.push(`${col} = $${idx++}`)
        values.push(val)
      }
    }

    if (protocolType !== 'system') {
      addField('title', title)
      if (keywords !== undefined) {
        const kw = Array.isArray(keywords)
          ? keywords
          : keywords.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean)
        fields.push(`keywords = $${idx++}`)
        values.push(kw)
      }
    }

    addField('reply_text', replyText)
    addField('is_active', isActive)
    addField('add_to_menu', addToMenu)

    if (fields.length === 0) throw new BadRequest('No fields to update')

    values.push(protocolId)
    const sql = `UPDATE protocols SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`
    const result = await query(sql, values)

    const r = result.rows[0]
    res.json({
      success: true,
      protocol: {
        id: r.id,
        doctorId: r.doctor_id,
        title: r.title,
        keywords: r.keywords,
        replyText: r.reply_text,
        isActive: r.is_active,
        addToMenu: r.add_to_menu,
        usageCount: r.usage_count,
        protocolType: r.protocol_type,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// DELETE /api/protocols/:id  (protected — soft delete)
// ──────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = (req as AuthenticatedRequest).doctor.id
    const protocolId = req.params.id

    // Verify ownership + check type
    const existing = await query(
      'SELECT id, protocol_type FROM protocols WHERE id = $1 AND doctor_id = $2 AND deleted_at IS NULL',
      [protocolId, doctorId]
    )
    if (existing.rows.length === 0) throw new NotFound('Protocol not found')

    if (existing.rows[0].protocol_type === 'system') {
      throw new Forbidden('Cannot delete system protocol')
    }

    // Soft delete
    await query('UPDATE protocols SET deleted_at = now() WHERE id = $1', [protocolId])

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// ──────────────────────────────────────────────
// Helper: check free plan protocol limit
// ──────────────────────────────────────────────
async function checkProtocolLimit(doctorId: string): Promise<void> {
  const planResult = await query('SELECT plan FROM doctors WHERE id = $1', [doctorId])
  if (planResult.rows.length === 0) throw new NotFound('Doctor not found')

  if (planResult.rows[0].plan === 'free') {
    const countResult = await query(
      `SELECT COUNT(*) as cnt FROM protocols
       WHERE doctor_id = $1 AND protocol_type != 'system' AND deleted_at IS NULL`,
      [doctorId]
    )
    if (parseInt(countResult.rows[0].cnt, 10) >= FREE_PROTOCOL_LIMIT) {
      throw new Forbidden(
        `Free plan allows max ${FREE_PROTOCOL_LIMIT} protocols. Upgrade to add more.`,
        'PLAN_LIMIT'
      )
    }
  }
}

export default router
