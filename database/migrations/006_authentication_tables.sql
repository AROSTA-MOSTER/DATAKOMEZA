-- Migration 006: Authentication Tables
-- OTP tracking, authentication logs, and partner tokens

-- OTP requests table
CREATE TABLE IF NOT EXISTS otp_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    otp_type VARCHAR(20) NOT NULL CHECK (otp_type IN ('sms', 'email')),
    contact VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP
);

CREATE INDEX idx_otp_user_id ON otp_requests(user_id);
CREATE INDEX idx_otp_expires ON otp_requests(expires_at);
CREATE INDEX idx_otp_verified ON otp_requests(verified);

-- Authentication logs for audit trail
CREATE TABLE IF NOT EXISTS authentication_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    authentication_type VARCHAR(50) NOT NULL,
    authentication_status VARCHAR(20) NOT NULL,
    partner_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_logs_user_id ON authentication_logs(user_id);
CREATE INDEX idx_auth_logs_created ON authentication_logs(created_at);
CREATE INDEX idx_auth_logs_status ON authentication_logs(authentication_status);
CREATE INDEX idx_auth_logs_type ON authentication_logs(authentication_type);

-- Partner-specific user tokens (PSUT) for tokenization
CREATE TABLE IF NOT EXISTS partner_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    token_type VARCHAR(50) DEFAULT 'psut',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    UNIQUE(user_id, partner_id)
);

CREATE INDEX idx_partner_tokens_user ON partner_tokens(user_id);
CREATE INDEX idx_partner_tokens_partner ON partner_tokens(partner_id);
CREATE INDEX idx_partner_tokens_token ON partner_tokens(token);
CREATE INDEX idx_partner_tokens_status ON partner_tokens(status);

-- Demographic authentication cache
CREATE TABLE IF NOT EXISTS demographic_cache (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name_hash VARCHAR(255),
    dob_hash VARCHAR(255),
    address_hash VARCHAR(255),
    phone_hash VARCHAR(255),
    email_hash VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_demographic_cache_user ON demographic_cache(user_id);

-- e-KYC request logs
CREATE TABLE IF NOT EXISTS ekyc_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    partner_id INTEGER NOT NULL,
    request_id VARCHAR(100) UNIQUE NOT NULL,
    policy_id INTEGER,
    data_shared JSONB,
    encrypted_response TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_ekyc_user ON ekyc_requests(user_id);
CREATE INDEX idx_ekyc_partner ON ekyc_requests(partner_id);
CREATE INDEX idx_ekyc_status ON ekyc_requests(status);
CREATE INDEX idx_ekyc_created ON ekyc_requests(created_at);

COMMENT ON TABLE otp_requests IS 'Stores OTP requests for SMS and email authentication';
COMMENT ON TABLE authentication_logs IS 'Audit trail for all authentication attempts';
COMMENT ON TABLE partner_tokens IS 'Partner-specific user tokens (PSUT) for repeat customer identification';
COMMENT ON TABLE demographic_cache IS 'Hashed demographic data for fast authentication matching';
COMMENT ON TABLE ekyc_requests IS 'e-KYC request tracking and audit';
