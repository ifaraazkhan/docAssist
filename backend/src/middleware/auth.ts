import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'
import { query } from '../lib/db'
import { Unauthorized } from '../lib/errors'

export interface AuthenticatedRequest extends Request {
  doctor: {
    id: string
    phone: string
    email: string | null
    name: string | null
    jwtVersion: number
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    next(new Unauthorized('Missing authorization header'))
    return
  }

  const token = header.slice(7)
  try {
    const payload = verifyToken(token)

    const result = await query(
      'SELECT id, phone, email, name, jwt_version FROM doctors WHERE id = $1',
      [payload.doctorId]
    )

    if (result.rows.length === 0) {
      next(new Unauthorized('Doctor not found', 'INVALID_TOKEN'))
      return
    }

    const doctor = result.rows[0]

    // Check jwt_version — if doctor bumped it (logout-all), reject old tokens
    if (doctor.jwt_version !== payload.jwtVersion) {
      next(new Unauthorized('Token revoked', 'TOKEN_REVOKED'))
      return
    }

    ;(req as AuthenticatedRequest).doctor = {
      id: doctor.id,
      phone: doctor.phone,
      email: doctor.email,
      name: doctor.name,
      jwtVersion: doctor.jwt_version,
    }

    next()
  } catch (err) {
    next(err)
  }
}
