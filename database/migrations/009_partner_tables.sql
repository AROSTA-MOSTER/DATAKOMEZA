-- Migration 009: Partner Management Tables
-- Partners, API keys, policies, licenses, and certificates

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    partner_id VARCHAR(50) UNIQUE NOT NULL,
    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(50) NOT NULL CHECK (partner_type IN ('auth', 'ekyc', 'credential', 'misp', 'device', 'ftm')),
    organization_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    website VARCHAR(255),
    certificate_data TEXT,
    certificate_thumbprint VARCHAR(255),
    certificate_expiry TIMESTAMP,
    certificate_issuer VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended', 'rejected')),
    approval_status VARCHAR(30) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_partners_partner_id ON partners(partner_id);
CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_type ON partners(partner_type);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_approval ON partners(approval_status);

-- API Keys for partners
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret_hash VARCHAR(255) NOT NULL,
    key_type VARCHAR(50) DEFAULT 'production' CHECK (key_type IN ('sandbox', 'production')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked', 'expired')),
    permissions JSONB,
    rate_limit INTEGER DEFAULT 1000,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    revoke_reason TEXT
);

CREATE INDEX idx_api_keys_partner ON api_keys(partner_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_status ON api_keys(status);

-- Policies for data sharing and authentication
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    policy_id VARCHAR(50) UNIQUE NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('data_sharing', 'authentication', 'credential', 'ekyc')),
    policy_group VARCHAR(100),
    description TEXT,
    policy_data JSONB NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'deprecated')),
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_policies_policy_id ON policies(policy_id);
CREATE INDEX idx_policies_type ON policies(policy_type);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_group ON policies(policy_group);

-- Partner-Policy mapping
CREATE TABLE IF NOT EXISTS partner_policies (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    policy_id INTEGER NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(partner_id, policy_id)
);

CREATE INDEX idx_partner_policies_partner ON partner_policies(partner_id);
CREATE INDEX idx_partner_policies_policy ON partner_policies(policy_id);
CREATE INDEX idx_partner_policies_status ON partner_policies(status);

-- License keys for MISP partners
CREATE TABLE IF NOT EXISTS license_keys (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    license_type VARCHAR(50) DEFAULT 'misp' CHECK (license_type IN ('misp', 'device', 'ftm')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
    max_transactions INTEGER,
    transaction_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    revoke_reason TEXT
);

CREATE INDEX idx_license_keys_partner ON license_keys(partner_id);
CREATE INDEX idx_license_keys_key ON license_keys(license_key);
CREATE INDEX idx_license_keys_status ON license_keys(status);

-- Partner API usage logs
CREATE TABLE IF NOT EXISTS partner_api_logs (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
    api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10),
    status_code INTEGER,
    request_size INTEGER,
    response_size INTEGER,
    response_time_ms INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_partner_api_logs_partner ON partner_api_logs(partner_id);
CREATE INDEX idx_partner_api_logs_api_key ON partner_api_logs(api_key_id);
CREATE INDEX idx_partner_api_logs_created ON partner_api_logs(created_at);
CREATE INDEX idx_partner_api_logs_endpoint ON partner_api_logs(endpoint);

-- Partner certificates (CA signed)
CREATE TABLE IF NOT EXISTS partner_certificates (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    certificate_type VARCHAR(50) CHECK (certificate_type IN ('root', 'intermediate', 'leaf')),
    certificate_data TEXT NOT NULL,
    certificate_format VARCHAR(20) DEFAULT 'PEM',
    thumbprint VARCHAR(255) UNIQUE NOT NULL,
    serial_number VARCHAR(255),
    issuer VARCHAR(500),
    subject VARCHAR(500),
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    key_usage TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by INTEGER,
    revoked_at TIMESTAMP,
    revoke_reason TEXT
);

CREATE INDEX idx_partner_certs_partner ON partner_certificates(partner_id);
CREATE INDEX idx_partner_certs_thumbprint ON partner_certificates(thumbprint);
CREATE INDEX idx_partner_certs_status ON partner_certificates(status);
CREATE INDEX idx_partner_certs_valid_to ON partner_certificates(valid_to);

COMMENT ON TABLE partners IS 'Partner organizations for authentication, e-KYC, and credential services';
COMMENT ON TABLE api_keys IS 'API keys for partner authentication and authorization';
COMMENT ON TABLE policies IS 'Policies for data sharing and authentication configuration';
COMMENT ON TABLE partner_policies IS 'Mapping between partners and their applicable policies';
COMMENT ON TABLE license_keys IS 'License keys for MISP and device partners';
COMMENT ON TABLE partner_api_logs IS 'API usage logs for monitoring and billing';
COMMENT ON TABLE partner_certificates IS 'CA-signed certificates for cryptographic verification';
