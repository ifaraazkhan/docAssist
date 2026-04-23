import { Router, Request, Response, NextFunction } from 'express'
import { query } from '../lib/db'

const router = Router()

// ──────────────────────────────────────────────
// GET /api/specialties  (public — no auth needed)
// ──────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT name FROM specialties WHERE is_active = true ORDER BY sort_order ASC`
    )
    res.json({
      success: true,
      specialties: result.rows.map((r: { name: string }) => r.name),
    })
  } catch (err) {
    next(err)
  }
})

export default router
