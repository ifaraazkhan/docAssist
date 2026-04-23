-- DrCliniq: Add clinic days, closed toggle, and closed message
-- Run: psql $DATABASE_URL -f sql/003_clinic_availability.sql

BEGIN;

SET search_path TO dc1, public;

-- clinic_days: 7-char string "1111110" = Mon-Sun (1=open, 0=closed)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_days VARCHAR(7) DEFAULT '1111110';

-- Temporarily closed toggle + custom message
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_closed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_closed_message TEXT DEFAULT 'Our clinic is temporarily closed. We will resume soon. For emergencies, please visit the nearest hospital.';

COMMIT;
