-- Migration: Add MOSIP Pre-Enrolment Fields
-- Date: 2026-01-28
-- Description: Adds columns for full MOSIP-compliant pre-enrolment data

-- Add new demographic fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_address TEXT;

-- Add index for faster lookups on new fields
CREATE INDEX IF NOT EXISTS idx_users_marital_status ON users(marital_status);

-- Comment on columns for documentation
COMMENT ON COLUMN users.place_of_birth IS 'Place of birth for identity verification';
COMMENT ON COLUMN users.father_name IS 'Father full name for identity verification';
COMMENT ON COLUMN users.mother_name IS 'Mother full name for identity verification';
COMMENT ON COLUMN users.marital_status IS 'Marital status: Single, Married, Divorced, Widowed';
COMMENT ON COLUMN users.current_address IS 'Current residential address';
