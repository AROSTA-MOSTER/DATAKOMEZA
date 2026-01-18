-- Migration 007: Virtual ID Tables
-- Virtual ID management and usage tracking

-- Virtual IDs table
CREATE TABLE IF NOT EXISTS virtual_ids (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vid VARCHAR(16) UNIQUE NOT NULL,
    vid_type VARCHAR(20) NOT NULL CHECK (vid_type IN ('temporary', 'permanent', 'perpetual')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired', 'used')),
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoke_reason TEXT,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vid_user ON virtual_ids(user_id);
CREATE INDEX idx_vid_vid ON virtual_ids(vid);
CREATE INDEX idx_vid_status ON virtual_ids(status);
CREATE INDEX idx_vid_type ON virtual_ids(vid_type);
CREATE INDEX idx_vid_expires ON virtual_ids(expires_at);

-- VID usage logs for audit
CREATE TABLE IF NOT EXISTS vid_usage_logs (
    id SERIAL PRIMARY KEY,
    vid_id INTEGER NOT NULL REFERENCES virtual_ids(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    partner_id INTEGER,
    usage_type VARCHAR(50) NOT NULL CHECK (usage_type IN ('authentication', 'ekyc', 'verification', 'data_share')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vid_usage_vid ON vid_usage_logs(vid_id);
CREATE INDEX idx_vid_usage_user ON vid_usage_logs(user_id);
CREATE INDEX idx_vid_usage_partner ON vid_usage_logs(partner_id);
CREATE INDEX idx_vid_usage_type ON vid_usage_logs(usage_type);
CREATE INDEX idx_vid_usage_created ON vid_usage_logs(created_at);

-- VID to UIN mapping (encrypted)
CREATE TABLE IF NOT EXISTS vid_uin_mapping (
    id SERIAL PRIMARY KEY,
    vid_id INTEGER NOT NULL REFERENCES virtual_ids(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_uin TEXT NOT NULL,
    encryption_key_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vid_id)
);

CREATE INDEX idx_vid_mapping_vid ON vid_uin_mapping(vid_id);
CREATE INDEX idx_vid_mapping_user ON vid_uin_mapping(user_id);

COMMENT ON TABLE virtual_ids IS 'Virtual IDs for privacy-preserving identity verification';
COMMENT ON TABLE vid_usage_logs IS 'Audit trail for Virtual ID usage';
COMMENT ON TABLE vid_uin_mapping IS 'Encrypted mapping between VID and UIN';
COMMENT ON COLUMN virtual_ids.vid_type IS 'temporary: single use, permanent: reusable with expiry, perpetual: no expiry';
