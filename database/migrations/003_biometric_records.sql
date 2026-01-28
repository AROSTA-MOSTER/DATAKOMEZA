-- Migration: Add Biometric Records Table
-- Date: 2026-01-28
-- Description: Creates table to store captured biometric data for each user

-- Biometric Records Table
CREATE TABLE IF NOT EXISTS biometric_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    biometric_type VARCHAR(50) NOT NULL, -- 'face', 'fingerprint', 'iris', 'signature'
    finger_position VARCHAR(20), -- For fingerprints: 'right_thumb', 'left_index', etc.
    quality_score DECIMAL(5,2),
    captured_at TIMESTAMP DEFAULT NOW(),
    captured_by UUID, -- Admin who captured
    template_hash VARCHAR(255), -- Hashed biometric template (not raw data)
    deduplication_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'unique', 'duplicate_found'
    status VARCHAR(50) DEFAULT 'captured' -- 'captured', 'verified', 'failed_quality'
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_biometric_user ON biometric_records(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_type ON biometric_records(biometric_type);
CREATE INDEX IF NOT EXISTS idx_biometric_status ON biometric_records(status);

-- Add correction_requested status to users if needed
-- (Note: Check if ENUM already includes this, otherwise add it)

-- Add scheduled_biometric_date column for scheduling
ALTER TABLE users ADD COLUMN IF NOT EXISTS scheduled_biometric_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS correction_fields TEXT[]; -- Array of field names needing correction

-- Comments for documentation
COMMENT ON TABLE biometric_records IS 'Stores all captured biometric data for MOSIP-compliant identity verification';
COMMENT ON COLUMN biometric_records.biometric_type IS 'Type: face, fingerprint, iris, signature';
COMMENT ON COLUMN biometric_records.finger_position IS 'Position for fingerprints: right_thumb, right_index, etc.';
COMMENT ON COLUMN biometric_records.template_hash IS 'Hashed template - never store raw biometric data';
