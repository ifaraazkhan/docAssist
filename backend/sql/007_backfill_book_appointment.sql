-- DrCliniq: Backfill "Book Appointment" system protocol for existing doctors
-- Run: psql $DATABASE_URL -f sql/007_backfill_book_appointment.sql

BEGIN;

SET search_path TO dc1, public;

-- Insert "Book Appointment" system protocol for all doctors who don't have one yet
INSERT INTO protocols (doctor_id, title, keywords, reply_text, protocol_type, is_active, add_to_menu)
SELECT d.id,
       'Book Appointment',
       ARRAY['appointment', 'book', 'token', 'opd', 'booking'],
       'Book an appointment',
       'system',
       false,
       false
FROM doctors d
WHERE d.onboarding_complete = true
  AND NOT EXISTS (
    SELECT 1 FROM protocols p
    WHERE p.doctor_id = d.id
      AND p.protocol_type = 'system'
      AND p.title = 'Book Appointment'
      AND p.deleted_at IS NULL
  );

COMMIT;
