import type { Doctor } from './api'

const KEY = 'docassist_doctor'

export function saveDoctor(doctor: Doctor) {
  localStorage.setItem(KEY, JSON.stringify(doctor))
}

export function getDoctor(): Doctor | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Doctor
  } catch {
    return null
  }
}

export function clearDoctor() {
  localStorage.removeItem(KEY)
}
