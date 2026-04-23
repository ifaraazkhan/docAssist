-- DrCliniq: Initial Database Schema
-- Run: psql $DATABASE_URL -f sql/001_init.sql
-- Idempotent: safe to re-run (drops and recreates types/tables within the schema)

BEGIN;

-- ============================================================
-- SCHEMA: create dc1 and set as default search path
-- ============================================================
CREATE SCHEMA IF NOT EXISTS dc1;
SET search_path TO dc1, public;

-- ============================================================
-- CLEAN SLATE: drop existing objects so re-runs don't fail
-- ============================================================
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS wa_sessions CASCADE;
DROP TABLE IF EXISTS otp_verifications CASCADE;
DROP TABLE IF EXISTS magic_links CASCADE;
DROP TABLE IF EXISTS private_notes CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS protocols CASCADE;
DROP TABLE IF EXISTS library_protocols CASCADE;
DROP TABLE IF EXISTS patient_doctor_mappings CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

DROP TYPE IF EXISTS onboarding_step;
DROP TYPE IF EXISTS protocol_type;
DROP TYPE IF EXISTS link_purpose;
DROP TYPE IF EXISTS msg_type_enum;
DROP TYPE IF EXISTS msg_sender;
DROP TYPE IF EXISTS msg_direction;
DROP TYPE IF EXISTS patient_type_enum;
DROP TYPE IF EXISTS mapping_status;
DROP TYPE IF EXISTS plan_type;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'clinic_plus');
CREATE TYPE mapping_status AS ENUM ('active', 'opted_out', 'blocked');
CREATE TYPE patient_type_enum AS ENUM ('new', 'returning');
CREATE TYPE msg_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE msg_sender AS ENUM ('patient', 'bot', 'doctor');
CREATE TYPE msg_type_enum AS ENUM ('text', 'image', 'audio', 'document', 'interactive');
CREATE TYPE link_purpose AS ENUM ('setup', 'login');
CREATE TYPE protocol_type AS ENUM ('system', 'library', 'custom');
CREATE TYPE onboarding_step AS ENUM ('name', 'specialty', 'clinic_name', 'done');

-- ============================================================
-- TABLE: doctors
-- ============================================================
CREATE TABLE doctors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) NOT NULL UNIQUE,       -- E.164 without +, e.g. 919876543210
    email           VARCHAR(255) UNIQUE,               -- nullable, optional
    name            VARCHAR(255),                      -- nullable until onboarding collects it
    specialty       VARCHAR(100),
    clinic_name     VARCHAR(255),
    city            VARCHAR(100),
    clinic_address  TEXT,
    clinic_phone    VARCHAR(20),                       -- if different from WhatsApp phone
    clinic_hours_start TIME,
    clinic_hours_end   TIME,
    doctor_code     VARCHAR(20) UNIQUE,                -- e.g. CLINIC_FK001
    short_link_slug VARCHAR(30) UNIQUE,                -- e.g. faraaz-482
    plan            plan_type NOT NULL DEFAULT 'free',
    onboarding_complete BOOLEAN NOT NULL DEFAULT false,
    onboarding_step onboarding_step NOT NULL DEFAULT 'name',
    jwt_version     INTEGER NOT NULL DEFAULT 1,        -- increment to revoke all tokens
    whatsapp_connected BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: patients
-- ============================================================
CREATE TABLE patients (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone      VARCHAR(20) NOT NULL UNIQUE,            -- E.164 without +
    name       VARCHAR(255),                           -- nullable, from WhatsApp profile
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: patient_doctor_mappings
-- ============================================================
CREATE TABLE patient_doctor_mappings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id    UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    source       VARCHAR(50) NOT NULL,                 -- e.g. CLINIC_FK001, DIRECT, REFERRAL
    patient_type patient_type_enum NOT NULL DEFAULT 'new',
    status       mapping_status NOT NULL DEFAULT 'active',
    is_urgent    BOOLEAN NOT NULL DEFAULT false,
    unread_count INTEGER NOT NULL DEFAULT 0,
    last_read_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(patient_id, doctor_id)
);

