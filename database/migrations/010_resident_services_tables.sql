-- Migration 010: Resident Services Tables
-- Authentication locks, service requests, card customization, and transaction history

-- Authentication locks (lock/unlock authentication methods)
CREATE TABLE IF NOT EXISTS auth_locks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN ('biometric', 'otp', 'demographic', 'all')),
    biometric_modality VARCHAR(30) CHECK (biometric_modality IN ('fingerprint', 'iris', 'face', 'all')),
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP,
    locked_by VARCHAR(50) DEFAULT 'user',
    unlock_requested BOOLEAN DEFAULT FALSE,
    unlock_request_at TIMESTAMP,
    unlocked_at TIMESTAMP,
    lock_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, auth_type, biometric_modality)
);

CREATE INDEX idx_auth_locks_user ON auth_locks(user_id);
CREATE INDEX idx_auth_locks_type ON auth_locks(auth_type);
CREATE INDEX idx_auth_locks_locked ON auth_locks(is_locked);

-- Service requests (VID generation, card download, data updates, etc.)
CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id VARCHAR(100) UNIQUE NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
        'vid_generate', 'vid_revoke', 'card_download', 'card_customize',
        'data_update', 'auth_lock', 'auth_unlock', 'phone_verify',
        'email_verify', 'data_share', 'uin_update'
    )),
    request_data JSONB,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'
    )),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    result_data JSONB,
    error_message TEXT,
    processing_started_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_service_requests_user ON service_requests(user_id);
CREATE INDEX idx_service_requests_id ON service_requests(request_id);
CREATE INDEX idx_service_requests_type ON service_requests(request_type);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_created ON service_requests(created_at);

-- Card customization templates and data
CREATE TABLE IF NOT EXISTS card_customizations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id VARCHAR(50) NOT NULL,
    template_name VARCHAR(100),
    customization_data JSONB NOT NULL,
    preview_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_card_custom_user ON card_customizations(user_id);
CREATE INDEX idx_card_custom_template ON card_customizations(template_id);
CREATE INDEX idx_card_custom_active ON card_customizations(is_active);

-- Card download history
CREATE TABLE IF NOT EXISTS card_downloads (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_type VARCHAR(50) CHECK (card_type IN ('uin', 'vid', 'custom')),
    download_format VARCHAR(20) DEFAULT 'pdf',
    customization_id INTEGER REFERENCES card_customizations(id),
    file_path TEXT,
    file_size INTEGER,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX idx_card_downloads_user ON card_downloads(user_id);
CREATE INDEX idx_card_downloads_type ON card_downloads(card_type);
CREATE INDEX idx_card_downloads_downloaded ON card_downloads(downloaded_at);

-- Transaction history (comprehensive user activity log)
CREATE TABLE IF NOT EXISTS transaction_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_category VARCHAR(50) CHECK (transaction_category IN (
        'authentication', 'data_share', 'service_request', 'vid_operation',
        'card_operation', 'profile_update', 'consent_management'
    )),
    description TEXT,
    partner_id INTEGER,
    service_provider_id INTEGER,
    status VARCHAR(30),
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_history_user ON transaction_history(user_id);
CREATE INDEX idx_transaction_history_id ON transaction_history(transaction_id);
CREATE INDEX idx_transaction_history_type ON transaction_history(transaction_type);
CREATE INDEX idx_transaction_history_category ON transaction_history(transaction_category);
CREATE INDEX idx_transaction_history_created ON transaction_history(created_at);

-- Phone and email verification
CREATE TABLE IF NOT EXISTS contact_verifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('phone', 'email')),
    contact_value VARCHAR(255) NOT NULL,
    verification_code VARCHAR(10),
    verification_method VARCHAR(30) CHECK (verification_method IN ('otp', 'link', 'code')),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_verif_user ON contact_verifications(user_id);
CREATE INDEX idx_contact_verif_type ON contact_verifications(contact_type);
CREATE INDEX idx_contact_verif_verified ON contact_verifications(is_verified);

-- Data update requests (demographic updates)
CREATE TABLE IF NOT EXISTS data_update_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id VARCHAR(100) UNIQUE NOT NULL,
    update_type VARCHAR(50) CHECK (update_type IN ('demographic', 'contact', 'address', 'document')),
    current_data JSONB,
    new_data JSONB NOT NULL,
    supporting_documents JSONB,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'under_review', 'approved', 'rejected', 'completed'
    )),
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_data_updates_user ON data_update_requests(user_id);
CREATE INDEX idx_data_updates_request ON data_update_requests(request_id);
CREATE INDEX idx_data_updates_type ON data_update_requests(update_type);
CREATE INDEX idx_data_updates_status ON data_update_requests(status);

-- Partner data sharing logs (when residents share data with partners)
CREATE TABLE IF NOT EXISTS partner_data_shares (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    share_id VARCHAR(100) UNIQUE NOT NULL,
    data_shared JSONB NOT NULL,
    policy_id INTEGER REFERENCES policies(id),
    consent_id INTEGER,
    share_method VARCHAR(50) CHECK (share_method IN ('qr_code', 'api', 'portal', 'offline')),
    expires_at TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoke_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_partner_shares_user ON partner_data_shares(user_id);
CREATE INDEX idx_partner_shares_partner ON partner_data_shares(partner_id);
CREATE INDEX idx_partner_shares_id ON partner_data_shares(share_id);
CREATE INDEX idx_partner_shares_created ON partner_data_shares(created_at);

COMMENT ON TABLE auth_locks IS 'User-controlled authentication method locks';
COMMENT ON TABLE service_requests IS 'All resident service requests with status tracking';
COMMENT ON TABLE card_customizations IS 'ID card customization templates and preferences';
COMMENT ON TABLE card_downloads IS 'History of card downloads (UIN/VID cards)';
COMMENT ON TABLE transaction_history IS 'Comprehensive user activity and transaction log';
COMMENT ON TABLE contact_verifications IS 'Phone and email verification records';
COMMENT ON TABLE data_update_requests IS 'Self-service demographic data update requests';
COMMENT ON TABLE partner_data_shares IS 'Data sharing with partners via resident portal';
