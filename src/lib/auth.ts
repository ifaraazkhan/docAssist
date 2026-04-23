import type { Doctor } from "./api";

const TOKEN_KEY = "drcliniq_token";
const DOCTOR_KEY = "drcliniq_doctor";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function saveDoctor(doctor: Doctor) {
  localStorage.setItem(DOCTOR_KEY, JSON.stringify(doctor));
}

export function getDoctor(): Doctor | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DOCTOR_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Doctor;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(DOCTOR_KEY);
}