-- ============================================================
-- TABLE: library_protocols (system-wide templates, admin-seeded)
-- ============================================================
CREATE TABLE library_protocols (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    specialty   VARCHAR(100) NOT NULL,                 -- e.g. General Physician, Pediatrics
    keywords    TEXT[] NOT NULL DEFAULT '{}',
    reply_text  TEXT NOT NULL,
    reply_hindi TEXT,
    disclaimer  TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: protocols (doctor-specific, cloned from library or custom)
-- ============================================================
CREATE TABLE protocols (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    library_source_id UUID REFERENCES library_protocols(id) ON DELETE SET NULL,
    title             VARCHAR(255) NOT NULL,
    keywords          TEXT[] NOT NULL DEFAULT '{}',
    reply_text        TEXT NOT NULL,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    add_to_menu       BOOLEAN NOT NULL DEFAULT false,
    usage_count       INTEGER NOT NULL DEFAULT 0,
    disclaimer        TEXT NOT NULL DEFAULT '',
    protocol_type     protocol_type NOT NULL DEFAULT 'custom',
    deleted_at        TIMESTAMPTZ,                     -- soft delete
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: messages
-- ============================================================
CREATE TABLE messages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wamid         VARCHAR(255) UNIQUE,                 -- WhatsApp message ID for dedup (nullable for outbound)
    patient_phone VARCHAR(20) NOT NULL,
    doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    direction     msg_direction NOT NULL,
    sender        msg_sender NOT NULL,
    content       TEXT NOT NULL DEFAULT '',
    msg_type      msg_type_enum NOT NULL DEFAULT 'text',
    protocol_id   UUID,                                -- loose ref, NO FK (allows soft-deleted protocols)
    wa_timestamp  TIMESTAMPTZ,                         -- original WhatsApp timestamp
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: private_notes
-- ============================================================
CREATE TABLE private_notes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id  UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    deleted_at TIMESTAMPTZ,                            -- soft delete
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: magic_links
-- ============================================================
CREATE TABLE magic_links (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token      VARCHAR(128) NOT NULL UNIQUE,
    doctor_id  UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    purpose    link_purpose NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: otp_verifications
-- ============================================================
CREATE TABLE otp_verifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone      VARCHAR(20) NOT NULL,
    otp_hash   VARCHAR(255) NOT NULL,                  -- bcrypt hash
    attempts   INTEGER NOT NULL DEFAULT 0,
    verified   BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: wa_sessions (24hr routing for multi-doctor patients)
-- ============================================================
CREATE TABLE wa_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_phone VARCHAR(20) NOT NULL,
    doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_msg_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- TABLE: payments (Razorpay)
-- ============================================================
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id           UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    razorpay_order_id   VARCHAR(255) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_signature  VARCHAR(512),
    amount_paise        INTEGER NOT NULL,
    plan                plan_type NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'created',  -- created | paid | failed
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- messages: lookup by patient+doctor, and by time
CREATE INDEX idx_messages_patient_doctor ON messages(patient_phone, doctor_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- patient_doctor_mappings: lookup by each side
CREATE INDEX idx_pdm_doctor ON patient_doctor_mappings(doctor_id);
CREATE INDEX idx_pdm_patient ON patient_doctor_mappings(patient_id);

-- protocols: active protocols per doctor (partial index excludes soft-deleted)
CREATE INDEX idx_protocols_doctor_active ON protocols(doctor_id) WHERE deleted_at IS NULL;

-- wa_sessions: find active session by patient phone
CREATE INDEX idx_wa_sessions_phone ON wa_sessions(patient_phone, expires_at);

-- magic_links: lookup by token (already UNIQUE, but explicit for clarity)
-- (UNIQUE constraint creates an implicit index)

-- otp_verifications: recent OTPs per phone
CREATE INDEX idx_otp_phone_created ON otp_verifications(phone, created_at);

-- payments: lookup by doctor
CREATE INDEX idx_payments_doctor ON payments(doctor_id);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_protocols_updated_at
    BEFORE UPDATE ON protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
