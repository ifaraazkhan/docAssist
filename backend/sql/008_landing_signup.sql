-- Migration 008: track landing page signups
ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS signup_source  VARCHAR(20) DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS signup_device  VARCHAR(10) DEFAULT 'unknown';

-- signup_source: 'landing' | 'whatsapp' (direct wa.me without landing)
-- signup_device: 'mobile'  | 'desktop'  | 'unknown'
