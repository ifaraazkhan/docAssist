-- DrCliniq: Add new onboarding steps
-- Run: psql $DATABASE_URL -f sql/005_add_confirm_step.sql

BEGIN;

SET search_path TO dc1, public;

ALTER TYPE onboarding_step ADD VALUE IF NOT EXISTS 'specialty_other' AFTER 'specialty';
ALTER TYPE onboarding_step ADD VALUE IF NOT EXISTS 'specialty_confirm' AFTER 'specialty_other';
ALTER TYPE onboarding_step ADD VALUE IF NOT EXISTS 'confirm' AFTER 'clinic_name';

COMMIT;
