-- DrCliniq: Specialties lookup table
-- Run: psql $DATABASE_URL -f sql/002_specialties.sql

BEGIN;

SET search_path TO dc1, public;

CREATE TABLE IF NOT EXISTS specialties (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed specialties (skip duplicates)
INSERT INTO specialties (name, sort_order) VALUES
  ('General Physician',  1),
  ('Pediatrics',         2),
  ('Cardiology',         3),
  ('Dermatology',        4),
  ('Endocrinology',      5),
  ('ENT',                6),
  ('Gastroenterology',   7),
  ('Gynecology',         8),
  ('Nephrology',         9),
  ('Neurology',         10),
  ('Oncology',          11),
  ('Ophthalmology',     12),
  ('Orthopedics',       13),
  ('Psychiatry',        14),
  ('Pulmonology',       15),
  ('Rheumatology',      16),
  ('Surgery',           17),
  ('Urology',           18),
  ('Other',             99)
ON CONFLICT (name) DO NOTHING;

COMMIT;
