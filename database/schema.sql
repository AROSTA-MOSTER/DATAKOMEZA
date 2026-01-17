-- DATAKOMEZA Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Refugees and Asylum Seekers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosip_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    pin_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    photo_url TEXT,
    qr_code_data TEXT,
    encryption_key TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Service Providers table (NGOs, Healthcare, Education, etc.)
CREATE TABLE service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- healthcare, education, humanitarian_aid, livelihood
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    logo_url TEXT,
    api_key VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin
    service_provider_id UUID REFERENCES service_providers(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- User Attributes table (Encrypted personal data)
CREATE TABLE user_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value_encrypted TEXT NOT NULL,
    attribute_type VARCHAR(50), -- text, date, number, file
    is_sensitive BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, attribute_name)
);

-- Consent Records table
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_provider_id UUID REFERENCES service_providers(id),
    attributes_shared JSONB NOT NULL, -- Array of attribute names
    purpose TEXT NOT NULL,
    consent_given BOOLEAN DEFAULT false,
    consent_date TIMESTAMP,
    expiry_date TIMESTAMP,
    revoked BOOLEAN DEFAULT false,
    revoked_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authentication Logs table
CREATE TABLE authentication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    service_provider_id UUID REFERENCES service_providers(id),
    auth_method VARCHAR(50), -- qr_code, pin, biometric
    auth_status VARCHAR(50), -- success, failed
    ip_address VARCHAR(50),
    user_agent TEXT,
    location JSONB,
    offline_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table (Privacy compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    admin_id UUID REFERENCES admin_users(id),
    service_provider_id UUID REFERENCES service_providers(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verification Tokens table (For offline verification)
CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    token_type VARCHAR(50), -- qr_code, offline_pin
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Access Requests table
CREATE TABLE service_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    service_provider_id UUID REFERENCES service_providers(id),
    requested_attributes JSONB NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_mosip_id ON users(mosip_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_service_providers_type ON service_providers(type);
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_service_provider_id ON consent_records(service_provider_id);
CREATE INDEX idx_authentication_logs_user_id ON authentication_logs(user_id);
CREATE INDEX idx_authentication_logs_created_at ON authentication_logs(created_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON service_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_attributes_updated_at BEFORE UPDATE ON user_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at BEFORE UPDATE ON consent_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_access_requests_updated_at BEFORE UPDATE ON service_access_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
