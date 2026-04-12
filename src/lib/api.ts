const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

// Auth
export const login = (email: string, password: string) =>
  request<{ success: boolean; doctor: Doctor }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

// Patients
export const getPatients = (doctorId: string) =>
  request<Patient[]>(`/api/patients?doctorId=${doctorId}`)

export const getPatient = (id: string) =>
  request<Patient>(`/api/patients/${id}`)

export const updatePatient = (id: string, data: Partial<Patient>) =>
  request<Patient>(`/api/patients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

// Messages
export const getMessages = (patientId: string) =>
  request<Message[]>(`/api/messages?patientId=${patientId}`)

export const sendMessage = (patientId: string, content: string) =>
  request<Message>('/api/messages/send', {
    method: 'POST',
    body: JSON.stringify({ patientId, content }),
  })

// Protocols
export const getProtocols = (doctorId: string) =>
  request<Protocol[]>(`/api/protocols?doctorId=${doctorId}`)

export const createProtocol = (data: {
  doctorId: string
  title: string
  keywords: string
  replyText: string
  addToMenu: boolean
}) =>
  request<Protocol>('/api/protocols', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateProtocol = (id: string, data: Partial<Protocol>) =>
  request<Protocol>(`/api/protocols/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const deleteProtocol = (id: string) =>
  request<{ success: boolean }>(`/api/protocols/${id}`, { method: 'DELETE' })

// Notes
export const getNotes = (patientId: string) =>
  request<PrivateNote[]>(`/api/notes?patientId=${patientId}`)

export const createNote = (patientId: string, content: string) =>
  request<PrivateNote>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ patientId, content }),
  })

// Types
export interface Doctor {
  id: string
  email: string
  name: string
  specialty: string | null
  clinicName: string | null
  phone: string | null
  createdAt: string
}

export interface Patient {
  id: string
  phone: string
  name: string | null
  isUrgent: boolean
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export interface Message {
  id: string
  patientId: string
  content: string
  sender: 'patient' | 'doctor' | 'bot'
  protocolName: string | null
  createdAt: string
}

export interface Protocol {
  id: string
  doctorId: string
  title: string
  keywords: string[]
  replyText: string
  isActive: boolean
  addToMenu: boolean
  usageCount: number
  createdAt: string
}

export interface PrivateNote {
  id: string
  patientId: string
  content: string
  createdAt: string
}
