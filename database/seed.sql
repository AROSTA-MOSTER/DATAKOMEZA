-- DATAKOMEZA Sample Data
-- This file contains sample data for development and testing

-- Sample Service Providers
INSERT INTO service_providers (id, name, type, description, contact_email, contact_phone, address, api_key, status) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Hope Healthcare Clinic',
    'healthcare',
    'Primary healthcare services for refugees and asylum seekers',
    'contact@hopehealthcare.org',
    '+250788123456',
    'Kigali, Rwanda',
    'sp_healthcare_' || md5(random()::text),
    'active'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Future Bright Education Center',
    'education',
    'Educational programs and vocational training',
    'info@futurebrightcenter.org',
    '+250788234567',
    'Nairobi, Kenya',
    'sp_education_' || md5(random()::text),
    'active'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Unity Humanitarian Aid',
    'humanitarian_aid',
    'Emergency relief and humanitarian assistance',
    'help@unityaid.org',
    '+250788345678',
    'Kampala, Uganda',
    'sp_humanitarian_' || md5(random()::text),
    'active'
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Skills & Livelihoods Program',
    'livelihood',
    'Job training and livelihood support services',
    'contact@skillslivelihoods.org',
    '+250788456789',
    'Dar es Salaam, Tanzania',
    'sp_livelihood_' || md5(random()::text),
    'active'
);

-- Sample Admin Users (password is 'Admin@123' hashed with bcrypt)
-- Hash: $2b$10$rKZWvYVXqQpzKZH5L5L5L.5L5L5L5L5L5L5L5L5L5L5L5L5L5L5L5
INSERT INTO admin_users (id, email, password_hash, full_name, role, service_provider_id, status) VALUES
(
    '660e8400-e29b-41d4-a716-446655440001',
    'admin@datakomeza.org',
    '$2b$10$YourHashedPasswordHere123456789012345678901234567890',
    'System Administrator',
    'super_admin',
    NULL,
    'active'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    'admin@hopehealthcare.org',
    '$2b$10$YourHashedPasswordHere123456789012345678901234567890',
    'Dr. Sarah Johnson',
    'admin',
    '550e8400-e29b-41d4-a716-446655440001',
    'active'
),
(
    '660e8400-e29b-41d4-a716-446655440003',
    'admin@futurebrightcenter.org',
    '$2b$10$YourHashedPasswordHere123456789012345678901234567890',
    'Prof. James Kimani',
    'admin',
    '550e8400-e29b-41d4-a716-446655440002',
    'active'
);

-- Sample Users (Refugees)
-- PIN is '123456' hashed
INSERT INTO users (id, mosip_id, email, phone, pin_hash, first_name, last_name, date_of_birth, gender, nationality, encryption_key, status) VALUES
(
    '770e8400-e29b-41d4-a716-446655440001',
    'MOSIP' || lpad(floor(random() * 1000000000)::text, 10, '0'),
    'amina.refugee@example.com',
    '+250788111222',
    '$2b$10$YourHashedPINHere1234567890123456789012345678901234',
    'Amina',
    'Hassan',
    '1990-05-15',
    'Female',
    'Somalia',
    encode(gen_random_bytes(32), 'base64'),
    'active'
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    'MOSIP' || lpad(floor(random() * 1000000000)::text, 10, '0'),
    'joseph.refugee@example.com',
    '+250788222333',
    '$2b$10$YourHashedPINHere1234567890123456789012345678901234',
    'Joseph',
    'Okello',
    '1985-08-22',
    'Male',
    'South Sudan',
    encode(gen_random_bytes(32), 'base64'),
    'active'
),
(
    '770e8400-e29b-41d4-a716-446655440003',
    'MOSIP' || lpad(floor(random() * 1000000000)::text, 10, '0'),
    'fatima.refugee@example.com',
    '+250788333444',
    '$2b$10$YourHashedPINHere1234567890123456789012345678901234',
    'Fatima',
    'Ahmed',
    '1995-03-10',
    'Female',
    'Sudan',
    encode(gen_random_bytes(32), 'base64'),
    'active'
);

