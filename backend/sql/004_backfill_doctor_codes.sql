-- DrCliniq: Backfill doctor_code and short_link_slug for existing doctors
-- Run: psql $DATABASE_URL -f sql/004_backfill_doctor_codes.sql

BEGIN;

SET search_path TO dc1, public;

-- Backfill doctor_code for any doctor with NULL
-- Format: DC-CARE-NNNN (using deterministic but unique suffix from id)
UPDATE doctors
SET doctor_code = 'DC-' ||
  (ARRAY['CARE','HEAL','LIFE','STAR','WELL','CURE','HOPE','SAFE','GLOW','PURE','VIBE','EASE'])[
    1 + (('x' || LEFT(md5(id::text), 4))::bit(16)::int % 12)
  ] || '-' ||
  (1000 + ('x' || LEFT(md5(id::text || 'code'), 4))::bit(16)::int % 9000)
WHERE doctor_code IS NULL;

-- Backfill short_link_slug
UPDATE doctors
SET short_link_slug = 'dr-' ||
  LEFT(
    REGEXP_REPLACE(
      REGEXP_REPLACE(LOWER(COALESCE(name, 'doctor')), '^dr\.?\s*', ''),
      '[^a-z0-9]+', '-', 'g'
    ),
    20
  ) || '-' ||
  (100 + ('x' || LEFT(md5(id::text || 'slug'), 4))::bit(16)::int % 900)
WHERE short_link_slug IS NULL;

COMMIT;
