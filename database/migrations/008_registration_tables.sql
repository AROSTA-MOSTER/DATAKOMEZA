-- Migration 008: Registration Tables
-- Operator management, registration packets, and pre-registration

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    operator_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    biometric_data JSONB,
    role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('operator', 'supervisor', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    registration_center_id VARCHAR(50),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

CREATE INDEX idx_operators_operator_id ON operators(operator_id);
CREATE INDEX idx_operators_email ON operators(email);
CREATE INDEX idx_operators_status ON operators(status);
CREATE INDEX idx_operators_role ON operators(role);

-- Operator sessions
CREATE TABLE IF NOT EXISTS operator_sessions (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    login_mode VARCHAR(30) CHECK (login_mode IN ('biometric', 'password', 'offline')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    terminated_at TIMESTAMP
);

CREATE INDEX idx_operator_sessions_operator ON operator_sessions(operator_id);
CREATE INDEX idx_operator_sessions_token ON operator_sessions(session_token);
CREATE INDEX idx_operator_sessions_status ON operator_sessions(status);

-- Registration packets
CREATE TABLE IF NOT EXISTS registration_packets (
    id SERIAL PRIMARY KEY,
    packet_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operator_id INTEGER NOT NULL REFERENCES operators(id) ON DELETE RESTRICT,
    pre_reg_id VARCHAR(50),
    demographic_data JSONB NOT NULL,
    biometric_data JSONB,
    documents JSONB,
    packet_hash VARCHAR(255),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'supervisor_review', 'approved', 'rejected', 'uploaded', 'processed', 'failed')),
    supervisor_id INTEGER REFERENCES operators(id) ON DELETE SET NULL,
    supervisor_comments TEXT,
    reviewed_at TIMESTAMP,
    uploaded_at TIMESTAMP,
    processed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_packets_packet_id ON registration_packets(packet_id);
CREATE INDEX idx_packets_user ON registration_packets(user_id);
CREATE INDEX idx_packets_operator ON registration_packets(operator_id);
CREATE INDEX idx_packets_status ON registration_packets(status);
CREATE INDEX idx_packets_supervisor ON registration_packets(supervisor_id);
CREATE INDEX idx_packets_created ON registration_packets(created_at);

-- Pre-registration data
CREATE TABLE IF NOT EXISTS pre_registrations (
    id SERIAL PRIMARY KEY,
    pre_reg_id VARCHAR(50) UNIQUE NOT NULL,
    demographic_data JSONB NOT NULL,
    documents JSONB,
    appointment_date TIMESTAMP,
    appointment_time_slot VARCHAR(20),
    registration_center_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'booked', 'completed', 'cancelled', 'expired')),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_prereg_id ON pre_registrations(pre_reg_id);
CREATE INDEX idx_prereg_status ON pre_registrations(status);
CREATE INDEX idx_prereg_appointment ON pre_registrations(appointment_date);
CREATE INDEX idx_prereg_created ON pre_registrations(created_at);

-- Acknowledgement slips
CREATE TABLE IF NOT EXISTS acknowledgement_slips (
    id SERIAL PRIMARY KEY,
    packet_id INTEGER NOT NULL REFERENCES registration_packets(id) ON DELETE CASCADE,
    slip_number VARCHAR(50) UNIQUE NOT NULL,
    qr_code_data TEXT,
    pdf_path TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    printed BOOLEAN DEFAULT FALSE,
    printed_at TIMESTAMP
);

CREATE INDEX idx_ack_packet ON acknowledgement_slips(packet_id);
CREATE INDEX idx_ack_slip_number ON acknowledgement_slips(slip_number);

-- Registration centers (for reference)
CREATE TABLE IF NOT EXISTS registration_centers (
    id SERIAL PRIMARY KEY,
    center_id VARCHAR(50) UNIQUE NOT NULL,
    center_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    working_hours JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_centers_center_id ON registration_centers(center_id);
CREATE INDEX idx_centers_status ON registration_centers(status);

COMMENT ON TABLE operators IS 'Registration operators and supervisors';
COMMENT ON TABLE operator_sessions IS 'Active operator sessions with multi-modal login support';
COMMENT ON TABLE registration_packets IS 'Registration data packets awaiting processing';
COMMENT ON TABLE pre_registrations IS 'Pre-registration appointments and data';
COMMENT ON TABLE acknowledgement_slips IS 'Registration acknowledgement slips with QR codes';
COMMENT ON TABLE registration_centers IS 'Physical registration centers';
