/**
 * Comprehensive Test Suite for MOSIP Services
 * Tests all authentication, VID, partner, and registration services
 */

const request = require('supertest');
const app = require('../src/server');
const pool = require('../src/config/database');

describe('MOSIP Services Test Suite', () => {
    let authToken;
    let testUserId;
    let testPartnerId;
    let testVID;

    beforeAll(async () => {
        // Setup test database or use test environment
        // Create test user
        const userResult = await pool.query(
            `INSERT INTO users (email, pin_hash, first_name, last_name, mosip_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
            ['test@example.com', 'hashedpin', 'Test', 'User', 'TEST123456']
        );
        testUserId = userResult.rows[0].id;
    });

    afterAll(async () => {
        // Cleanup test data
        await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
        await pool.end();
    });

    describe('Authentication Service', () => {
        test('Should send OTP successfully', async () => {
            const response = await request(app)
                .post('/api/authentication/otp/send')
                .send({
                    userId: testUserId,
                    type: 'sms'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('Should validate demographic data', async () => {
            const response = await request(app)
                .post('/api/authentication/demographic')
                .send({
                    userId: testUserId,
                    firstName: 'Test',
                    lastName: 'User',
                    dateOfBirth: '1990-01-01'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('matchScore');
        });
    });

    describe('Virtual ID Service', () => {
        test('Should generate temporary VID', async () => {
            const response = await request(app)
                .post('/api/vid/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    vidType: 'temporary'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.vid).toHaveLength(16);
            testVID = response.body.data.vid;
        });

        test('Should validate VID', async () => {
            const response = await request(app)
                .post('/api/vid/validate')
                .send({ vid: testVID });

            expect(response.status).toBe(200);
            expect(response.body.data.valid).toBe(true);
        });

        test('Should revoke VID', async () => {
            const response = await request(app)
                .post('/api/vid/revoke')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    vid: testVID,
                    reason: 'Test revocation'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Partner Service', () => {
        test('Should register new partner', async () => {
            const response = await request(app)
                .post('/api/partners/register')
                .send({
                    partnerName: 'Test Partner',
                    partnerType: 'auth',
                    organizationName: 'Test Org',
                    email: 'testpartner@example.com'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            testPartnerId = response.body.partner.id;
        });

        test('Should generate API key for partner', async () => {
            const response = await request(app)
                .post(`/api/partners/${testPartnerId}/api-key`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ keyType: 'sandbox' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('apiKey');
            expect(response.body).toHaveProperty('apiSecret');
        });
    });

    describe('Policy Service', () => {
        test('Should create default policies', async () => {
            const response = await request(app)
                .post('/api/policies/init-defaults')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('Should list policies', async () => {
            const response = await request(app)
                .get('/api/policies')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    describe('Resident Services', () => {
        test('Should lock authentication method', async () => {
            const response = await request(app)
                .post('/api/resident/auth/lock')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    authType: 'otp',
                    lockReason: 'Test lock'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('Should get transaction history', async () => {
            const response = await request(app)
                .get(`/api/resident/transactions/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    describe('Registration Service', () => {
        test('Should create registration packet', async () => {
            const response = await request(app)
                .post('/api/registration/packet/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    operatorId: 1,
                    demographicData: {
                        firstName: 'John',
                        lastName: 'Doe',
                        dateOfBirth: '1990-01-01'
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });
});

describe('Integration Tests', () => {
    test('Complete authentication flow', async () => {
        // 1. Send OTP
        const otpResponse = await request(app)
            .post('/api/authentication/otp/send')
            .send({ userId: testUserId, type: 'sms' });

        expect(otpResponse.status).toBe(200);

        // 2. Verify OTP (would need actual OTP in real scenario)
        // 3. Generate VID
        // 4. Use VID for authentication
    });

    test('Partner onboarding flow', async () => {
        // 1. Register partner
        // 2. Upload certificate
        // 3. Generate API key
        // 4. Map policy
    });
});
