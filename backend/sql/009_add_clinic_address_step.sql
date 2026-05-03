-- DrCliniq: Add 'clinic_address' onboarding step between 'clinic_name' and 'confirm'
-- Run: psql $DATABASE_URL -f sql/009_add_clinic_address_step.sql

BEGIN;

SET search_path TO dc1, public;

ALTER TYPE onboarding_step ADD VALUE IF NOT EXISTS 'clinic_address' AFTER 'clinic_name';

COMMIT;
