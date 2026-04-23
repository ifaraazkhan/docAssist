import { getToken, clearSession } from "./auth";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

// ── Request helper ──────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });

  if (res.status === 401) {
    clearSession();
    window.location.href = "/";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Auth ────────────────────────────────────────────────────────

export const startSignup = (phone: string) =>
  request<{
    success: boolean;
    status: "existing" | "new" | "resuming";
    magicLink?: string;
    onboardingStep?: string;
    doctorId?: string;
  }>("/api/auth/start-signup", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });

export const verifyMagicLink = (token: string) =>
  request<{ success: boolean; token: string; doctor: Doctor }>(
    "/api/auth/magic-link/verify",
    {
      method: "POST",
      body: JSON.stringify({ token }),
    }
  );

export const sendOtp = (phone: string) =>
  request<{ success: boolean }>("/api/auth/otp/send", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });

export const verifyOtp = (phone: string, otp: string) =>
  request<{ success: boolean; token: string; doctor: Doctor }>(
    "/api/auth/otp/verify",
    {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    }
  );

export const getMe = () =>
  request<{ success: boolean; doctor: Doctor }>("/api/auth/me");

export const logoutAll = () =>
  request<{ success: boolean }>("/api/auth/logout-all", { method: "POST" });

// ── Doctor Profile ──────────────────────────────────────────────

export const getDoctorProfile = () =>
  request<{ success: boolean; doctor: Doctor }>("/api/doctor/profile");