-- Sample User Attributes (Encrypted - in real app these would be properly encrypted)
INSERT INTO user_attributes (user_id, attribute_name, attribute_value_encrypted, attribute_type, is_sensitive) VALUES
-- Amina's attributes
('770e8400-e29b-41d4-a716-446655440001', 'refugee_status', 'ENCRYPTED:refugee', 'text', true),
('770e8400-e29b-41d4-a716-446655440001', 'unhcr_id', 'ENCRYPTED:UNHCR123456', 'text', true),
('770e8400-e29b-41d4-a716-446655440001', 'medical_conditions', 'ENCRYPTED:None', 'text', true),
('770e8400-e29b-41d4-a716-446655440001', 'education_level', 'ENCRYPTED:Secondary', 'text', false),
('770e8400-e29b-41d4-a716-446655440001', 'skills', 'ENCRYPTED:Teaching,Tailoring', 'text', false),

-- Joseph's attributes
('770e8400-e29b-41d4-a716-446655440002', 'refugee_status', 'ENCRYPTED:asylum_seeker', 'text', true),
('770e8400-e29b-41d4-a716-446655440002', 'unhcr_id', 'ENCRYPTED:UNHCR789012', 'text', true),
('770e8400-e29b-41d4-a716-446655440002', 'medical_conditions', 'ENCRYPTED:Diabetes', 'text', true),
('770e8400-e29b-41d4-a716-446655440002', 'education_level', 'ENCRYPTED:University', 'text', false),
('770e8400-e29b-41d4-a716-446655440002', 'skills', 'ENCRYPTED:Engineering,Construction', 'text', false),

-- Fatima's attributes
('770e8400-e29b-41d4-a716-446655440003', 'refugee_status', 'ENCRYPTED:refugee', 'text', true),
('770e8400-e29b-41d4-a716-446655440003', 'unhcr_id', 'ENCRYPTED:UNHCR345678', 'text', true),
('770e8400-e29b-41d4-a716-446655440003', 'medical_conditions', 'ENCRYPTED:None', 'text', true),
('770e8400-e29b-41d4-a716-446655440003', 'education_level', 'ENCRYPTED:Primary', 'text', false),
('770e8400-e29b-41d4-a716-446655440003', 'skills', 'ENCRYPTED:Cooking,Childcare', 'text', false);

-- Sample Consent Records
INSERT INTO consent_records (user_id, service_provider_id, attributes_shared, purpose, consent_given, consent_date, expiry_date) VALUES
(
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '["first_name", "last_name", "date_of_birth", "medical_conditions"]',
    'Access to healthcare services',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year'
),
(
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    '["first_name", "last_name", "education_level", "skills"]',
    'Enrollment in vocational training program',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '6 months'
);

-- Sample Authentication Logs
INSERT INTO authentication_logs (user_id, service_provider_id, auth_method, auth_status, ip_address, offline_mode) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'qr_code', 'success', '192.168.1.100', false),
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'pin', 'success', '192.168.1.100', true),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'qr_code', 'success', '192.168.1.101', false);

-- Sample Audit Logs
INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'user_registered', 'user', '{"method": "self_registration"}'),
('770e8400-e29b-41d4-a716-446655440001', 'consent_given', 'consent_record', '{"service_provider": "Hope Healthcare Clinic"}'),
('770e8400-e29b-41d4-a716-446655440002', 'user_registered', 'user', '{"method": "self_registration"}');

-- Display summary
SELECT 
    'Database seeded successfully!' as message,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM service_providers) as total_service_providers,
    (SELECT COUNT(*) FROM admin_users) as total_admins,
    (SELECT COUNT(*) FROM consent_records) as total_consents;
