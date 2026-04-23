import jwt from 'jsonwebtoken'
import { Unauthorized } from './errors'

const SECRET = process.env.JWT_SECRET || 'dev-fallback-change-me'

export interface JwtPayload {
  doctorId: string
  jwtVersion: number
}

export function signToken(doctorId: string, jwtVersion: number): string {
  return jwt.sign({ doctorId, jwtVersion } satisfies JwtPayload, SECRET, {
    expiresIn: '7d',
  })
}

export function verifyToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, SECRET) as JwtPayload
    if (!payload.doctorId || payload.jwtVersion === undefined) {
      throw new Unauthorized('Invalid token payload', 'INVALID_TOKEN')
    }
    return payload
  } catch (err) {
    if (err instanceof Unauthorized) throw err
    throw new Unauthorized('Invalid or expired token', 'INVALID_TOKEN')
  }
}