export const updateDoctorProfile = (data: Partial<Doctor>) =>
  request<{ success: boolean; doctor: Doctor }>("/api/doctor/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const getShareInfo = () =>
  request<{
    success: boolean;
    shortLink: string | null;
    doctorCode: string;
    qrData: string | null;
  }>("/api/doctor/share-info");

// ── Onboarding ──────────────────────────────────────────────────

export const getOnboardingStatus = () =>
  request<{
    success: boolean;
    onboardingComplete: boolean;
    onboardingStep: string;
    profileData: {
      name: string | null;
      specialty: string | null;
      clinicName: string | null;
      city: string | null;
      clinicAddress: string | null;
      clinicPhone: string | null;
      clinicHoursStart: string | null;
      clinicHoursEnd: string | null;
      doctorCode: string;
      shortLinkSlug: string | null;
    };
  }>("/api/onboarding/status");

export const confirmProfile = (data: {
  name: string;
  specialty: string;
  clinicName: string;
  city?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicHoursStart?: string;
  clinicHoursEnd?: string;
}) =>
  request<{ success: boolean }>("/api/onboarding/confirm-profile", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const selectProtocols = (libraryProtocolIds: string[]) =>
  request<{ success: boolean; doctorCode: string; shortLink: string | null }>(
    "/api/onboarding/select-protocols",
    {
      method: "POST",
      body: JSON.stringify({ libraryProtocolIds }),
    }
  );

// ── Patients ────────────────────────────────────────────────────

export const getPatients = (filter?: string, cursor?: string) => {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  return request<{
    success: boolean;
    patients: Patient[];
    hasMore: boolean;
    nextCursor: string | null;
  }>(`/api/patients${qs ? `?${qs}` : ""}`);
};

export const getPatient = (id: string) =>
  request<{ success: boolean; patient: Patient }>(`/api/patients/${encodeURIComponent(id)}`);

export const updatePatient = (id: string, data: Partial<Patient>) =>
  request<{ success: boolean }>(`/api/patients/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// ── Messages ────────────────────────────────────────────────────

export const getMessages = (patientId: string, cursor?: string) => {
  const params = new URLSearchParams({ patientId });
  if (cursor) params.set("cursor", cursor);
  return request<{
    success: boolean;
    messages: Message[];
    hasMore: boolean;
    nextCursor: string | null;
  }>(`/api/messages?${params}`);
};

export const sendMessage = (patientId: string, content: string) =>
  request<{ success: boolean; message: Message }>("/api/messages/send", {
    method: "POST",
    body: JSON.stringify({ patientId, content }),
  });

export const markRead = (patientId: string) =>
  request<{ success: boolean }>("/api/messages/read", {
    method: "POST",
    body: JSON.stringify({ patientId }),
  });

// ── Protocols ───────────────────────────────────────────────────

export const getProtocols = () =>
  request<{ success: boolean; protocols: Protocol[] }>("/api/protocols");

// ── Specialties ─────────────────────────────────────────────────

export const getSpecialties = () =>
  request<{ success: boolean; specialties: string[] }>("/api/specialties");

export const getLibraryProtocols = (specialty?: string) => {
  const qs = specialty ? `?specialty=${encodeURIComponent(specialty)}` : "";
  return request<{ success: boolean; protocols: LibraryProtocol[] }>(
    `/api/protocols/library${qs}`
  );
};

export const addLibraryProtocol = (libraryId: string) =>
  request<{ success: boolean; protocol: Protocol }>(
    `/api/protocols/library/${encodeURIComponent(libraryId)}/add`,
    { method: "POST" }
  );

export const createProtocol = (data: {
  title: string;
  keywords: string[];
  replyText: string;
  disclaimer?: string;
  addToMenu?: boolean;
  isActive?: boolean;
}) =>
  request<{ success: boolean; protocol: Protocol }>("/api/protocols", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateProtocol = (id: string, data: Partial<Protocol>) =>
  request<{ success: boolean; protocol: Protocol }>(
    `/api/protocols/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

export const deleteProtocol = (id: string) =>
  request<{ success: boolean }>(`/api/protocols/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// ── Notes ───────────────────────────────────────────────────────

export const getNotes = (patientId: string, cursor?: string) => {
  const params = new URLSearchParams({ patientId });
  if (cursor) params.set("cursor", cursor);
  return request<{
    success: boolean;
    notes: PrivateNote[];
    hasMore: boolean;
    nextCursor: string | null;
  }>(`/api/notes?${params}`);
};

export const createNote = (patientId: string, content: string) =>
  request<{ success: boolean; note: PrivateNote }>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ patientId, content }),
  });

export const deleteNote = (id: string) =>
  request<{ success: boolean }>(`/api/notes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// ── Payments ────────────────────────────────────────────────────

export const createPaymentOrder = (plan: "pro" | "clinic_plus") =>
  request<{
    success: boolean;
    orderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
  }>("/api/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });

export const verifyPayment = (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) =>
  request<{ success: boolean; plan: string }>("/api/payments/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getPaymentHistory = () =>
  request<{
    success: boolean;
    payments: {
      id: string;
      razorpayOrderId: string;
      amountPaise: number;
      plan: string;
      status: string;
      createdAt: string;
    }[];
  }>("/api/payments/history");

// ── Types ───────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  specialty: string | null;
  clinicName: string | null;
  city: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
  clinicHoursStart: string | null;
  clinicHoursEnd: string | null;
  clinicDays: string | null;
  clinicClosed: boolean;
  clinicClosedMessage: string | null;
  doctorCode: string;
  shortLinkSlug: string | null;
  plan: string;
  onboardingComplete: boolean;
  onboardingStep: string | null;
  whatsappConnected: boolean;
  createdAt: string;
}

export interface Patient {
  id: string;
  phone: string;
  name: string | null;
  isUrgent: boolean;
  unreadCount: number;
  status: string;
  source: string;
  patientType: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  mappingId: string;
}

export interface Message {
  id: string;
  wamid: string | null;
  patientPhone: string;
  doctorId: string;
  direction: "inbound" | "outbound";
  sender: "patient" | "doctor" | "bot";
  content: string;
  msgType: string;
  protocolId: string | null;
  waTimestamp: string | null;
  createdAt: string;
}

export interface Protocol {
  id: string;
  doctorId: string;
  librarySourceId: string | null;
  title: string;
  keywords: string[];
  replyText: string;
  isActive: boolean;
  addToMenu: boolean;
  usageCount: number;
  disclaimer: string | null;
  protocolType: string;
  createdAt: string;
}

export interface LibraryProtocol {
  id: string;
  title: string;
  specialty: string;
  keywords: string[];
  replyText: string;
  replyHindi: string | null;
  disclaimer: string | null;
  createdAt: string;
}

export interface PrivateNote {
  id: string;
  patientId: string;
  doctorId: string;
  content: string;
  createdAt: string;
}
