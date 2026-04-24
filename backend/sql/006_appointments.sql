-- DrCliniq: Appointment booking (token-based OPD system)
-- Run: psql $DATABASE_URL -f sql/006_appointments.sql

BEGIN;

SET search_path TO dc1, public;

-- ============================================================
-- ENUM: appointment status
-- ============================================================
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('booked', 'cancelled', 'completed', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLE: opd_sessions (doctor's OPD schedule)
-- ============================================================
CREATE TABLE IF NOT EXISTS opd_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    days            VARCHAR(7) NOT NULL DEFAULT '1111110',
    avg_minutes     INTEGER NOT NULL DEFAULT 5,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opd_sessions_doctor ON opd_sessions(doctor_id);

-- ============================================================
-- TABLE: appointments (patient token bookings)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id        UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    session_id       UUID NOT NULL REFERENCES opd_sessions(id) ON DELETE CASCADE,
    patient_phone    VARCHAR(20) NOT NULL,
    patient_name     VARCHAR(255),
    token_number     INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    status           appointment_status NOT NULL DEFAULT 'booked',
    booked_via       VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_session_date ON appointments(session_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_phone, appointment_date);

-- Trigger for opd_sessions updated_at
CREATE TRIGGER trg_opd_sessions_updated_at
    BEFORE UPDATE ON opd_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
