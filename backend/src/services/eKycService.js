/**
 * e-KYC Service
 * Generates encrypted e-KYC responses for partners based on policies
 */

const pool = require('../config/database');
const logger = require('../utils/logger');
const encryption = require('../utils/encryption');
const { encryptPostQuantum } = require('../utils/postQuantumCrypto');

class EKYCService {
    /**
     * Generate e-KYC response for partner
     */
    async generateEKYCResponse(userId, partnerId, policyId) {
        try {
            // Get user data
            const userResult = await pool.query(
                `SELECT id, mosip_id, first_name, last_name, date_of_birth, gender, 
                nationality, email, phone, photo_url
                FROM users WHERE id = $1`,
                [userId]
            );

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = userResult.rows[0];

            // Get policy to determine what data to share
            const policy = await this.getPolicy(policyId);

            // Filter data based on policy
            const filteredData = this.filterDataByPolicy(user, policy);

            // Encrypt data
            const encryptedData = this.encryptEKYCData(filteredData);

            // Generate request ID
            const requestId = `EKYC_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            // Log e-KYC request
            await pool.query(
                `INSERT INTO ekyc_requests 
                (user_id, partner_id, request_id, policy_id, data_shared, encrypted_response, status, consent_given, consent_timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, 'completed', true, CURRENT_TIMESTAMP)`,
                [userId, partnerId, requestId, policyId, JSON.stringify(Object.keys(filteredData)), encryptedData]
            );

            logger.info('e-KYC response generated', { userId, partnerId, requestId });

            return {
                requestId,
                encryptedData,
                dataShared: Object.keys(filteredData),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('e-KYC generation failed', { error: error.message, userId, partnerId });
            throw error;
        }
    }

    /**
     * Get policy configuration
     */
    async getPolicy(policyId) {
        try {
            if (!policyId) {
                // Return default policy
                return {
                    allowedFields: ['first_name', 'last_name', 'date_of_birth', 'gender'],
                    encryptionRequired: true
                };
            }

            const result = await pool.query(
                'SELECT policy_data FROM policies WHERE id = $1 AND status = \'active\'',
                [policyId]
            );

            if (result.rows.length === 0) {
                throw new Error('Policy not found or inactive');
            }

            return result.rows[0].policy_data;
        } catch (error) {
            logger.error('Failed to get policy', { error: error.message, policyId });
            throw error;
        }
    }

    /**
     * Filter user data based on policy
     */
    filterDataByPolicy(userData, policy) {
        const allowedFields = policy.allowedFields || [];
        const filteredData = {};

        allowedFields.forEach(field => {
            if (userData[field] !== undefined && userData[field] !== null) {
                filteredData[field] = userData[field];
            }
        });

        return filteredData;
    }

    /**
     * Encrypt e-KYC data
     */
    encryptEKYCData(data) {
        try {
            // Use post-quantum encryption for enhanced security
            const encrypted = encryptPostQuantum(JSON.stringify(data));
            return encrypted;
        } catch (error) {
            logger.error('e-KYC encryption failed', { error: error.message });
            // Fallback to classical encryption
            return encryption.encrypt(JSON.stringify(data));
        }
    }

    /**
     * Decrypt e-KYC data (for internal use)
     */
    decryptEKYCData(encryptedData) {
        try {
            const decrypted = encryption.decrypt(encryptedData);
            return JSON.parse(decrypted);
        } catch (error) {
            logger.error('e-KYC decryption failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Get e-KYC request history
     */
    async getEKYCHistory(userId, limit = 50) {
        try {
            const result = await pool.query(
                `SELECT er.request_id, er.partner_id, p.partner_name, er.data_shared, 
                er.status, er.created_at
                FROM ekyc_requests er
                LEFT JOIN partners p ON er.partner_id = p.id
                WHERE er.user_id = $1
                ORDER BY er.created_at DESC
                LIMIT $2`,
                [userId, limit]
            );

            return result.rows;
        } catch (error) {
            logger.error('Failed to get e-KYC history', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Validate e-KYC consent
     */
    async validateConsent(userId, partnerId) {
        try {
            const result = await pool.query(
                `SELECT consent_given, consent_timestamp, expiry_date
                FROM consent_records
                WHERE user_id = $1 AND service_provider_id = $2 AND revoked = false
                ORDER BY created_at DESC
                LIMIT 1`,
                [userId, partnerId]
            );

            if (result.rows.length === 0) {
                return { valid: false, reason: 'No consent found' };
            }

            const consent = result.rows[0];

            if (!consent.consent_given) {
                return { valid: false, reason: 'Consent not given' };
            }

            if (consent.expiry_date && new Date() > new Date(consent.expiry_date)) {
                return { valid: false, reason: 'Consent expired' };
            }

            return { valid: true };
        } catch (error) {
            logger.error('Consent validation failed', { error: error.message, userId, partnerId });
            throw error;
        }
    }
}

module.exports = new EKYCService();
